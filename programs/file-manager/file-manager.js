document.addEventListener('DOMContentLoaded', () => {
    const fileList = document.getElementById('file-list');
    const pathBar = document.getElementById('path-bar');
    const newFolderBtn = document.getElementById('new-folder');
    const newFileBtn = document.getElementById('new-file');
    const contextMenu = document.getElementById('context-menu');
    const renameOption = document.getElementById('rename-option');
    const deleteOption = document.getElementById('delete-option');
    const fileViewerModal = document.getElementById('file-viewer-modal');
    const fileViewerTitle = document.getElementById('file-viewer-title');
    const fileViewerTextarea = document.getElementById('file-viewer-textarea');
    const fileViewerCloseBtn = document.getElementById('file-viewer-close');
    const fileViewerSaveBtn = document.getElementById('file-viewer-save');

    let currentPath = '/';
    let activeElementForContextMenu = null;
    let currentlyOpenFile = null;
    
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

    // --- Context Menu ---
    function showContextMenu(e, itemEl) {
        e.preventDefault();
        e.stopPropagation();
        activeElementForContextMenu = itemEl;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.classList.remove('hidden');
    }

    function hideContextMenu() {
        contextMenu.classList.add('hidden');
        activeElementForContextMenu = null;
    }

    document.addEventListener('click', hideContextMenu);
    contextMenu.addEventListener('click', e => e.stopPropagation());

    // --- UI Rendering ---
    async function render(path) {
        currentPath = path;
        pathBar.textContent = path;
        fileList.innerHTML = '';
        hideContextMenu();

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
                    itemEl.addEventListener('dblclick', () => openFileViewer(`${path === '/' ? '' : path}/${name}`));
                }
                // Add context menu listener
                itemEl.addEventListener('contextmenu', (e) => showContextMenu(e, itemEl));
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
        itemEl.dataset.name = name; // Store name for later use
        itemEl.dataset.type = details.type;
        itemEl.innerHTML = `
            <div class="icon ${details.type}"></div>
            <span class="name">${name}</span>
        `;
        return itemEl;
    }

    function handleRename() {
        if (!activeElementForContextMenu) return;
        
        const nameSpan = activeElementForContextMenu.querySelector('.name');
        const currentName = nameSpan.textContent;
        nameSpan.innerHTML = `<input type="text" value="${currentName}" />`;
        const input = nameSpan.querySelector('input');
        input.focus();
        input.select();
        hideContextMenu();

        const finishRename = async () => {
            const newName = input.value.trim();
            input.removeEventListener('blur', finishRename);
            input.removeEventListener('keydown', handleKey);
            
            if (newName && newName !== currentName) {
                try {
                    const oldPath = `${currentPath === '/' ? '' : currentPath}/${currentName}`;
                    const newPath = `${currentPath === '/' ? '' : currentPath}/${newName}`;
                    await fsRequest('fs:rename', { oldPath, newPath });
                } catch (error) {
                    alert(`Error renaming: ${error.message}`);
                } finally {
                    render(currentPath); // Refresh view
                }
            } else {
                 nameSpan.innerHTML = currentName; // Restore if no change
            }
        };
        
        const handleKey = (e) => {
            if (e.key === 'Enter') {
                finishRename();
            } else if (e.key === 'Escape') {
                input.value = currentName; // Revert changes
                finishRename();
            }
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', handleKey);
    }

    async function handleDelete() {
        if (!activeElementForContextMenu) return;
        const name = activeElementForContextMenu.dataset.name;
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await fsRequest('fs:delete', { path: `${currentPath === '/' ? '' : currentPath}/${name}` });
                render(currentPath); // Refresh
            } catch (error) {
                alert(`Failed to delete: ${error.message}`);
            }
        }
        hideContextMenu();
    }
    
    // --- Event Listeners ---
    renameOption.addEventListener('click', handleRename);
    deleteOption.addEventListener('click', handleDelete);
    
    newFolderBtn.addEventListener('click', async () => {
        // Find a unique name like "Untitled folder", "Untitled folder 2", etc.
        let name = 'Untitled folder';
        let counter = 1;
        const items = await fsRequest('fs:list', { path: currentPath });
        while (name in items) {
            counter++;
            name = `Untitled folder ${counter}`;
        }
        
        try {
            const newPath = `${currentPath === '/' ? '' : currentPath}/${name}`;
            await fsRequest('fs:createDirectory', { path: newPath });
            await render(currentPath); // Re-render to show the new folder

            // Find the new element and trigger rename on it
            const newElement = Array.from(fileList.children).find(el => el.dataset.name === name);
            if (newElement) {
                activeElementForContextMenu = newElement;
                handleRename();
            }
        } catch (error) {
            alert(`Error creating folder: ${error.message}`);
        }
    });

    newFileBtn.addEventListener('click', async () => {
        // Similar logic for new file
        let name = 'Untitled file';
        let counter = 1;
        const items = await fsRequest('fs:list', { path: currentPath });
        while (name in items) {
            counter++;
            name = `Untitled file ${counter}`;
        }

        try {
            const newPath = `${currentPath === '/' ? '' : currentPath}/${name}`;
            await fsRequest('fs:writeFile', { path: newPath, content: '' });
            await render(currentPath); // Re-render

            const newElement = Array.from(fileList.children).find(el => el.dataset.name === name);
            if (newElement) {
                activeElementForContextMenu = newElement;
                handleRename();
            }
        } catch (error) {
            alert(`Error creating file: ${error.message}`);
        }
    });
    
    // --- File Viewer Modal ---
    async function openFileViewer(path) {
        try {
            const content = await fsRequest('fs:readFile', { path });
            currentlyOpenFile = path;
            fileViewerTitle.textContent = path.split('/').pop();
            fileViewerTextarea.value = content || '';
            fileViewerModal.classList.remove('hidden');
        } catch (error) {
            alert(`Error opening file: ${error.message}`);
        }
    }

    function closeFileViewer() {
        // Here you could add a check for unsaved changes
        fileViewerModal.classList.add('hidden');
        currentlyOpenFile = null;
    }

    async function saveFile() {
        if (!currentlyOpenFile) return;
        try {
            const newContent = fileViewerTextarea.value;
            await fsRequest('fs:writeFile', { path: currentlyOpenFile, content: newContent });
            closeFileViewer();
        } catch (error) {
            alert(`Error saving file: ${error.message}`);
        }
    }

    fileViewerCloseBtn.addEventListener('click', closeFileViewer);
    fileViewerSaveBtn.addEventListener('click', saveFile);
    fileViewerModal.addEventListener('click', (e) => {
        // Close if clicked on the background overlay
        if (e.target === fileViewerModal) {
            closeFileViewer();
        }
    });

    // Initial render
    render(currentPath);
}); 