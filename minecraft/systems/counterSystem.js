import "../prefabs/counterDisplayer.js";
import { Timer } from "../../engine/core/timer.js";
import { Prefabs } from "../../engine/core/prefabs.js";
import { System } from "../../engine/core/systems/system.js";
import { Constraints } from "../../engine/ui/constraints.js";

export class CounterSystem extends System {
    constructor(configuration = {}) {
        super({
            ...configuration,
            counters: ['counterComponent', 'textComponent']
        });
    }

    onFixedUpdate() {
        for (const { counterComponent } of this.counters)
            ++counterComponent.upsCounter;
    }

    onGameObjectCreate(object) {
        for (const cache of super.onGameObjectCreate(object))
            if (cache == this.counters)
                object.textComponent.setText(object.counterComponent);
    }

    onLateUpdate() {
        for (const { textComponent, counterComponent } of this.counters) {
            counterComponent.previousTime = counterComponent.previousTime || this.application.timer.currentTime;
            if (this.application.timer.currentTime - counterComponent.previousTime >= Timer.second) {
                textComponent.setText(counterComponent);
                counterComponent.previousTime += Timer.second;
                counterComponent.fpsCounter = 0;
                counterComponent.upsCounter = 0;
            }
        }
    }

    onStart() {
        // Add counter
        if (this.counters.size == 0)
            this.application.instantiateGameObject(Prefabs.counterDisplayer, {
                textComponent: {
                    width: 'auto',
                    constraints: [Constraints.centerX, Constraints.top(15)]
                }
            });
    }

    onUpdate() {
        for (const { counterComponent } of this.counters)
            ++counterComponent.fpsCounter;
    }
}