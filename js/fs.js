// LigOS File System (LocalStorage based)

class LigFS {
    constructor() {
        this.fs = JSON.parse(localStorage.getItem('ligos_fs'));
        if (!this.fs) {
            this.fs = {
                '/': { type: 'directory', name: '/', children: {} }
            };
            this.save();
        }
    }

    save() {
        localStorage.setItem('ligos_fs', JSON.stringify(this.fs));
    }

    _findNode(path) {
        const parts = path.split('/').filter(Boolean);
        let current = this.fs['/'];
        if (path === '/') return current;

        for (const part of parts) {
            if (current.type !== 'directory' || !current.children[part]) {
                return null; // Not found
            }
            current = current.children[part];
        }
        return current;
    }

    _getParent(path) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0) return null; // root has no parent
        const parentPath = '/' + parts.slice(0, -1).join('/');
        return this._findNode(parentPath);
    }
    
    list(path) {
        const node = this._findNode(path);
        if (node && node.type === 'directory') {
            return { success: true, data: node.children };
        }
        return { success: false, error: 'Directory not found' };
    }

    readFile(path) {
        const node = this._findNode(path);
        if (node && node.type === 'file') {
            return { success: true, data: node.content };
        }
        return { success: false, error: 'File not found' };
    }

    writeFile(path, content) {
        const parent = this._getParent(path);
        const name = path.split('/').pop();
        if (parent && parent.type === 'directory') {
            parent.children[name] = { type: 'file', name, content };
            this.save();
            return { success: true };
        }
        return { success: false, error: 'Invalid path or parent directory does not exist' };
    }

    createDirectory(path) {
        const parent = this._getParent(path);
        const name = path.split('/').pop();
        if (parent && parent.type === 'directory') {
            if (parent.children[name]) {
                return { success: false, error: 'Directory or file already exists' };
            }
            parent.children[name] = { type: 'directory', name, children: {} };
            this.save();
            return { success: true };
        }
        return { success: false, error: 'Invalid path or parent directory does not exist' };
    }

    delete(path) {
        const { parent, nodeName } = this._findNode(path, true);
        if (!parent || !(nodeName in parent.children)) {
            return { success: false, error: 'File or directory not found' };
        }
        delete parent.children[nodeName];
        this.save();
        return { success: true };
    }

    rename(oldPath, newPath) {
        if (oldPath === '/' || newPath === '/') {
            return { success: false, error: 'Cannot rename root' };
        }

        const { parent: oldParent, node: oldNode, nodeName: oldName } = this._findNode(oldPath, false);
        if (!oldNode) {
            return { success: false, error: 'Source file or directory not found' };
        }

        const newPathParts = newPath.split('/').filter(p => p);
        const newName = newPathParts.pop();
        const newParentPath = '/' + newPathParts.join('/');
        
        const { node: newParent } = this._findNode(newParentPath, false);
        if (!newParent || newParent.type !== 'directory') {
            return { success: false, error: 'Target directory not found' };
        }

        if (newName in newParent.children) {
            return { success: false, error: 'A file or directory with that name already exists' };
        }
        
        // Copy node to new parent and delete old one
        newParent.children[newName] = oldNode;
        delete oldParent.children[oldName];

        this.save();
        return { success: true };
    }
}

window.ligfs = new LigFS(); 