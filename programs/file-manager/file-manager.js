document.addEventListener('DOMContentLoaded', () => {
    const fileList = document.getElementById('file-list');
    const pathBar = document.getElementById('path-bar');
    const newFolderBtn = document.getElementById('new-folder');
    const newFileBtn = document.getElementById('new-file');

    let currentPath = '/';
    
    // --- API for FS communication ---
    let nextReqId = 1;
    const pendingRequests = {};

    function fsRequest(type, payload) {
        return new Promise((resolve, reject) => {
            const reqId = nextReqId++;
            pendingRequests[reqId] = { resolve, reject };
            window.parent.postMessage({ source: 'ligos-app', type, payload, reqId }, '*');
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
        if (response.source !== 'ligos-os' || !response.reqId || !pendingRequests[response.reqId]) return;
        
        const { resolve, reject } = pendingRequests[response.reqId];
        if (response.success) {
            resolve(response.data);
        } else {
            reject(new Error(response.error));
        }
        delete pendingRequests[response.reqId];
    });

    // --- UI Rendering ---
    async function render(path) {
        currentPath = path;
        pathBar.textContent = path;
        fileList.innerHTML = '';

        try {
            // Add '..' for navigating up
            if (currentPath !== '/') {
                const upEl = createItemElement('..', { type: 'directory' });
                upEl.addEventListener('dblclick', () => {
                    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
                    render(parentPath);
                });
                fileList.appendChild(upEl);
            }

            const items = await fsRequest('fs:list', { path });
            // Sort to show folders first
            const sortedItems = Object.entries(items).sort((a, b) => {
                if (a[1].type === b[1].type) return a[0].localeCompare(b[0]);
                return a[1].type === 'directory' ? -1 : 1;
            });
            
            for (const [name, details] of sortedItems) {
                const itemEl = createItemElement(name, details);
                if (details.type === 'directory') {
                    itemEl.addEventListener('dblclick', () => render(`${path === '/' ? '' : path}/${name}`));
                } else {
                    // Placeholder for file opening
                    itemEl.addEventListener('dblclick', () => alert(`Opening ${name}. Content:\n\n${details.content}`));
                }
                fileList.appendChild(itemEl);
            }
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        }
    }

    function createItemElement(name, details) {
        const itemEl = document.createElement('div');
        itemEl.className = 'file-item';
        itemEl.innerHTML = `
            <div class="icon ${details.type}"></div>
            <span class="name">${name}</span>
            ${name !== '..' ? '<button class="delete-btn">X</button>' : ''}
        `;

        if (name !== '..') {
            itemEl.querySelector('.delete-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${name}?`)) {
                    try {
                        await fsRequest('fs:delete', { path: `${currentPath === '/' ? '' : currentPath}/${name}` });
                        render(currentPath); // Refresh
                    } catch (error) {
                        alert(`Failed to delete: ${error.message}`);
                    }
                }
            });
        }
        return itemEl;
    }

    // --- Event Listeners ---
    newFolderBtn.addEventListener('click', async () => {
        const name = prompt('Enter new folder name:');
        if (name) {
            try {
                await fsRequest('fs:createDirectory', { path: `${currentPath === '/' ? '' : currentPath}/${name}` });
                render(currentPath);
            } catch (error) {
                alert(`Error creating folder: ${error.message}`);
            }
        }
    });

    newFileBtn.addEventListener('click', async () => {
        const name = prompt('Enter new file name:');
        if (name) {
            const content = prompt('Enter file content:', '');
            try {
                await fsRequest('fs:writeFile', { path: `${currentPath === '/' ? '' : currentPath}/${name}`, content });
                render(currentPath);
            } catch (error) {
                alert(`Error creating file: ${error.message}`);
            }
        }
    });
    
    // Initial render
    render(currentPath);
}); 