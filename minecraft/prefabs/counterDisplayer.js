import "../../engine/dom/prefabs/textDisplayer.js";
import { Prefabs } from "../../engine/core/prefabs.js";
import { CounterComponent } from "../components/counterComponent.js";

Prefabs.counterDisplayer = Prefabs.extend(Prefabs.textDisplayer, {
    counterComponent: {
        _component: CounterComponent
    }, textComponent: {
        textTemplate: 'FPS: ${this.fpsCounter}, UPS: ${this.upsCounter}'
    }
});