import { Component } from "../../engine/core/components/component.js";

export class ChunckManagerComponent extends Component {
    depth;
    width;
    height;

    target;
    targetName;

    seed;
    treeSpeed;
    biomeSpeed;
    terrainSpeed;
    treeThreshold;

    radius;
    center;
    chuncks;
    chunckPrefab;

    initialize(configuration = {}) {
        this.chuncks = {};
        this.depth = configuration.depth || 32;
        this.width = configuration.width || 32;
        this.height = configuration.height || 256;
        this.targetName = configuration.targetName;
        this.chunckPrefab = configuration.chunckPrefab || {};
        this.radius = Number.isFinite(configuration.radius) ? configuration.radius : 8;

        // Seed
        this.seed = Number.isFinite(configuration.seed) ? configuration.seed : Math.floor(performance.now());

        // Speeds
        this.treeSpeed = configuration.treeSpeed || 0.75;
        this.biomeSpeed = configuration.biomeSpeed || 0.005;
        this.terrainSpeed = configuration.terrainSpeed || 0.01;

        // Threshold
        this.treeThreshold = Number.isFinite(configuration.treeThreshold) ? configuration.treeThreshold : 0.998;

        this.biomes = configuration.biomes || {
            'snowy': {
                topIndex: 165,
                sideIndex: 1,
                bottomIndex: 43
            }, 'forest': {
                topIndex: 2,
                sideIndex: 3,
                bottomIndex: 43
            }, 'desert': {
                topIndex: 35,
                sideIndex: 35,
                bottomIndex: 35
            }
        }

        this.biomesConfiguration = configuration.biomesConfiguration || [{
            heightStart: 0,
            heightEnd: 0.425,
            biomes: ['forest', 'desert', 'desert']
        }, {
            heightStart: 0.425,
            heightEnd: 0.575,
            biomes: ['forest']
        }, {
            heightStart: 0.575,
            heightEnd: 1.0,
            biomes: ['forest', 'snowy', 'snowy']
        }];
    }

    getTarget() {
        if (!this.target && this.targetName)
            this.target = this._gameObject._application.getGameObjects(['tagComponent'])
                .filter(child => child.tagComponent.name == this.targetName)[0];
        return this.target;
    }
}