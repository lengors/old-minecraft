import { Debug } from "../core/debug.js";
import { Reflection } from "./reflection.js";
import { IllegalArgumentException } from "../core/exceptions.js";

export class ArgumentsParser {
    static VARARGS = () => true;
    static ANYTHING = () => true;

    options;
    fallback;

    constructor(fallback) {
        this.options = Array();
        this.fallback = fallback || null;
        if (this.fallback)
            Debug.assert(Reflection.isFunction(this.fallback));
    }

    bind() {
        return ArgumentsParser.prototype.parse.bind(this);
    }

    on(checkers, callback) {
        Debug.assert(checkers instanceof Array, IllegalArgumentException);
        Debug.assert(Reflection.isCallable(callback), IllegalArgumentException);
        Debug.assert(!Reflection.isConstructor(callback), IllegalArgumentException);
        for (let i = 0; i < checkers.length; ++i)
            checkers[i] = ArgumentsParser.parseChecker(checkers[i])
        this.options.push([checkers, callback]);
        this.options.sort((option0, option1) => option1[0].length - option0[0].length);
        return this;
    }

    parse() {
        let validCallback = null;
        for (const [checkers, callback] of this.options) {
            let cI, aI;
            let valid = true;
            for (cI = 0, aI = 0; cI < checkers.length && aI < arguments.length && valid; cI += Number(checkers[cI] != ArgumentsParser.VARARGS), ++aI)
                valid = checkers[cI](arguments[aI]);
            if (valid && aI == arguments.length && (cI == checkers.length || checkers[cI] == ArgumentsParser.VARARGS)) {
                validCallback = callback;
                break;
            }
        }
        if (validCallback)
            return validCallback(...arguments);
        if (this.fallback)
            return this.fallback(...arguments);
        Debug.assert(false, IllegalArgumentException, "no valid argument pattern found");
    }

    static parseChecker(checker) {
        if (!Reflection.isCallable(checker))
            return argument => argument == checker;
        else if (Reflection.isConstructor(checker))
            return argument => argument instanceof checker;
        else
            return checker;
    }
}