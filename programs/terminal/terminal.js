document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const input = document.getElementById('input');
    const terminalContainer = document.getElementById('terminal-container');
    
    let currentPath = '/';
    let commandHistory = [];
    let historyIndex = -1;

    // --- API for FS communication ---
    let nextReqId = 1;
    const pendingRequests = {};

    function fsRequest(type, payload) {
        return new Promise((resolve, reject) => {
            const reqId = nextReqId++;
            pendingRequests[reqId] = { resolve, reject };
            window.parent.postMessage({ source: 'ligos-app', type, payload, reqId }, '*');
            // Timeout for requests
            setTimeout(() => {
                if (pendingRequests[reqId]) {
                    reject(new Error('Request timed out'));
                    delete pendingRequests[reqId];
                }
            }, 5000);
        });
    }
    
    window.addEventListener('message', (event) => {
        const response = event.data;
        if (response.source !== 'ligos-os' || !response.reqId || !pendingRequests[response.reqId]) {
            return;
        }
        const { resolve, reject } = pendingRequests[response.reqId];
        if (response.success) {
            resolve(response.data);
        } else {
            reject(new Error(response.error));
        }
        delete pendingRequests[response.reqId];
    });


    // --- Command Handling ---
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            input.value = '';
            historyIndex = -1;
            if (command) {
                commandHistory.unshift(command);
                printToOutput(`${currentPath} $> ${command}`);
                handleCommand(command);
            }
        } else if (e.key === 'ArrowUp') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex];
            } else {
                historyIndex = -1;
                input.value = '';
            }
        }
    });

    function printToOutput(text, isHTML = false) {
        const div = document.createElement('div');
        if (isHTML) {
            div.innerHTML = text;
        } else {
            div.textContent = text;
        }
        output.appendChild(div);
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }

    function resolvePath(path) {
        if (!path) return currentPath;
        if (path.startsWith('/')) return path;
        // Simple path resolution
        const newPath = (currentPath === '/' ? '' : currentPath) + '/' + path;
        return newPath.replace(/\/+/g, '/');
    }

    async function handleCommand(command) {
        const [cmd, ...args] = command.split(/\s+/);

        try {
            switch (cmd) {
                case 'help':
                    printToOutput('Available: help, clear, echo, lig, ls, cat, touch, mkdir, rm');
                    break;
                case 'clear':
                    output.innerHTML = '';
                    break;
                case 'echo':
                    printToOutput(args.join(' '));
                    break;
                case 'lig':
                    if (args[0] === 'install' && args[1]) {
                        printToOutput(`Installing from ${args[1]}...`);
                        const packageManager = window.parent.packageManager; // Direct access for simplicity here
                        const newApp = await packageManager.install(args[1]);
                        if (newApp) {
                            printToOutput(`Successfully installed: ${newApp.name}`);
                            window.parent.postMessage({ source: 'ligos-app', type: 'app:refresh'}, '*');
                        } else {
                            printToOutput('Installation failed. See console in main window for details.');
                        }
                    } else {
                        printToOutput('Usage: lig install <url>');
                    }
                    break;
                case 'ls':
                    const files = await fsRequest('fs:list', { path: resolvePath(args[0]) });
                    let outputHTML = '';
                    for (const [name, details] of Object.entries(files)) {
                        const color = details.type === 'directory' ? '#81D4FA' : '#F0F0F0';
                        outputHTML += `<span style="color:${color}; margin-right: 15px;">${name}</span>`;
                    }
                    printToOutput(outputHTML, true);
                    break;
                case 'cat':
                    if (!args[0]) { printToOutput('Usage: cat <file>'); break; }
                    const content = await fsRequest('fs:readFile', { path: resolvePath(args[0]) });
                    printToOutput(content);
                    break;
                case 'touch':
                    if (!args[0]) { printToOutput('Usage: touch <file>'); break; }
                    await fsRequest('fs:writeFile', { path: resolvePath(args[0]), content: '' });
                    break;
                case 'mkdir':
                     if (!args[0]) { printToOutput('Usage: mkdir <directory>'); break; }
                    await fsRequest('fs:createDirectory', { path: resolvePath(args[0]) });
                    break;
                case 'rm':
                    if (!args[0]) { printToOutput('Usage: rm <file_or_directory>'); break; }
                    await fsRequest('fs:delete', { path: resolvePath(args[0]) });
                    break;
                default:
                    printToOutput(`Command not found: ${cmd}`);
                    break;
            }
        } catch (error) {
            printToOutput(`Error: ${error.message}`);
        }
    }

    printToOutput('LigOS Terminal v0.2');
    printToOutput('Type "help" for a list of commands.');
}); 