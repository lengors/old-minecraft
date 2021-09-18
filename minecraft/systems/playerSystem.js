import { Pointer } from "../../engine/dom/pointer.js";
import { System } from "../../engine/core/systems/system.js";
import { Matrix4, Vector3 } from "../../engine/math/matrix.js";
import { AngleRepresentation } from "../../engine/math/angleRepresentation.js";

// Player System
export class PlayerSystem extends System {
    velocity = new Vector3();
    position = new Vector3();
    direction = new Vector3();

    constructor(configuration = {}) {
        super({
            ...configuration,
            players: ['playerComponent']
        });
    }

    onGameObjectCreate(object) {
        for (const cache of super.onGameObjectCreate(object))
            if (cache == this.players)
                this.updateView(object.playerComponent, object.transformComponent);
    }

    onMouseMove(event) {
        for (const { playerComponent, transformComponent } of this.players)
            if (Pointer.getPointerLockObject() == playerComponent.getWindow())
                this.updateView(playerComponent, transformComponent, event.movementX, event.movementY);
    }

    onUpdate() {
        // For each player
        for (const player of this.players) {

            // Get player component
            const { playerComponent } = player;

            // Check pointer lock object
            if (Pointer.getPointerLockObject() == playerComponent.getWindow() && this.application.pressedKeys) {

                // Get player root
                const root = player.getRoot();

                // Target transform component
                const { transformComponent } = playerComponent.getTarget();

                // Reset direction
                this.direction
                    .apply(Vector3.copy(transformComponent.translation))
                    .sub(player.transformComponent.translation)
                    .y(0) // move only on x/z plane
                    .normalize();

                // Compute delta
                const delta = playerComponent.speed * this.application.timer.deltaTimeSeconds;

                // Reset velocity
                this.velocity.apply(Vector3.fill(0, 0, 0));

                // Move forward ([W])
                if (this.application.pressedKeys[83] && !this.application.pressedKeys[87])
                    this.velocity.sub(new Vector3(Vector3.copy(this.direction))
                        .mul(delta));

                // Move backwards ([S])
                else if (this.application.pressedKeys[87] && !this.application.pressedKeys[83])
                    this.velocity.add(new Vector3(Vector3.copy(this.direction))
                        .mul(delta));

                // Move Left ([A])
                if (this.application.pressedKeys[65] && !this.application.pressedKeys[68])
                    this.velocity.sub(new Vector3(Vector3.copy(this.direction))
                        .cross(playerComponent.up)
                        .normalize()
                        .mul(delta));

                // Move right ([D])
                else if (this.application.pressedKeys[68] && !this.application.pressedKeys[65])
                    this.velocity.add(new Vector3(Vector3.copy(this.direction))
                        .cross(playerComponent.up)
                        .normalize()
                        .mul(delta));

                // Move down ([SHIFT])
                if (this.application.pressedKeys[16] && !this.application.pressedKeys[32])
                    this.velocity.sub(new Vector3(Vector3.copy(playerComponent.up))
                        .mul(delta));

                // Move up ([SPACE])
                else if (this.application.pressedKeys[32] && !this.application.pressedKeys[16])
                    this.velocity.add(new Vector3(Vector3.copy(playerComponent.up))
                        .mul(delta));

                // Check if any movement is required
                if (this.velocity.x() != 0 || this.velocity.z() != 0) {

                    // Set target
                    transformComponent.setRotation(Vector3.fill(0, Math.atan2(this.direction.x(), this.direction.z()), 0), AngleRepresentation.Radians);
                }

                // Update position
                root.transformComponent.setTranslation(Vector3.copy(this.velocity.add(root.transformComponent.translation)));
            }
        }
    }

    onMouseClick(event) {
        if (event.target.windowComponent)
            Pointer.requestPointerLock(event.target);
    }

    // Third person movement
    updateView(playerComponent, transformComponent, movementX = 0, movementY = 0) {

        // Calculate offsets
        let offsetX = movementX;
        let offsetY = movementY;

        // Sensitivity
        offsetX *= playerComponent.sensitivity;
        offsetY *= playerComponent.sensitivity;

        // Get pitch, yaw and roll
        let { pitch, yaw, roll } = playerComponent;

        // Update pitch and yaw
        yaw += offsetX;
        pitch += offsetY; // compensate for reverse calculation

        // Fix pitch
        pitch = Math.min(pitch, 89.0);
        pitch = Math.max(pitch, -89.0);

        // Update player component
        playerComponent.update(pitch, yaw, roll);

        // To radians
        [pitch, yaw] = [Math.toRadians(pitch), Math.toRadians(yaw)];

        // Constants
        const yCos = Math.cos(yaw);
        const ySin = Math.sin(yaw);
        const pCos = Math.cos(pitch);
        const pSin = Math.sin(pitch);

        // Set direction
        this.position
            .apply(Vector3.fill(yCos * pCos, pSin, ySin * pCos))
            .normalize()
            .mul(playerComponent.targetDistance);

        // Update camera
        transformComponent.setTransform(Matrix4.lookAt(this.position, playerComponent.getTarget().transformComponent.translation, playerComponent.up));
    }
}