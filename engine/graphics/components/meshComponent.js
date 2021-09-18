import { Manager } from "../../util/manager.js";
import { Component } from "../../core/components/component.js";

export class MeshComponent extends Component {
    static manager = new Manager();

    mesh;

    initialize(configuration = {}) {
        if (this.mesh = configuration.mesh)
            this.mesh.id = MeshComponent.manager.get();
    }

    destroy() {
        if (this.mesh) {
            MeshComponent.manager.dispose(this.mesh.id);
            this.mesh.id = -1;
        }
    }
}