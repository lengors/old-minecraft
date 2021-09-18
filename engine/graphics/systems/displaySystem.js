import { System } from "../../core/systems/system.js";

export class DisplaySystem extends System {
    onWindowResize(events) {
        for (const { target, width, height } of events)
            target.windowComponent.context.gl.viewport(0, 0, width, height);
    }
}