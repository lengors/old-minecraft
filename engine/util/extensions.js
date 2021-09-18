import { Reflection } from "./reflection.js";

Array.prototype.split = function (func) {
    return this.reduce((previousValue, currentValue, currentIndex) => {
        const index = func(currentValue, currentIndex);
        (previousValue[index] = previousValue[index] || []).push(currentValue);
        return previousValue;
    }, []);
}

Array.prototype.zip = function (...arrays) {
    const newArrays = [this, ...arrays];
    return this.map((_, index) => newArrays.map(array => array[index]));
}

Object.merge = function (target, ...objects) {
    if (objects.length == 0)
        return target;
    const [object, ...others] = objects;
    for (const key in object)
        if (object[key].constructor === Object)
            target[key] = Object.merge(target[key] && target[key].constructor == Object ? target[key] : {}, object[key]);
        else if (Reflection.isArray(object[key]))
            target[key] = Object.merge(Reflection.isArray(target[key]) ? target[key] : [], object[key]);
        else
            target[key] = object[key];
    return Object.merge(target, ...others);
}