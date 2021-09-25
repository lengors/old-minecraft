import "../../dom/prefabs/window.js";
import "../../dom/prefabs/monitor.js";
import { Prefabs } from "../../core/prefabs.js";
import { Constraints } from "../constraints.js";
import { System } from "../../core/systems/system.js";

export class UISystem extends System {
    constructor(configuration = {}) {
        super({
            ...configuration,
            uiObjects: ['uiComponent']
        });
        this.defaults = configuration._defaults || true;
    }

    onInit() {

        // If defaults
        if (this.defaults) {

            // Check if has window and has monitor
            let hasWindow = false;
            let hasMonitor = false;
            for (const uiObject of this.uiObjects) {
                hasWindow = hasWindow || uiObject.monitorComponent;
                hasMonitor = hasMonitor || uiObject.monitorComponent;
            }

            // No monitor, instantiate one
            if (!hasMonitor)
                this.application.instantiateGameObject(Prefabs.monitor);

            // No window, instantiate one
            if (!hasWindow)
                this.application.instantiateGameObject(Prefabs.window, {
                    windowComponent: {
                        id: 'test',
                        pipeline: {
                            clearColor: [[0.75, 0.85, 0.8, 1.0]],
                            clear: [['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT']],
                            enable: [
                                ['DEPTH_TEST'],
                                ['CULL_FACE'],
                                /* ['BLEND'] */
                            ],
                            /* blendFunc: [['SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA']], */
                            frontFace: [['CCW']],
                            cullFace: [['BACK']],
                        }, constraints: [Constraints.margins(50)]
                    }
                });
        }
    }

    onLateUpdate() {
        for (const object of this.uiObjects)
            object.uiComponent.applyConstraints();
    }
}