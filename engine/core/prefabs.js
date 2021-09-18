export class Prefabs {
    static extend(...configurations) {
        return Object.merge({}, ...configurations);
    }
}