import "./utils.js";

export class AngleRepresentation {
    static Radians = new AngleRepresentation('Radians', {
        Degrees: Math.toDegrees,
        Radians: radians => radians,
    });

    static Degrees = new AngleRepresentation('Degrees', {
        Degrees: degrees => degrees,
        Radians: Math.toRadians
    });

    constructor(name, conversions) {
        this.name = name;
        this.conversions = conversions;
    }

    convert(target, ...values) {
        const results = [];
        const conversion = this.conversions[target.name];
        for (const value of values)
            results.push(conversion(value));
        return results;
    }
}