import { ArgumentsParser } from "../util/parser.js";

Math.toDegrees = new ArgumentsParser()
    .on([Number.isFinite], radians => radians * 180 / Math.PI)
    .bind();

Math.toRadians = new ArgumentsParser()
    .on([Number.isFinite], degrees => degrees * Math.PI / 180)
    .bind();

Math.average = function (...values) {
    return values.reduce((previousValue, currentValue) => previousValue + currentValue, 0) / values.length;
}

Math.choice = function (...values) {
    return values[Math.floor(Math.random() * values.length)];
}

Math.lerp = function (start, end, factor) {
    return start + (end - start) * factor;
}

Math.map = function (value, start, end, targetStart, targetEnd) {
    return Math.mapper(start, end, targetStart, targetEnd)(value);
}

Math.mapper = function (start, end, targetStart, targetEnd) {
    const multiplier = (targetEnd - targetStart) / (end - start);
    const increment = targetStart - start * multiplier;
    return value => value * multiplier + increment;
}

Math.trignometricLerp = function (start, end, factor) {
    return Math.lerp(start, end, (1 - Math.cos(factor * Math.PI)) * 0.5);
}