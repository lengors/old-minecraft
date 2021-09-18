export class Component {
    constructor(gameObject) {
        this._gameObject = gameObject;
    }

    destroy() {
        // Implemented in subclasses
    }

    initialize() {
        // Implemented in subclasses
    }
}