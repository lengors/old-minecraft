import { GameObject } from "../../core/gameObject.js";
import { System } from "../../core/systems/system.js";

export class RenderingSystem extends System {
    // Lights and renderables per layer
    layers = {
        renderables: {

        }, lights: {

        }
    };

    // Known windows
    windows = {

    }

    constructor(configuration = {}) {
        super({
            ...configuration,
            lights: ['lightComponent'],
            cameras: ['cameraComponent'],
            renderables: ['materialComponent']
        });
    }

    onGameObjectCreate(object) {

        // Check caches
        for (const cache of super.onGameObjectCreate(object))

            // If object is a camera
            if (cache == this.cameras) {

                // Get window
                const window = object.cameraComponent.getWindow();

                // Get window id
                const windowID = window.windowComponent.element.id;

                // Get pipeline
                const pipeline = window.windowComponent.pipeline;

                // Register window
                const windowCache = (this.windows[windowID] = this.windows[windowID] || {
                    window: window,
                    layers: {

                    }
                });

                // Add camera to layers
                for (const layer of (object.cameraComponent.renderLayers || this.application.layerStack)) {

                    // Ensure layer
                    this.layers.lights[layer] = this.layers.lights[layer] || new Set();
                    this.layers.renderables[layer] = this.layers.renderables[layer] || new Set();

                    // Get layer cache
                    const cameras = (windowCache.layers[layer] = windowCache.layers[layer] || new Set());

                    // Check if first camera on layer
                    if (cameras.size == 0) {

                        // Processed
                        const processed = new Set();

                        // Register all renderables in pipeline
                        for (const object of this.layers.renderables[layer]) {

                            // Register members of object if not processed yet
                            if (!processed.has(object))

                                // Register members
                                for (const member of GameObject.family(object)) {

                                    // Register member
                                    pipeline.register(member);

                                    // Member processed
                                    processed.add(member);
                                }
                        }
                    }

                    // Add camera to layer cache
                    cameras.add(object);
                }
            }

            // If object is renderable
            else if (cache == this.renderables) {

                // Get layer
                const layer = (this.layers.renderables[object._layer] = this.layers.renderables[object._layer] || new Set());

                // Register renderable in pipelines
                for (const windowID in this.windows) {

                    // Get window cache
                    const windowCache = this.windows[windowID];

                    // Get layer cache
                    const cameras = windowCache.layers[object._layer];

                    // Get pipeline
                    const pipeline = windowCache.window.windowComponent.pipeline;

                    // Check if has layer
                    if (cameras && cameras.size != 0) {

                        // Register members
                        for (const member of GameObject.family(object))

                            // If not processed already
                            if (!layer.has(member))

                                // Register member
                                pipeline.register(member);
                    }
                }

                // Add object to layer
                layer.add(object);
            }

            // If object is light
            else if (cache == this.lights) {

                // Get lights of layer
                const lights = (this.layers.lights[object._layer] = this.layers.lights[object._layer] || new Set());

                // Add light to lights
                lights.add(object);

            }
    }

    onGameObjectDestroy(object) {

        // Check caches
        for (const cache of super.onGameObjectDestroy(object))

            // If object is camera
            if (cache == this.cameras) {

                // Get window
                const window = object.cameraComponent.getWindow();

                // Get pipeline
                const pipeline = window.windowComponent.pipeline;

                // Get window cache
                const windowCache = this.windows[windowID];

                // Add camera to layers
                for (const layer of (object.cameraComponent.renderLayers || this.application.layerStack)) {

                    // Get layer cache
                    const cameras = windowCache.layers[layer];

                    // Remove from cameras
                    if (cameras.delete(object)) {

                        // Unregister all renderables from window if no more cameras for layer
                        if (cameras.size == 0)

                            // Unregister
                            pipeline.unregister(...this.layers.renderables[layer]);
                    }
                }
            }

            // If object is renderable
            else if (cache == this.renderables) {

                // Get layer
                const layer = this.layers.renderables[object._layer];

                // Remove object from layer
                if (layer.delete(object)) {

                    // Unregister renderable in pipelines
                    for (const windowID in this.windows) {

                        // Get window cache
                        const windowCache = this.windows[windowID];

                        // Get layer cache
                        const cameras = windowCache.layers[object._layer];

                        // Check if has layer
                        if (cameras && cameras.size != 0)

                            // Unregister
                            windowCache.window.windowComponent.pipeline.unregister(object);
                    }
                }
            }

            // If object is light
            else if (cache == this.lights) {

                // Get lights of layer
                const lights = (this.layers.lights[object._layer] = this.layers.lights[object._layer] || new Set());

                // Add light to lights
                lights.delete(object);

            }
    }

    onLateUpdate() {

        // For each window
        for (const windowID in this.windows) {

            // Get window cache
            const windowCache = this.windows[windowID];

            // Get window pipeline
            const pipeline = windowCache.window.windowComponent.pipeline;

            // Get layer cache
            const layerCache = windowCache.layers;

            // Clean pipeline
            pipeline.cleanup();

            // Prepare window's pipeline
            pipeline.prepare();

            // For each layer
            for (const layer in layerCache) {

                // Get layer cache
                const cameras = layerCache[layer];

                // Get renderables
                const renderables = this.layers.renderables[layer];

                // Get lights
                const lights = this.layers.lights[layer];

                // For camera in layer cache
                for (const camera of cameras)

                    // Render object
                    pipeline.render(camera, lights, renderables);
            }

        }
    }
}