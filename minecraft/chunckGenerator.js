import "../../engine/math/utils.js";
import { Mesh } from "../../engine/graphics/mesh.js";
import { Noise, PerlinNoise, FractalNoise, TranslatedNoise } from "../../engine/math/noise.js";

function findBiomes(height, biomesRanges) {
    for (const { heightStart, heightEnd, biomes } of biomesRanges)
        if (height >= heightStart && height <= heightEnd)
            return biomes;
}

class ChunckGenerator {
    normals;
    indices;
    vertices;
    coordinates;
    scale = 0.5;

    constructor() {
        this.normals = [];
        this.indices = [];
        this.vertices = [];
        this.coordinates = [];
    }

    addFront(x, y, z, index) {
        // Add front triangles
        const zPlane = z + this.scale;

        // First front triangle
        this.vertices.push(x - this.scale, y + this.scale, zPlane);
        this.vertices.push(x - this.scale, y - this.scale, zPlane);
        this.vertices.push(x + this.scale, y - this.scale, zPlane);

        // Second front triangle
        this.vertices.push(x + this.scale, y - this.scale, zPlane);
        this.vertices.push(x + this.scale, y + this.scale, zPlane);
        this.vertices.push(x - this.scale, y + this.scale, zPlane);

        // First front triangle texcoords
        this.coordinates.push(0, 1);
        this.coordinates.push(0, 0);
        this.coordinates.push(1, 0);

        // Second front triangle texcoords
        this.coordinates.push(1, 0);
        this.coordinates.push(1, 1);
        this.coordinates.push(0, 1);

        // Face index and normals
        for (let i = 0; i < 6; ++i) {
            this.indices.push(index);
            this.normals.push(0, 0, 1);
        }
    }

    addBack(x, y, z, index) {
        // Add back triangles
        const zPlane = z - this.scale;

        // First back triangle
        this.vertices.push(x - this.scale, y - this.scale, zPlane);
        this.vertices.push(x - this.scale, y + this.scale, zPlane);
        this.vertices.push(x + this.scale, y + this.scale, zPlane);

        // Second back triangle
        this.vertices.push(x + this.scale, y + this.scale, zPlane);
        this.vertices.push(x + this.scale, y - this.scale, zPlane);
        this.vertices.push(x - this.scale, y - this.scale, zPlane);

        // First back triangle texcoords
        this.coordinates.push(1, 0);
        this.coordinates.push(1, 1);
        this.coordinates.push(0, 1);

        // Second back triangle texcoords
        this.coordinates.push(0, 1);
        this.coordinates.push(0, 0);
        this.coordinates.push(1, 0);

        // Face index and normals
        for (let i = 0; i < 6; ++i) {
            this.indices.push(index);
            this.normals.push(0, 0, -1);
        }
    }

    addTop(x, y, z, index) {
        // Add top triangles
        const yPlane = y + this.scale;

        // First top triangle
        this.vertices.push(x - this.scale, yPlane, z - this.scale);
        this.vertices.push(x - this.scale, yPlane, z + this.scale);
        this.vertices.push(x + this.scale, yPlane, z + this.scale);

        // Second top triangle
        this.vertices.push(x + this.scale, yPlane, z + this.scale);
        this.vertices.push(x + this.scale, yPlane, z - this.scale);
        this.vertices.push(x - this.scale, yPlane, z - this.scale);

        // First top triangle texcoords
        this.coordinates.push(0, 1);
        this.coordinates.push(0, 0);
        this.coordinates.push(1, 0);

        // Second top triangle texcoords
        this.coordinates.push(1, 0);
        this.coordinates.push(1, 1);
        this.coordinates.push(0, 1);

        // Face index and normals
        for (let i = 0; i < 6; ++i) {
            this.indices.push(index);
            this.normals.push(0, 1, 0);
        }
    }

