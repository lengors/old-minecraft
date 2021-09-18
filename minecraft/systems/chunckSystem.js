import "../../engine/math/utils.js";
import { Mesh } from "../../engine/graphics/mesh.js";
import { Matrix4 } from "../../engine/math/matrix.js";
import { Prefabs } from "../../engine/core/prefabs.js";
import { System } from "../../engine/core/systems/system.js";
import { GameObject } from "../../engine/core/gameObject.js";
import { MeshComponent } from "../../engine/graphics/components/meshComponent.js";
import { TransformComponent } from "../../engine/core/components/transformComponent.js";
import { MaterialComponent } from "../../engine/graphics/components/materialComponent.js";

export class ChunckSystem extends System {

    // Worker
    worker = 0;
    workers = [];

    constructor(configuration = {}) {
        super({
            ...configuration,
            chunckManagers: ['chunckManagerComponent']
        });

        // Initialize workers
        configuration._workerCount = Math.max(configuration._workerCount || 4, 1);
        for (let i = 0; i < configuration._workerCount; ++i) {
            const worker = new Worker('./minecraft/chunckGenerator.js', { type: 'module' });
            worker.onmessage = this.onChunckGenerated.bind(this);
            this.workers.push(worker);
        }
    }

    onChunckGenerated(event) {
        // Get event
        event = event.data;

        // Get managers
        const managers = [...this.chunckManagers];

        // Get chunck prefab
        const chunckManager = managers[event.chunckManagerIndex];

        // Get component
        const { chunckManagerComponent } = chunckManager;

        // Get y
        const yOffset = chunckManager.transformComponent ? chunckManager.transformComponent.translation.y() : 0;

        // Get chunck
        const chunck = chunckManagerComponent.chuncks[event.chunck];

        // Set prefab
        const prefab = Prefabs.extend(chunck, {
            meshComponent: {
                mesh: new Mesh(event.mesh)
            }, transformComponent: {
                transform: Matrix4.translation(event.translationX, yOffset - event.halfHeight, event.translationZ)
            }
        });

        // Update chuncks index
        chunckManagerComponent.chuncks[event.chunck] = this.application.instantiateGameObject(prefab);
    }

    onUpdate() {

        // Get managers
        const chunckManagers = [...this.chunckManagers];

        // For each manager
        for (let chunckManagerIndex = 0; chunckManagerIndex < chunckManagers.length; ++chunckManagerIndex) {

            // Get chunck manager
            const chunckManager = chunckManagers[chunckManagerIndex];

            // Get manager components
            const { chunckManagerComponent } = chunckManager;

            // Get target
            const target = chunckManagerComponent.getTarget();

            // Check if there is any target
            if (target) {

                // Get target's translation
                const translation = target.transformComponent.translation;

                // Get properties
                let { radius, width, height, depth, chuncks, seed, treeSpeed, treeThreshold, terrainSpeed, biomeSpeed, biomes, biomesConfiguration } = chunckManagerComponent;

                // Get mapped target's x and z
                const targetX = Math.floor(translation.x() / width + 0.5);
                const targetZ = Math.floor(translation.z() / depth + 0.5);

                // Update center
                chunckManagerComponent.center = [targetX, targetZ];

                // Helpers
                const halfHeight = height / 2;
                const deviance = halfHeight / 2;

                // Set event
                let event = {
                    radius: radius,
                    centerX: targetX,
                    centerZ: targetZ,
                    chuncks: chuncks,
                };

                // Check chuncks
                for (const chunck of Object.values(chuncks))
                    if (chunck instanceof GameObject) {
                        const x = chunck.transformComponent.translation.x();
                        const z = chunck.transformComponent.translation.z();
                        this.checkChunckAt({ ...event, chunck: [Math.round(x / width + 0.5), Math.round(z / depth + 0.5)] });
                    }

                // Set event
                event = {
                    seed: seed,
                    width: width,
                    depth: depth,
                    biomes: biomes,
                    deviance: deviance,
                    treeSpeed: treeSpeed,
                    biomeSpeed: biomeSpeed,
                    halfHeight: halfHeight,
                    terrainSpeed: terrainSpeed,
                    treeThreshold: treeThreshold,
                    chunckManagerIndex: chunckManagerIndex,
                    biomesConfiguration: biomesConfiguration,
                }

                // Generate chuncks
                for (let i = 0; i < radius; ++i)
                    if (i == 0)

                        // Generate middle chunck
                        this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [targetX, targetZ] });
                    else {

                        // Generate back and front chuncks
                        for (let x = targetX - i + 1; x < targetX + i; ++x) {
                            this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [x, targetZ - i] });
                            this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [x, targetZ + i] });
                        }

                        // Generate left and right chuncks
                        for (let z = targetZ - i + 1; z < targetZ + i; ++z) {
                            this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [targetX - i, z] });
                            this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [targetX + i, z] });
                        }

                        // Generate corner chuncks
                        this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [targetX - i, targetZ - i] });
                        this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [targetX + i, targetZ - i] });
                        this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [targetX - i, targetZ + i] });
                        this.generateChunckAt(chunckManagerComponent, { ...event, chunck: [targetX + i, targetZ + i] });
                    }
            }
        }
    }

    checkChunckAt(event) {

        // Chunck coordinates
        const [chunckX, chunckZ] = event.chunck;

        // Check if still inside current view
        const check = chunckX < event.centerX + event.radius
            && chunckX > event.centerX - event.radius
            && chunckZ < event.centerZ + event.radius
            && chunckZ > event.centerZ - event.radius;

        // Check and delete if required
        if (!check) {
            this.application.destroyGameObject(event.chuncks[event.chunck]);
            delete event.chuncks[event.chunck];
        }
    }

    generateChunckAt(chunckManagerComponent, event) {
        // Already calculated
        if (chunckManagerComponent.chuncks[event.chunck])
            return;

        // Set chunck to prefab
        chunckManagerComponent.chuncks[event.chunck] = Prefabs.extend({
            meshComponent: {
                _component: MeshComponent,
            }, materialComponent: {
                _component: MaterialComponent,
            }, transformComponent: {
                _component: TransformComponent,
            }
        }, chunckManagerComponent.chunckPrefab);

        // Request worker
        this.workers[this.worker++].postMessage(event);

        // Update worker
        this.worker %= this.workers.length;
    }
}