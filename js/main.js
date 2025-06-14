document.addEventListener('DOMContentLoaded', () => {
    // --- Basic Setup ---
    const mainContent = document.getElementById('main-content');
    const allProgramsGrid = document.getElementById('all-programs');
    const logoBtn = document.getElementById('logo');
    const programGrid = document.getElementById('program-grid');
    const pinnedAppsGrid = document.getElementById('pinned-apps');
    const windowTemplate = document.getElementById('window-template');

    let activeWindow = null;
    let highestZIndex = 100;
    const openWindows = {}; // To track open windows

    // --- Clock ---
    function updateClock() {
        const timeEl = document.getElementById('time');
        const dateEl = document.getElementById('date');
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dateEl.textContent = now.toLocaleDateString();
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- App Launcher ---
    logoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        allProgramsGrid.classList.toggle('hidden');
    });

    // Close 'All Programs' when clicking outside
    document.addEventListener('click', () => {
        if (!allProgramsGrid.classList.contains('hidden')) {
            allProgramsGrid.classList.add('hidden');
        }
    });
    allProgramsGrid.addEventListener('click', e => e.stopPropagation());

    // --- Window Management ---
    function createWindow(app) {
        // If window is already open but minimized, just show it.
        if (openWindows[app.name]) {
            const existingWindow = openWindows[app.name];
            existingWindow.classList.remove('hidden');
            highestZIndex++;
            existingWindow.style.zIndex = highestZIndex;
            activeWindow = existingWindow;
            return;
        }

        const newWindow = windowTemplate.firstElementChild.cloneNode(true);
        newWindow.classList.add('opening');
        newWindow.addEventListener('animationend', () => newWindow.classList.remove('opening'), { once: true });
        newWindow.querySelector('.title').textContent = app.name;
        
        if (app.icon) {
            const iconEl = newWindow.querySelector('.program-icon');
            if (iconEl) { // Check if element exists
                iconEl.style.backgroundImage = `url(${app.icon})`;
                iconEl.style.width = '24px';
                iconEl.style.height = '24px';
                iconEl.style.backgroundSize = 'contain';
                iconEl.style.backgroundRepeat = 'no-repeat';
                iconEl.style.backgroundPosition = 'center';
            }
        }

        const iframe = newWindow.querySelector('iframe');
        iframe.src = app.url;

        // Position new windows in a cascade
        const openWindowCount = mainContent.querySelectorAll('.window').length;
        newWindow.style.top = `${30 + (openWindowCount * 20)}px`;
        newWindow.style.left = `${150 + (openWindowCount * 20)}px`;


        mainContent.appendChild(newWindow);
        makeDraggable(newWindow);
        
        // --- Window Controls ---
        newWindow.querySelector('.close').addEventListener('click', () => {
            newWindow.classList.add('closing');
            newWindow.addEventListener('animationend', () => {
                newWindow.remove();
                delete openWindows[app.name];
            }, { once: true });
        });
        newWindow.querySelector('.minimize').addEventListener('click', () => newWindow.classList.add('hidden')); 

        newWindow.querySelector('.maximize').addEventListener('click', () => {
            newWindow.classList.toggle('maximized');
            if (newWindow.classList.contains('maximized')) {
                // Save original position and size
                newWindow.dataset.oldTop = newWindow.style.top;
                newWindow.dataset.oldLeft = newWindow.style.left;
                newWindow.dataset.oldWidth = newWindow.style.width;
                newWindow.dataset.oldHeight = newWindow.style.height;
                // Maximize with 10px margin
                newWindow.style.top = '10px';
                newWindow.style.left = '10px';
                newWindow.style.width = 'calc(100% - 20px)';
                newWindow.style.height = 'calc(100% - 20px)';
            } else {
                // Restore
                newWindow.style.top = newWindow.dataset.oldTop;
                newWindow.style.left = newWindow.dataset.oldLeft;
                newWindow.style.width = newWindow.dataset.oldWidth;
                newWindow.style.height = newWindow.dataset.oldHeight;
            }
        });

        // --- Focus Window ---
        newWindow.addEventListener('mousedown', () => {
            highestZIndex++;
            newWindow.style.zIndex = highestZIndex;
            activeWindow = newWindow;
        }, true);
        
        newWindow.style.zIndex = ++highestZIndex;
        activeWindow = newWindow;
        openWindows[app.name] = newWindow; // Track the new window

        // Hide "All Programs" view when an app is opened
        allProgramsGrid.classList.add('hidden');
    }
    
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const titleBar = element.querySelector(".title-bar");

        if (titleBar) {
            titleBar.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            highestZIndex++;
            element.style.zIndex = highestZIndex;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }


    // --- Program Management ---
    const defaultPrograms = [
        { name: 'Terminal', url: 'programs/terminal/index.html', icon: 'programs/terminal/icon.svg' },
        { name: 'Settings', url: 'programs/settings/index.html', icon: 'programs/settings/icon.svg' },
        { name: 'File Manager', url: 'programs/file-manager/index.html', icon: 'programs/file-manager/icon.svg' },
    ];

    function autoInstallDefaultApps() {
        defaultPrograms.forEach(app => packageManager.installLocal(app));
    }

    function renderPrograms() {
        const programs = packageManager.getPrograms();
        programGrid.innerHTML = '';
        programs.forEach(app => {
            const appElement = document.createElement('div');
            appElement.className = 'program-item';

            const isPinned = packageManager.isPinned(app.name);

            appElement.innerHTML = `
                <div class="icon" style="background-image: url('${app.icon}')"></div>
                <span class="name">${app.name}</span>
                <button class="pin-button">${isPinned ? '★' : '☆'}</button>
            `;
            
            appElement.querySelector('.icon').addEventListener('click', () => createWindow(app));
            appElement.querySelector('.name').addEventListener('click', () => createWindow(app));
            
            appElement.querySelector('.pin-button').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening the app
                if (packageManager.isPinned(app.name)) {
                    packageManager.unpinApp(app.name);
                } else {
                    packageManager.pinApp(app.name);
                }
                renderPrograms();
                renderPinnedApps();
            });

            programGrid.appendChild(appElement);
        });
    }

    function renderPinnedApps() {
        const pinnedApps = packageManager.getPinnedApps();
        pinnedAppsGrid.innerHTML = '';
        pinnedApps.forEach(app => {
            const appElement = document.createElement('div');
            appElement.className = 'pinned-app';
            appElement.style.backgroundImage = `url('${app.icon}')`;
            appElement.title = app.name; // Tooltip for app name
            appElement.addEventListener('click', () => createWindow(app));
            pinnedAppsGrid.appendChild(appElement);
        });
    }

    // Listen for refresh message from terminal and other apps
    window.addEventListener('message', (event) => {
        const { source, type, payload, reqId } = event.data;

        if (source !== 'ligos-app') {
            return;
        }

        // --- OS Management API ---
        if (type === 'os:setConfig') {
            if (payload.key === 'backgroundColor') {
                document.body.style.backgroundColor = payload.value;
                // You might want to save this to localStorage as well
                // localStorage.setItem('ligos_bgColor', payload.value);
            }
        }
        if (type === 'os:reset') {
            localStorage.clear();
            window.location.reload();
        }

        // --- App Management API ---
        if (type === 'app:refresh') {
            renderPrograms();
            renderPinnedApps();
        }

        // --- File System API ---
        if (type.startsWith('fs:')) {
            const command = type.split(':')[1];
            let result;

            switch(command) {
                case 'list':
                    result = ligfs.list(payload.path);
                    break;
                case 'readFile':
                    result = ligfs.readFile(payload.path);
                    break;
                case 'writeFile':
                    result = ligfs.writeFile(payload.path, payload.content);
                    break;
                case 'createDirectory':
                    result = ligfs.createDirectory(payload.path);
                    break;
                case 'delete':
                    result = ligfs.delete(payload.path);
                    break;
                default:
                    result = { success: false, error: 'Unknown fs command' };
            }
            
            // Send response back to the app if it expects one
            if (reqId && event.source) {
                event.source.postMessage({ source: 'ligos-os', reqId, ...result }, event.origin);
            }
        }
    });


    // --- Initial Load ---
    function init() {
        if (packageManager.getPrograms().length === 0) {
            autoInstallDefaultApps();
        }
        renderPrograms();
        renderPinnedApps();
    }

    init();
}); 