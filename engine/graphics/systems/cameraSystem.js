import { System } from "../../core/systems/system.js";
import { PerspectiveProjection } from "../projections/perspectiveProjection.js";

export class CameraSystem extends System {
    constructor(configuration = {}) {
        super({
            ...configuration,
            cameras: ['cameraComponent']
        });
    }

    onGameObjectCreate(object) {
        for (const cache of super.onGameObjectCreate(object))
            if (cache == this.cameras) {
                const windowComponent = object.cameraComponent.getWindowComponent();
                object.cameraComponent.projection.setAspectRatio(windowComponent.getWidth(), windowComponent.getHeight());
            }
    }

    onWindowResize(events) {
        for (const camera of this.cameras)
            if (camera.cameraComponent.projection instanceof PerspectiveProjection)
                for (const { target, width, height } of events)
                    if (camera.cameraComponent.window == target)
                        camera.cameraComponent.projection.setAspectRatio(width, height);
    }
}