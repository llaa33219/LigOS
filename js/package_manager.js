// LigOS Package Manager

class PackageManager {
    constructor() {
        this.programs = JSON.parse(localStorage.getItem('ligos_programs')) || [];
        this.pinnedApps = JSON.parse(localStorage.getItem('ligos_pinned_apps')) || [];
    }

    save() {
        localStorage.setItem('ligos_programs', JSON.stringify(this.programs));
        localStorage.setItem('ligos_pinned_apps', JSON.stringify(this.pinnedApps));
    }

    getPrograms() {
        return this.programs;
    }

    installLocal(appData) {
        // Check if already installed
        if (this.programs.find(p => p.name === appData.name)) {
            return;
        }
        this.programs.push(appData);
        this.save();
    }

    async install(url) {
        // CORS proxy needed to fetch details from arbitrary URLs.
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        
        try {
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            if (!response.ok) throw new Error('Failed to fetch URL metadata.');

            const data = await response.json();
            const html = data.contents;
            
            // Basic parsing, not robust.
            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            const title = titleMatch ? titleMatch[1] : 'Untitled';

            const faviconMatch = html.match(/<link rel="icon".*?href="(.*?)"/);
            let faviconUrl = faviconMatch ? faviconMatch[1] : null;

            if (faviconUrl && !faviconUrl.startsWith('http')) {
                const urlObj = new URL(url);
                faviconUrl = `${urlObj.origin}${faviconUrl}`;
            }

            const newApp = {
                name: title,
                url: url,
                icon: faviconUrl || 'assets/default-icon.svg' // Provide a default icon
            };

            this.programs.push(newApp);
            this.save();
            
            console.log(`Installed ${title}`);
            return newApp;

        } catch (error) {
            console.error('Installation failed:', error);
            return null;
        }
    }

    uninstall(appName) {
        this.programs = this.programs.filter(p => p.name !== appName);
        this.unpinApp(appName); // Also unpin if uninstalled
        this.save();
    }

    isPinned(appName) {
        return this.pinnedApps.includes(appName);
    }

    pinApp(appName) {
        if (!this.isPinned(appName)) {
            this.pinnedApps.push(appName);
            this.save();
        }
    }

    unpinApp(appName) {
        this.pinnedApps = this.pinnedApps.filter(name => name !== appName);
        this.save();
    }

    getPinnedApps() {
        return this.pinnedApps
            .map(appName => this.programs.find(p => p.name === appName))
            .filter(Boolean); // Filter out any apps that might have been uninstalled but are still in the pinned list
    }
}

window.packageManager = new PackageManager(); 