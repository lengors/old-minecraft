export class Exception {
    cause;
    description;

    constructor() {
        this.cause = arguments[1] || new Error();
        this.description = arguments[0] || null;
    }

    getColumn() {
        if (this.cause instanceof Error)
            return this.cause.columnNumber;
        return this.cause.getColumn();
    }

    getLine() {
        if (this.cause instanceof Error)
            return this.cause.lineNumber;
        return this.cause.getLine();
    }

    getStack() {
        if (this.cause instanceof Error)
            return this.cause.stack;
        return this.cause.getStack();
    }
}

export class IllegalArgumentException extends Exception {
    constructor() {
        super(...arguments);
    }
}