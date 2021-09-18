export class System {
    constructor(configuration = {}) {
        this._configuration = {};
        for (const key in configuration)
            if (!key.startsWith('_')) {
                this._configuration[key] = configuration[key];
                this[key] = new Set();
            }
    }

    onGameObjectCreate(object) {
        const caches = [];
        for (const key in this._configuration)
            if (this.application.isGameObject(object, this._configuration[key])) {
                this[key].add(object);
                caches.push(this[key]);
            }
        return caches;
    }

    onGameObjectDestroy(object) {
        const caches = [];
        for (const key in this._configuration)
            if (this[key].delete(object))
                caches.push(this[key]);
        return caches;
    }
}