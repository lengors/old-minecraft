import { Component } from "../../engine/core/components/component.js";

export class CounterComponent extends Component {
    fpsCounter;
    upsCounter;
    previousTime;

    initialize() {
        this.fpsCounter = 0;
        this.upsCounter = 0;
    }
}