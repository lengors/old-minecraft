import { Component } from "../../core/components/component.js";

export class UIComponent extends Component {
    constraints;

    initialize(configuration = {}) {
        this.setWidth(configuration.width);
        this.setHeight(configuration.height);
        this.setPositionX(configuration.positionX);
        this.setPositionY(configuration.positionY);
        this.constraints = [...(configuration.constraints || [])];
        if (!this._gameObject.uiComponent)
            this._gameObject.uiComponent = this;
    }

    applyConstraints() {
        for (const constraint of this.constraints)
            constraint(this);
    }

    getHeight() {
        return this.height || 0;
    }

    getParent() {
        return this._gameObject._parent.uiComponent;
    }

    getPositionX() {
        return this.positionX || 0;
    }

    getPositionY() {
        return this.positionY || 0;
    }

    getWidth() {
        return this.width || 0;
    }

    setHeight(height) {
        this.height = height;
    }

    setPositionX(positionX) {
        this.positionX = positionX;
    }

    setPositionY(positionY) {
        this.positionY = positionY;
    }

    setWidth(width) {
        this.width = width;
    }
}