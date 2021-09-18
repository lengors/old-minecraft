import { Vector3 } from "../../math/matrix.js";
import { Component } from "../../core/components/component.js";

export class LightComponent extends Component {
    initialize(configuration = {}) {
        this.color = new Vector3(configuration.color || Vector3.fill(1, 1, 1));
        this.direction = new Vector3(configuration.direction || Vector3.fill(0, 1, 0));
    }
}