import { Prefabs } from "../../engine/core/prefabs.js";
import { PlayerComponent } from "../components/playerComponent.js";
import { TransformComponent } from "../../engine/core/components/transformComponent.js";

Prefabs.player = {
    transformComponent: {
        _component: TransformComponent
    }, playerComponent: {
        _component: PlayerComponent
    }
};