    addBottom(x, y, z, index) {
        // Add bottom triangles
        const yPlane = y - this.scale;

        // First bottom triangle
        this.vertices.push(x - this.scale, yPlane, z + this.scale);
        this.vertices.push(x - this.scale, yPlane, z - this.scale);
        this.vertices.push(x + this.scale, yPlane, z - this.scale);

        // Second bottom triangle
        this.vertices.push(x + this.scale, yPlane, z - this.scale);
        this.vertices.push(x + this.scale, yPlane, z + this.scale);
        this.vertices.push(x - this.scale, yPlane, z + this.scale);

        // First bottom triangle texcoords
        this.coordinates.push(0, 1);
        this.coordinates.push(0, 0);
        this.coordinates.push(1, 0);

        // Second bottom triangle texcoords
        this.coordinates.push(1, 0);
        this.coordinates.push(1, 1);
        this.coordinates.push(0, 1);

        // Face index and normals
        for (let i = 0; i < 6; ++i) {
            this.indices.push(index);
            this.normals.push(0, -1, 0);
        }
    }

    addRight(x, y, z, index) {
        // Add right triangles
        const xPlane = x + this.scale;

        // First right triangle
        this.vertices.push(xPlane, y + this.scale, z + this.scale);
        this.vertices.push(xPlane, y - this.scale, z + this.scale);
        this.vertices.push(xPlane, y - this.scale, z - this.scale);

        // Second right triangle
        this.vertices.push(xPlane, y - this.scale, z - this.scale);
        this.vertices.push(xPlane, y + this.scale, z - this.scale);
        this.vertices.push(xPlane, y + this.scale, z + this.scale);

        // First right triangle texcoords
        this.coordinates.push(0, 1);
        this.coordinates.push(0, 0);
        this.coordinates.push(1, 0);

        // Second right triangle texcoords
        this.coordinates.push(1, 0);
        this.coordinates.push(1, 1);
        this.coordinates.push(0, 1);

        // Face index and normals
        for (let i = 0; i < 6; ++i) {
            this.indices.push(index);
            this.normals.push(1, 0, 0);
        }
    }

    addLeft(x, y, z, index) {
        // Add left triangles
        const xPlane = x - this.scale;

        // First left triangle
        this.vertices.push(xPlane, y + this.scale, z - this.scale);
        this.vertices.push(xPlane, y - this.scale, z - this.scale);
        this.vertices.push(xPlane, y - this.scale, z + this.scale);

        // Second left triangle
        this.vertices.push(xPlane, y - this.scale, z + this.scale);
        this.vertices.push(xPlane, y + this.scale, z + this.scale);
        this.vertices.push(xPlane, y + this.scale, z - this.scale);

        // First left triangle texcoords
        this.coordinates.push(0, 1);
        this.coordinates.push(0, 0);
        this.coordinates.push(1, 0);

        // Second left triangle texcoords
        this.coordinates.push(1, 0);
        this.coordinates.push(1, 1);
        this.coordinates.push(0, 1);

        // Face index and normals
        for (let i = 0; i < 6; ++i) {
            this.indices.push(index);
            this.normals.push(-1, 0, 0);
        }
    }
}

