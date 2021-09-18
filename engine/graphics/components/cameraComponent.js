import { Exception } from "../../core/exceptions.js";
import { Component } from "../../core/components/component.js";
import { PerspectiveProjection } from "../projections/perspectiveProjection.js"

export class CameraComponent extends Component {
    window;
    projection;
    renderLayers;

    initialize(configuration = {}) {
        // Set properties
        this.window = configuration.window;
        this.renderLayers = configuration.renderLayers;
        this.windowIndex = configuration.windowIndex || 0;
        this.projection = configuration.projection || new PerspectiveProjection();

        // Make sure there is a camera component
        if (!this._gameObject.cameraComponent)
            this._gameObject.cameraComponent = this;
    }

    getWindow() {

        // Check for window validity
        if (!this.window || !this.window.windowComponent) {

            // Try to fallback to window Index
            if (!(this.window = this._gameObject._application.getGameObjects(['windowComponent'])[this.windowIndex]))
                throw new Exception('camera has no window attached');
        }

        // Retrieve window
        return this.window;
    }

    getWindowComponent() {
        return this.getWindow().windowComponent;
    }
}