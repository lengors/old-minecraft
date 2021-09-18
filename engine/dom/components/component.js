import { UUID } from "../../util/uuid.js";
import { Exception } from "../../core/exceptions.js";
import { UIComponent } from "../../ui/components/component.js";

export class DOMComponent extends UIComponent {
    element;

    initialize(configuration = {}) {
        if (configuration.element && configuration.id)
            throw new Exception('you can only specify either the DOM id or the DOM element');
        if (configuration.element)
            this.element = configuration.element;
        else {
            const id = configuration.id || UUID.generate();
            this.element = document.getElementById(id);
            if (!this.element) {
                if (!configuration.tagName) {
                    this.element = document.body;
                    this.element.id = this.element.id || UUID.generate();
                } else {
                    this.element = document.createElement(configuration.tagName);
                    this.element.id = id;
                    if (!(this._gameObject._parent && this._gameObject._parent.domComponent) && this.element != document.body && document.body.gameComponent)
                        document.body.gameComponent._gameObject.addChild(this._gameObject);
                    if (this._gameObject._parent && this._gameObject._parent.domComponent)
                        this._gameObject._parent.domComponent.element.appendChild(this.element);
                }
            }
        }
        if (this.element.gameComponent)
            throw new Exception('only one DOMComponent is allowed per DOM element');
        this.element.gameComponent = this;
        if (!this._gameObject.domComponent)
            this._gameObject.domComponent = this;
        super.initialize(configuration);
        this.set('position', 'absolute');
    }

    get(property) {
        const value = getComputedStyle(this.element)[property];
        const result = parseInt(value);
        return Number.isFinite(result) ? result : value;
    }

    getHeight() {
        return this.element.getBoundingClientRect().height;
    }

    getPositionX() {
        return this.element.getBoundingClientRect().x;
    }

    getPositionY() {
        return this.element.getBoundingClientRect().y;
    }

    getWidth() {
        return this.element.getBoundingClientRect().width;
    }

    set(property, value) {
        if (Number.isFinite(value))
            value = `${value}px`;
        if (this.element.style[property] != value)
            this.element.style[property] = value;
    }

    setHeight(value) {
        this.set('height', value);
    }

    setPositionX(value) {
        this.set('left', value);
    }

    setPositionY(value) {
        this.set('top', value);
    }

    setWidth(value) {
        this.set('width', value);
    }
}