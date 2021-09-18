import "../../engine/math/utils.js";
import { Vector3 } from "../../engine/math/matrix.js";
import { CameraComponent } from "../../engine/graphics/components/cameraComponent.js";

export class PlayerComponent extends CameraComponent {
    speed;
    sensitivity;

    yaw;
    roll;
    pitch;

    up;
    target;
    targetName;
    targetDistance;

    initialize(configuration = {}) {
        super.initialize(configuration);
        this.roll = configuration.roll || 0;
        this.pitch = configuration.pitch || 0;
        this.speed = configuration.speed || 2;
        this.yaw = (configuration.yaw || 0) - 90;
        this.targetName = configuration.targetName;
        this.sensitivity = configuration.sensitivity || 0.1;
        this.targetDistance = configuration.targetDistance || 2;
        this.up = new Vector3(configuration.up || Vector3.copy(Vector3.UP));
    }

    getTarget() {
        if (!this.target) {
            if (this.targetName)
                this.target = this._gameObject.getRoot().findChildren(['tagComponent']).filter(child => child.tagComponent.name == this.targetName)[0];
            if (!this.target)
                this.target = this._gameObject.getRoot();
        }
        return this.target;
    }

    update(pitch, yaw, roll) {
        // Update pitch, yaw and roll
        this.yaw = yaw;
        this.roll = roll;
        this.pitch = pitch;
    }
}