import "../util/extensions.js";
import { Prefabs } from "./prefabs.js";
import { Exception } from "./exceptions.js";
import { Matrix4 } from "../math/matrix.js";
import { Component } from "./components/component.js";

export class GameObject {
    _id;
    _layer;
    _parent;
    _children;
    _application;

    constructor(...configurations) {
        let configuration = Prefabs.extend(...configurations);
        if (!(this._application = configuration._application))
            throw new Exception('game objects must be initialized with an application');
        if (!Number.isFinite(configuration._id) || (this._id = configuration._id) < 0)
            throw new Exception('invalid game object id');
        this._children = [];
        this._layer = 'Default';
        if (configuration._parent)
            this._parent = configuration._parent;
        this.update(configuration);
    }

    addChild(child, index) {
        if (Number.isFinite(index))
            this._children[index] = child;
        else
            this._children.push(child);
        child._parent = this;
    }

    destroy() {
        for (const key in this)
            if (this[key] instanceof Component)
                this[key].destroy();
        this._id = -1;
        this._application = null;
    }

    findChildren(components, recursively = true) {
        const results = [];
        const children = [...this._children];
        while (children.length > 0) {
            const [child] = children.splice(0, 1);
            if (this._application.isGameObject(child, components))
                results.push(child);
            if (recursively)
                children.push(...child._children);
        }
        return results;
    }

    getChild(index) {
        return this._children[index];
    }

    getChildCount() {
        return this._children.length;
    }

    getChildIndex(child) {
        return this._children.indexOf(child);
    }

    getRoot() {
        let root = this;
        while (root._parent)
            root = root._parent;
        return root;
    }

    getTransform() {
        let transform = new Matrix4(this.transformComponent ? Matrix4.copy(this.transformComponent.getRowMajorTransform()) : Matrix4.identity);
        if (this._parent)
            transform = Matrix4.dot(this._parent.getTransform(), transform, new Matrix4());
        return transform;
    }

    removeChild(index) {
        this._children.splice(index, 1)[0]._parent = null;
    }

    update(configuration) {
        // Build layer
        this._layer = configuration._layer || this._layer;

        // Build components
        for (const [key, template] of Object.entries(configuration))
            if (template._component)
                this[key] = new template._component(this);

        // Build children
        const _children = configuration._children || [];
        for (let i = 0; i < _children.length; ++i)
            if (this._children[i])
                this._children[i].update(_children[i]);
            else
                this._children[i] = this._application.instantiateGameObject({
                    _layer: this._layer
                }, _children[i], {
                    _parent: this
                });

        // Initializes component
        for (const [key, template] of Object.entries(configuration))
            if (template._component)
                this[key].initialize(template);
    }

    static family(object) {

        // Get root
        object = object.getRoot();

        // Members
        const members = [];

        // Object
        const objects = [object];

        // While object to process
        while (objects.length > 0) {

            // Get first object
            const object = objects.pop();

            // Register sub objects
            for (let i = 0; i < object.getChildCount(); ++i)
                objects.push(object.getChild(i));

            // Push members
            members.push(object);
        }

        // Retrieve objects
        return members;
    }
}