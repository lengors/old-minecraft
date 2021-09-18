export class Manager {
    counter;
    disposed = new Set();

    constructor() {
        this.counter = 0;
    }

    dispose(value) {
        this.disposed.add(value);
    }

    get() {
        let value = this.disposed.values().next().value;
        return this.disposed.delete(value) ? value : this.counter++;
    }
}