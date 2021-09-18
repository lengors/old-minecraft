import { Prefabs } from "../../core/prefabs.js";
import { CameraComponent } from "../components/cameraComponent.js";
import { TransformComponent } from "../../core/components/transformComponent.js";

Prefabs.camera = {
    transformComponent: {
        _component: TransformComponent
    }, cameraComponent: {
        _component: CameraComponent
    }
};