self.onmessage = function (event) {
    // Get data
    event = event.data;

    // Get generators
    if (!self.generators)
        self.generators = [];

    // Get chunck coordinates
    const [chunckX, chunckZ] = event.chunck;

    // Generator
    let generators;

    // Get generators
    if (!(generators = self.generators[event.chunckManagerIndex])) {

        // Create generators
        generators = (self.generators[event.chunckManagerIndex] = self.generators[event.chunckManagerIndex] || {});

        // Create terrain generator
        const terrainPerlinNoise = new PerlinNoise({ dimensions: [256, 256], seed: event.seed });
        const terrainTranslatedNoise = new TranslatedNoise({ noise: terrainPerlinNoise, translation: [0.5, 0.5] });
        generators.terrain = new FractalNoise({ noises: [terrainPerlinNoise, terrainTranslatedNoise, terrainPerlinNoise, terrainTranslatedNoise] });

        // Create biome generator
        const biomePerlinNoise = new PerlinNoise({ dimensions: [256, 256], seed: event.seed });
        const biomeTranslatedNoise = new TranslatedNoise({ noise: biomePerlinNoise, translation: [0.5, 0.5] });
        generators.biome = new FractalNoise({ noises: [biomePerlinNoise, biomeTranslatedNoise, biomePerlinNoise, biomeTranslatedNoise] });
    }
    
    // Create tree generator
    generators.tree = new Noise({ seed: Math.pow(event.seed * chunckZ, 1) + Math.pow(event.seed * chunckX, 2) });
    
    // Generate chunck generator
    const chunckGenerator = new ChunckGenerator();

    // Offsets
    const offsetX = chunckX * event.width;
    const offsetZ = chunckZ * event.depth;

    // Compute mapper
    const heightMapper = Math.mapper(event.treeThreshold, 1.0, 3.0, 7.0);
    const biomeMapper = Math.mapper(...generators.biome.getInterval(), 0, 1);
    const helperMapper = Math.mapper(...generators.terrain.getInterval(), 0, 1);
    const terrainMapper = Math.mapper(...generators.terrain.getInterval(), -event.halfHeight / 2, event.halfHeight / 2);

    // Build chunck
    for (let z = 0; z < event.depth; ++z) {
        for (let x = 0; x < event.width; ++x) {

            // Pos X and Z base
            const basePosX = x + offsetX;
            const basePosZ = z + offsetZ;

            // Pos X and Z tree
            const treePosX = basePosX * event.treeSpeed;
            const treePosZ = basePosZ * event.treeSpeed;

            // Pos X and Z biome
            const biomePosX = basePosX * event.biomeSpeed;
            const biomePosZ = basePosZ * event.biomeSpeed;

            // Pos X and Z terrain
            const terrainPosX = basePosX * event.terrainSpeed;
            const terrainPosZ = basePosZ * event.terrainSpeed;

            // Get height
            const height = generators.terrain.get(terrainPosX, terrainPosZ);

            // const index = offset + x;
            const height0 = Math.floor(event.halfHeight + terrainMapper(height));
            const height1 = Math.floor(event.halfHeight + terrainMapper(generators.terrain.get(terrainPosX + event.terrainSpeed, terrainPosZ)));
            const height2 = Math.floor(event.halfHeight + terrainMapper(generators.terrain.get(terrainPosX, terrainPosZ + event.terrainSpeed)));
            const height3 = Math.floor(event.halfHeight + terrainMapper(generators.terrain.get(terrainPosX - event.terrainSpeed, terrainPosZ)));
            const height4 = Math.floor(event.halfHeight + terrainMapper(generators.terrain.get(terrainPosX, terrainPosZ - event.terrainSpeed)));

            // Get biomes
            const biomes = findBiomes(helperMapper(height), event.biomesConfiguration);

            // Get biome
            let biome = biomeMapper(generators.biome.get(biomePosX, biomePosZ));

            // Fix biome
            biome = Math.min(Math.floor(biome * biomes.length), biomes.length);

            // Get biome name
            const biomeName = biomes[biome];

            // Get biome
            biome = event.biomes[biomeName];

            // Check if tree
            let tree = generators.tree.nextFloat();
            /* let tree = chunckCache[[z, x]];
            
            if (!Number.isFinite(tree))
                tree = chunckCache[[z, x]] = generators.tree.nextFloat(); */

            // Generate tree
            if (tree > event.treeThreshold && (biomeName == 'default' || biomeName == 'forest')) {

                // height mapper
                const treeHeight = Math.floor(heightMapper(tree));

                // Build tree body
                for (let i = height0; i < height0 + treeHeight; ++i) {
                    chunckGenerator.addFront(x, i, z, 92);
                    chunckGenerator.addBack(x, i, z, 92);
                    if (i == height0 + treeHeight - 1)
                        chunckGenerator.addTop(x, i, z, 93);
                    chunckGenerator.addRight(x, i, z, 92);
                    chunckGenerator.addLeft(x, i, z, 92);
                }

                // Radius
                const radius = 2;

                // x
                let xStart = x - radius;
                let xEnd = x + radius;

                // z
                let zStart = z - radius;
                let zEnd = z + radius;

                // y
                const yStart = height0 + treeHeight - radius;
                let yEnd = height0 + treeHeight;

                for (let k = yStart; k < yEnd; ++k)
                    for (let i = zStart; i <= zEnd; ++i)
                        for (let j = xStart; j <= xEnd; ++j)
                            if (i != z || j != x) {
                                chunckGenerator.addTop(j, k, i, 150);
                                chunckGenerator.addBottom(j, k, i, 150);
                                chunckGenerator.addFront(j, k, i, 150);
                                chunckGenerator.addBack(j, k, i, 150);
                                chunckGenerator.addRight(j, k, i, 150);
                                chunckGenerator.addLeft(j, k, i, 150);
                            }

                --xEnd;
                --zEnd;
                ++xStart;
                ++zStart;
                for (let i = zStart; i <= zEnd; ++i)
                    for (let j = xStart; j <= xEnd; ++j) {
                        chunckGenerator.addTop(j, yEnd, i, 150);
                        chunckGenerator.addBottom(j, yEnd, i, 150);
                        chunckGenerator.addFront(j, yEnd, i, 150);
                        chunckGenerator.addBack(j, yEnd, i, 150);
                        chunckGenerator.addRight(j, yEnd, i, 150);
                        chunckGenerator.addLeft(j, yEnd, i, 150);
                    }

                ++yEnd;
                for (let i = zStart; i <= zEnd; ++i)
                    for (let j = xStart; j <= xEnd; ++j)
                        if (j == x || i == z) {
                            chunckGenerator.addTop(j, yEnd, i, 150);
                            chunckGenerator.addBottom(j, yEnd, i, 150);
                            chunckGenerator.addFront(j, yEnd, i, 150);
                            chunckGenerator.addBack(j, yEnd, i, 150);
                            chunckGenerator.addRight(j, yEnd, i, 150);
                            chunckGenerator.addLeft(j, yEnd, i, 150);
                        }
            }

            // Draw bottom
            chunckGenerator.addBottom(x, 0, z, biome.bottomIndex);

            // Generate column
            for (let y = Math.min(height0 - 1, height1, height2, height3, height4); y < height0; ++y) {

                // Check front
                if (y >= height2)
                    chunckGenerator.addFront(x, y, z, biome.sideIndex);

                // Check back
                if (y >= height4)
                    chunckGenerator.addBack(x, y, z, biome.sideIndex);

                // Check top
                if (y == height0 - 1)
                    chunckGenerator.addTop(x, y, z, biome.topIndex);

                // Check right
                if (y >= height1)
                    chunckGenerator.addRight(x, y, z, biome.sideIndex);

                // Check left
                if (y >= height3)
                    chunckGenerator.addLeft(x, y, z, biome.sideIndex);
            }
        }
    }

    // Set mesh
    let mesh = new Mesh({
        primitive: 4,
        attributes: {
            vertices: {
                data: chunckGenerator.vertices,
                itemSize: 3
            }, coordinates: {
                data: chunckGenerator.coordinates,
                itemSize: 2
            }, indices: {
                data: chunckGenerator.indices,
                itemSize: 1
            }, normals: {
                data: chunckGenerator.normals,
                itemSize: 3
            }
        }
    });

    // Compute translationX and translationZ
    const translationX = (chunckX - 0.5) * event.width;
    const translationZ = (chunckZ - 0.5) * event.depth;

    // Instantiate
    self.postMessage({ ...event, mesh: mesh, translationX: translationX, translationZ: translationZ, });
}