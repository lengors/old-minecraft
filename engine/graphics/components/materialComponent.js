import { Component } from "../../core/components/component.js";

export class MaterialComponent extends Component {
    program;
    material;

    initialize(configuration = {}) {
        this.program = configuration.program || {};
        this.material = configuration.material || {};
    }
}