import "./prefabs/player.js";
import "../engine/math/utils.js";
import "../engine/util/extensions.js";
import "../engine/dom/prefabs/window.js";
import "../engine/graphics/prefabs/light.js";
import "../engine/graphics/prefabs/camera.js";
import { Pointer } from "../engine/dom/pointer.js";
import { Prefabs } from "../engine/core/prefabs.js";
import { Texture } from "../engine/graphics/texture.js";
import { ChunckSystem } from "./systems/chunckSystem.js";
import { PlayerSystem } from "./systems/playerSystem.js";
import { Fullscreen } from "../engine/dom/fullscreen.js";
import { UISystem } from "../engine/ui/systems/system.js";
import { Application } from "../engine/core/application.js";
import { Matrix4, Vector3 } from "../engine/math/matrix.js";
import { EventSystem } from "../engine/core/systems/eventSystem.js";
import { ResourceManager } from "../engine/core/resourceManager.js";
import { TagComponent } from "../engine/core/components/tagComponent.js";
import { CameraSystem } from "../engine/graphics/systems/cameraSystem.js";
import { ChunckManagerComponent } from "./components/chunckManagerComponent.js";
import { DisplaySystem } from "../engine/graphics/systems/displaySystem.js";
import { RenderingSystem } from "../engine/graphics/systems/renderingSystem.js";
import { TransformComponent } from "../engine/core/components/transformComponent.js";

export class MinecraftApplication extends Application {
    constructor(configuration = {}) {
        super({
            ...configuration,
            systems: [
                [EventSystem],
                [UISystem],
                [DisplaySystem],
                [ChunckSystem, { _workerCount: 8 }],
                [CameraSystem],
                [RenderingSystem],
                [PlayerSystem],
            ]
        });
    }

    onInit() {

        // Initialize sunlight
        this.instantiateGameObject(Prefabs.light, {
            lightComponent: {
                direction: Vector3.fill(0, 1, -1)
            }
        });

        // Chunck
        this.instantiateGameObject({
            transformComponent: {
                _component: TransformComponent,
                transform: Matrix4.translation(0, -16, 0)
            },
            chunckManagerComponent: {
                _component: ChunckManagerComponent,
                targetName: 'player',
                radius: 6,
                width: 32,
                depth: 32,
                chunckPrefab: {
                    materialComponent: {
                        material: {
                            albedoMap: new Texture({
                                image: 'minecraft/resources/textures/atlas.png',
                                wrapS: 0,
                                wrapT: 0,
                                generateMipmaps: true,
                                magFilter: 1,
                                minFilter: 4
                            }),
                            albedoColumnCount: 32,
                            albedoRowCount: 16,
                            ambient: new Vector3(Vector3.fill(0.588235, 0.588235, 0.588235)),
                            diffuse: new Vector3(Vector3.fill(0.588235, 0.588235, 0.588235)),
                            specular: new Vector3(Vector3.fill(0.588235, 0.588235, 0.588235)),
                            shininess: 2,
                        },
                        program: {
                            vertexShader: 'minecraft/resources/shaders/default/shader.vs.glsl',
                            fragmentShader: 'minecraft/resources/shaders/shader.fs.glsl'
                        }
                    }
                }
            }
        });

        // Load steve
        ResourceManager
            .loadPrefab('minecraft/resources/prefabs/steve/steve.json')
            .then(url => {

                // Steve prefab
                const stevePrefab = Prefabs.extend(ResourceManager.prefabs.cache[url.href], {
                    _children: [{
                        _children: [{
                            materialComponent: {
                                program: {
                                    vertexShader: 'minecraft/resources/shaders/steve/shader.vs.glsl',
                                    fragmentShader: 'minecraft/resources/shaders/shader.fs.glsl'
                                }, material: {
                                    ambient: new Vector3(Vector3.fill(0.588235, 0.588235, 0.588235)),
                                    diffuse: new Vector3(Vector3.fill(0.588235, 0.588235, 0.588235)),
                                }
                            }
                        }]
                    }]
                });

                // Load steves
                Promise.all([

                    // Main steve
                    this.enqueueCommand(this.instantiateGameObject.bind(this), {
                        tagComponent: {
                            _component: TagComponent,
                            name: 'player'
                        },
                        transformComponent: {
                            _component: TransformComponent
                        },
                        _children: [Prefabs.extend(stevePrefab, {
                            tagComponent: {
                                _component: TagComponent,
                                name: 'steve'
                            }
                        }), Prefabs.extend(Prefabs.player, {
                            transformComponent: {
                                transform: Matrix4.translation(0, 1.5, -2)
                            },
                            playerComponent: {
                                targetDistance: 4,
                                targetName: 'steve',
                                speed: 25
                            }
                        })]
                    }),
                ]).then(objects => objects.map(this.fitOnBox.bind(this)));
            });
    }

    onKeyPress(event) {
        const lockedObject = Pointer.getPointerLockObject();
        if (event.key == 'f' && lockedObject) {
            if (Fullscreen.isEnabled(lockedObject))
                Fullscreen.disable();
            else
                Fullscreen.enable(lockedObject);
        }
    }

    fitOnBox(object) {
        // Get root
        object = object.getRoot();

        // Get all objects in tree with MeshComponent and TransformComponent
        const objects = [];
        const toCheck = [object];
        while (toCheck.length > 0) {
            const [object] = toCheck.splice(0, 1);
            if (object.meshComponent && object.transformComponent)
                objects.push(object);
            for (let i = 0; i < object.getChildCount(); ++i)
                toCheck.push(object.getChild(i));
        }

        // Apply reduction to all objects
        for (const object of objects) {

            // Get vertices values and number of components
            const { data, itemSize } = object.meshComponent.mesh.attributes.vertices;

            // Split vertices values into components array
            const components = data.split((_, index) => index % itemSize);

            // Get max value for each component
            const maxs = components.map(component => Math.max(...component));

            // Get min value for each component
            const mins = components.map(component => Math.min(...component));

            // Zip values
            const zipped = maxs.zip(mins);

            // Calculate scale factor to fit 1x1x1
            const scaleFactor = 2 / Math.max(...zipped.map(element => element[0] - element[1]));

            // Calculate average per component
            const averages = zipped.map(element => Math.average(...element) * -scaleFactor);

            // Set new scale and translation
            object.transformComponent.setScale(Vector3.fill(scaleFactor, scaleFactor, scaleFactor));
            object.transformComponent.setTranslation(Vector3.fill(...averages));
        }
    }
}

// TODO automate (?)
Application.start(MinecraftApplication);