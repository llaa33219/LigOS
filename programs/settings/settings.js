document.addEventListener('DOMContentLoaded', () => {
    const bgColorPicker = document.getElementById('bg-color-picker');
    const resetBtn = document.getElementById('reset-os-btn');
    const appListDiv = document.getElementById('app-list');
    
    // --- API for OS communication ---
    let nextReqId = 1;
    const pendingRequests = {};

    function osRequest(type, payload) {
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
    
    // --- Generic post for actions that don't need a reply ---
    function postToOS(type, payload) {
        window.parent.postMessage({ source: 'ligos-app', type, payload }, '*');
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

    // --- App Management ---
    async function renderAppList() {
        appListDiv.innerHTML = 'Loading...';
        try {
            const [programs, pinned] = await Promise.all([
                osRequest('app:getPrograms'),
                osRequest('app:getPinned')
            ]);
            const pinnedSet = new Set(pinned.map(p => p.name));

            appListDiv.innerHTML = ''; // Clear loading text
            programs.forEach(app => {
                const isPinned = pinnedSet.has(app.name);
                const appItem = document.createElement('div');
                appItem.className = 'app-item';
                appItem.innerHTML = `
                    <div class="icon" style="background-image: url('../${app.icon}')"></div>
                    <span class="name">${app.name}</span>
                    <div class="actions">
                        <button class="pin-btn">${isPinned ? 'Unpin' : 'Pin'}</button>
                        <button class="uninstall-btn">Uninstall</button>
                    </div>
                `;
                
                appItem.querySelector('.pin-btn').addEventListener('click', async () => {
                    await osRequest(isPinned ? 'app:unpin' : 'app:pin', { name: app.name });
                    renderAppList(); // Refresh list
                });

                appItem.querySelector('.uninstall-btn').addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to uninstall ${app.name}?`)) {
                        await osRequest('app:uninstall', { name: app.name });
                        renderAppList(); // Refresh list
                    }
                });

                appListDiv.appendChild(appItem);
            });

        } catch (error) {
            appListDiv.innerHTML = `Error loading apps: ${error.message}`;
            console.error(error);
        }
    }


    // --- Event Listeners ---
    bgColorPicker.addEventListener('input', (e) => {
        postToOS('os:setConfig', { key: 'backgroundColor', value: e.target.value });
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('This will delete all apps and files. Are you sure?')) {
            postToOS('os:reset', null);
        }
    });

    // --- Initial Load ---
    async function init() {
        try {
            const bgColor = await osRequest('os:getConfig', { key: 'backgroundColor' });
            if (bgColor) {
                bgColorPicker.value = bgColor;
            }
        } catch (e) {
            // Use default if not set
            bgColorPicker.value = '#2e3440';
        }
        renderAppList();
    }

    init();
}); 