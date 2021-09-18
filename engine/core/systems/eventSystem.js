import { System } from "./system.js";
import { Pointer } from "../../dom/pointer.js";

export class EventSystem extends System {
    focusedElement;
    windowObserver;
    monitorObserver;

    constructor(configuration = {}) {
        super({
            ...configuration,
            windows: ['windowComponent'],
            monitors: ['monitorComponent'],
        });
        this.focusedElement = document.body;
        document.addEventListener('keydown', this.onKeyDownCallback.bind(this));
        document.addEventListener('click', this.onMouseClickCallback.bind(this));
        document.addEventListener('keyup', this.onKeyReleaseCallback.bind(this));
        document.addEventListener('keypress', this.onKeyPressCallback.bind(this));
        document.addEventListener('mousemove', this.onMouseMoveCallback.bind(this));
        this.windowObserver = new ResizeObserver(this.onWindowResizeCallback.bind(this));
        this.monitorObserver = new ResizeObserver(this.onMonitorResizeCallback.bind(this));
        document.addEventListener(Pointer.getPointerLockChangeEvent(), this.onPointerLockChangeCallback.bind(this));
    }

    onElementFocusCallback(event) {
        // Check for game component
        if (event.target.gameComponent) {

            // Get game object
            const gameObject = event.target.gameComponent._gameObject;

            // Execute onWindowFocus if it's a windowComponent
            if (gameObject.windowComponent)
                this.application.execute('onWindowFocus', { target: gameObject }, this);
        }

        // Update focused element
        this.focusedElement = event.target;
    }

    onElementLostFocusCallback(event) {
        // Check for game component
        if (event.target.gameComponent) {

            // Get game object
            const gameObject = event.target.gameComponent._gameObject;

            // Execute onWindowFocus if it's a windowComponent
            if (gameObject.windowComponent)
                this.application.execute('onWindowLostFocus', { target: gameObject }, this);
        }

        // Update focused element
        this.focusedElement = null;
    }

    onGameObjectCreate(object) {
        for (const cache of super.onGameObjectCreate(object))
            if (cache == this.windows) {
                this.windowObserver.observe(object.windowComponent.element);
                object.windowComponent.element.addEventListener('focus', this.onElementFocusCallback.bind(this));
                object.windowComponent.element.addEventListener('blur', this.onElementLostFocusCallback.bind(this));
            } else if (cache == this.monitors)
                this.monitorObserver.observe(object.monitorComponent.element);
    }

    onKeyDownCallback(event) {
        this.application.pressedKeys = this.application.pressedKeys || [];
        this.application.pressedKeys[event.keyCode] = true;
        this.application.execute('onKeyDown', event, this);
    }

    onKeyPressCallback(event) {
        this.application.execute('onKeyPress', event, this);
    }

    onKeyReleaseCallback(event) {
        this.application.execute('onKeyRelease', event, this);
        this.application.pressedKeys = this.application.pressedKeys || [];
        this.application.pressedKeys[event.keyCode] = false;
    }

    onMonitorResizeCallback(mutations) {
        const events = {};
        for (const mutation of mutations) {
            events[mutation.target.id] = events[mutation.target.id] || {
                target: mutation.target.gameComponent._gameObject
            };
            events[mutation.target.id].width = mutation.target.gameComponent.getWidth();
            events[mutation.target.id].height = mutation.target.gameComponent.getHeight();
        }
        this.application.execute('onMonitorResize', Object.values(events), this);
    }

    onMouseClickCallback(event) {
        // If target different from focused elemenet than trigger focus event and lost focus if any element was previously focused
        if (event.target != this.focusedElement) {

            // If previous focused element invoke on focus callback
            if (this.focusedElement)
                this.onElementLostFocusCallback({ target: this.focusedElement });

            // On focus callback
            this.onElementFocusCallback({ target: event.target });
        }

        // Check if target has game component
        if (event.target.gameComponent) {
            // Get new focused object
            const gameObject = event.target.gameComponent._gameObject;

            // Trigger mouse click event (events unrelated to DOM elements without a DOM component aren't handled by the engine)
            this.application.execute('onMouseClick', { target: gameObject }, this);
        }
    }

    onMouseMoveCallback(event) {
        this.application.execute('onMouseMove', event);
    }

    onPointerLockChangeCallback() {
        this.application.execute('onPointerLockChange', this);
    }

    onWindowResizeCallback(mutations) {
        const events = {};
        for (const mutation of mutations) {
            events[mutation.target.id] = events[mutation.target.id] || {
                target: mutation.target.gameComponent._gameObject
            };
            events[mutation.target.id].width = mutation.target.gameComponent.getWidth();
            events[mutation.target.id].height = mutation.target.gameComponent.getHeight();
        }
        this.application.execute('onWindowResize', Object.values(events), this);
    }
}