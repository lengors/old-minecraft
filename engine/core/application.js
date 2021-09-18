import { Timer } from "./timer.js";
import { Manager } from "../util/manager.js";
import { GameObject } from "./gameObject.js";
import { Reflection } from "../util/reflection.js";
import { Component } from "./components/component.js";

export class Application {
    // Aplication index
    index;

    // Monitor special reference
    monitor;

    // Layer stack
    layerStack;

    // Timer
    timer = new Timer();

    // All registered systems
    systems = Array();

    // All registered objects
    objects = new Set();

    // Command queue
    commands = Array();

    // Is default behavior
    defaultBehavior = true;

    // ID manager
    manager = new Manager();

    constructor(configuration = {}) {
        this.application = this;
        this.systems.push(this);
        for (let [system, ...args] of (configuration.systems || [])) {
            system = new system(...args);
            system.application = this;
            this.systems.push(system);
        }
        this.layerStack = ['Default', ...(configuration.layerStack || []), 'UI'];
        this.defaultBehavior = configuration.defaultBehavior || true;
        this.timer.setFixedUpdateCount(configuration.fixedUpdateCount || 50);
    }

    destroyGameObject(gameObject) {
        const destroyGameObject = object => {
            if (this.objects.delete(object)) {
                this.execute('onGameObjectDestroy', object);
                this.manager.dispose(object._id);
                object.destroy();
            } else
                this.enqueueCommand(destroyGameObject, object);
        }
        this.enqueueCommand(destroyGameObject, gameObject);
    }

    enqueueCommand(command, ...objects) {
        return new Promise(resolve => {
            this.commands.push({
                objects: objects,
                promise: resolve,
                command: command
            });
        });
    }

    execute(method, ...args) {
        for (const system of this.systems)
            if (system[method])
                system[method](...args);
    }

    getGameObjects(components) {
        const objects = [];
        for (const object of this.objects)
            if (this.isGameObject(object, components))
                objects.push(object);
        return objects;
    }

    instantiateGameObject(...configurations) {
        // Instantiate game object
        const gameObject = new GameObject(...configurations, { _application: this, _id: this.manager.get() });

        // Queue add
        this.enqueueCommand(object => {
            // Add game object
            this.objects.add(object);

            // Publish game object
            this.execute('onGameObjectCreate', object);
        }, gameObject);

        // Retrieve game object
        return gameObject;
    }

    isGameObject(object, components) {
        if (!(object instanceof GameObject))
            return false;
        for (const component of components)
            if (!(object[component] instanceof Component))
                return false;
        return true;
    }

    run() {

        // Execute on init
        this.execute('onInit');

        // Execute on start
        this.execute('onStart');

        // Request new frame
        requestAnimationFrame(this.update.bind(this));
    }

    start() {
        this.run();
    }

    update() {

        // Update timer internals
        this.timer.update();

        // Resolve fixed updates
        while (this.timer.pendingFixedUpdates > 0) {

            // Execute on fixed update
            this.execute('onFixedUpdate');

            // Update pending fixed updates
            --this.timer.pendingFixedUpdates;
        }

        // Execute on update
        this.execute('onUpdate');

        // Execute on late update
        this.execute('onLateUpdate');

        // Resolve commands
        for (const { promise, command, objects } of this.commands.splice(0))

            // Execute command
            promise(command(...objects));

        // Request new frame
        requestAnimationFrame(this.update.bind(this));
    }

    static resolve() {
        Application.isReady = true;
        Application.commands = Application.commands || [];
        for (const [func, application, ...args] of Application.commands)
            func(application, ...args);
    }

    static start(application, ...args) {
        if (Application.isReady) {
            if (Reflection.isSubclass(application, Application)) {
                Application.instances = Application.instances || [];
                application = new application(...args);
                application.index = Application.instances.length;
                Application.instances.push(application);
            }
            application.start();
        } else {
            Application.commands = Application.commands || [];
            Application.commands.push([Application.start, application, ...args]);
        }
    }
}

// Start all enqueued applications
window.onload = Application.resolve;