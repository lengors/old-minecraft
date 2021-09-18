import { Exception } from "./exceptions.js";
import { Reflection } from "../util/reflection.js";

export class Debug {
    static assert(assertion, exception, ...args) {
        if (!assertion) {
            exception = exception || new Exception();
            if (Reflection.isConstructor(exception))
                exception = new exception(...args);
            else if (Reflection.isCallable(exception))
                exception = exception(...args);
            throw exception;
        }
    }
}