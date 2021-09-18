import { Debug } from "../core/debug.js";

export class Reflection {
    static isArray(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    }

    static isBoolean(value) {
        return Object.prototype.toString.call(value) === '[object Boolean]';
    }

    static isCallable(callable) {
        if (!callable)
            return false;
        return callable instanceof Function;
    }

    static isConstructor(constructor) {
        if (!Reflection.isCallable(constructor))
            return false;
        if (!constructor.prototype)
            return false;
        if (!constructor.prototype.constructor)
            return false;
        return constructor.prototype.constructor.toString().trim().startsWith('class');
    }

    static isFunction(value) {
        return Reflection.isCallable(value) && !Reflection.isConstructor(constructor);
    }

    static isObject(value) {
        return Object.prototype.toString.call(value) == '[object Object]';
    }

    static isSubclass(testClass, parentClass, inclusive) {
        inclusive = inclusive || true;
        Debug.assert(Reflection.isBoolean(inclusive));
        if (!(Reflection.isConstructor(testClass) && Reflection.isCallable(parentClass)))
            return false;
        if (inclusive)
            return testClass.prototype instanceof parentClass || testClass == parentClass;
        return testClass.prototype instanceof parentClass;
    }

    static isString(value) {
        return Object.prototype.toString.call(value) === '[object String]';
    }
}