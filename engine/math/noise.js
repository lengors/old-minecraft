import "./utils.js";
import { Exception } from "../core/exceptions.js";

// Adapted from: https://stackoverflow.com/a/19301306
export class Noise {
    w = 123456789;
    z = 987654321;
    mask = 0xffffffff;

    constructor(configuration = {}) {
        const seed = Number.isFinite(configuration.seed) ? configuration.seed : Math.floor(performance.now());
        this.w = (this.w + seed) & this.mask;
        this.z = (this.z - seed) & this.mask;
    }

    nextInt() {
        this.w = (18000 * (this.w & 65535) + (this.w >> 16)) & this.mask;
        this.z = (36969 * (this.z & 65535) + (this.z >> 16)) & this.mask;
        return ((this.z << 16) + (this.w & 65535)) >>> 0;
    }

    nextFloat() {
        return this.nextInt() / 4294967296;
    }
}

export class PerlinNoise {
    lerp;
    bitTable;
    gradients;
    dimensions;

    constructor(configuration = {}) {
        this.dimensions = configuration.dimensions || [256];
        this.lerp = configuration.lerp || Math.trignometricLerp;
        configuration.noise = configuration.noise || new Noise(configuration);

        // Build noise
        this.gradients = {};

        // Helper
        let index = this.dimensions.length - 1;

        // Initialize point
        const point = Array.apply(null, Array(this.dimensions.length)).map(() => 0);

        // Build noise
        while (index >= 0) {

            // Generate gradient
            const gradient = [];
            let squaredMagnitude = 0;
            for (let i = 0; i < point.length; ++i)
                squaredMagnitude += Math.pow(gradient[i] = (configuration.noise.nextFloat() * 2 - 1), 2);

            // Normalize gradient
            const inversedMagnitude = 1 / Math.sqrt(squaredMagnitude);
            for (let i = 0; i < point.length; ++i)
                gradient[i] *= inversedMagnitude;

            // Next float
            this.gradients[point] = gradient;

            // Next point
            while (index >= 0 && ++point[index] == this.dimensions[index])
                point[index--] = 0;

            // Reset
            if (index >= 0)
                index = this.dimensions.length - 1;
        }

        // Build bit table
        this.bitTable = [[0], [1]];
        for (let i = 1; i < this.dimensions.length; ++i) {
            const newTable = [];
            for (const value of [0, 1])
                for (const combination of this.bitTable)
                    newTable.push(combination.concat([value]));
            this.bitTable = newTable;
        }
    }

    get(...position) {

        // Get start
        const start = position.map(Math.floor);

        // Points
        const points = [];

        // Calculate lattice points
        for (const vector of this.bitTable)
            points.push(start.map((value, index) => value + vector[index]));

        // Gradients
        const gradients = [];

        // Lookup gradients
        for (let point of points) {

            // Get point
            point = point.map((value, index) => {
                const result = value % this.dimensions[index];
                return result < 0 ? (result + this.dimensions[index]) : result;
            });

            // Get gradient
            gradients.push(this.gradients[point]);
        }

        // Dot products
        let products = [];

        // Calculate dot products
        for (let i = 0; i < gradients.length; ++i)
            products[i] = gradients[i]
                .map((value, index) => value * (position[index] - points[i][index]))
                .reduce((previous, current) => previous + current, 0);

        // Reduce dot products to single value
        for (let i = 0; i < this.dimensions.length; ++i) {

            // New products
            const newProducts = [];

            // Factor
            const factor = position[i] - start[i];

            // Lerp
            for (let i = 0; i < products.length; i += 2)
                newProducts.push(this.lerp(products[i], products[i + 1], factor));

            // Update products
            products = newProducts;
        }

        // Return result
        return products[0];
    }

    getInterval() {
        return [-1, 1];
    }
}

export class ScaledNoise {
    noise;
    scale;

    constructor(configuration = {}) {
        if (!configuration.noise)
            throw new Exception('noise algorithm required');
        if (!configuration.scale || configuration.scale.length != configuration.noise.dimensions.length)
            throw new Exception('scale must be specified and of the same dimension of the noise');
        this.noise = configuration.noise;
        this.scale = configuration.scale;
    }

    get(...args) {
        return this.noise.get(...args.map((value, index) => value + this.translation[index]));
    }

    getInterval() {
        return this.noise.getInterval();
    }
}

export class TranslatedNoise {
    noise;
    translation;

    constructor(configuration = {}) {
        if (!configuration.noise)
            throw new Exception('noise algorithm requrired');
        if (!configuration.translation || configuration.translation.length != configuration.noise.dimensions.length)
            throw new Exception('translation must be specified and of the same dimension of the noise');
        this.noise = configuration.noise;
        this.translation = configuration.translation;
    }

    get(...args) {
        return this.noise.get(...args.map((value, index) => value + this.translation[index]));
    }

    getInterval() {
        return this.noise.getInterval();
    }
}

export class FractalNoise {
    noises;
    octaves;
    interval;

    constructor(configuration = {}) {
        if (!configuration.noises || configuration.noises.length == 0)
            throw new Exception('noises algorithms requrired');

        // Set noises
        this.noises = [...configuration.noises];

        // Build octaves
        const lacunarity = configuration.lacunarity || 2;
        const persistance = configuration.persistance || 0.5;
        const octaves = configuration.octaves || (this.noises.length == 1 ? 4 : this.noises.length);

        // Compute octaves
        this.octaves = Array
            .apply(null, Array(octaves))
            .map((_octave, index) => ({
                frequency: Math.pow(lacunarity, index),
                amplitude: Math.pow(persistance, index + 1),
            }));

        // Compute interval
        this.interval = [0, 0];
        for (let i = 0; i < this.octaves.length; ++i) {
            const amplitude = this.octaves[i].amplitude;
            const noiseInterval = this.noises[i % this.noises.length].getInterval();
            for (let j = 0; j < this.interval.length; ++j)
                this.interval[j] += noiseInterval[j] * amplitude;
        }
    }

    get(...args) {
        return this.octaves
            .reduce((previous, { frequency, amplitude }, index) => previous + this.noises[index % this.noises.length].get(...args.map(value => value * frequency)) * amplitude, 0);
    }

    getInterval() {
        return this.interval;
    }
}