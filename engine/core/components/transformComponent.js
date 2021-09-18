import { Component } from "./component.js";
import { Matrix4, Vector3 } from "../../math/matrix.js";
import { AngleRepresentation } from "../../math/angleRepresentation.js";

export class TransformComponent extends Component {
    rowMajorTransform = new Matrix4(Matrix4.identity);
    columnMajorTransform = new Matrix4(Matrix4.identity);

    scaleMatrix = new Matrix4();
    xRotationMatrix = new Matrix4();
    yRotationMatrix = new Matrix4();
    zRotationMatrix = new Matrix4();
    translationMatrix = new Matrix4();

    scale = new Vector3();
    rotation = new Vector3();
    translation = new Vector3();

    changed = false;
    scaleChanged = false;
    rotationChanged = false;
    translationChanged = false;

    angleRepresentation;

    initialize(configuration = {}) {
        this.angleRepresentation = configuration.angleRepresentation || AngleRepresentation.Degrees;
        if (configuration.transform)
            this.setTransform(configuration.transform);
        else {
            if (configuration.scale)
                this.setScale(configuration.scale);
            if (configuration.rotation)
                this.setRotation(configuration.rotation, configuration.initialAngleRepresentation);
            if (configuration.translation)
                this.setTranslation(configuration.translation);
            if (!this.changed)
                this.setTransform(Matrix4.identity);
        }
    }

    getRowMajorTransform() {
        this._update();
        return this.rowMajorTransform;
    }

    getColumnMajorTransform() {
        this._update();
        return this.columnMajorTransform;
    }

    setScale(scale) {
        this.changed = true;
        this._setScale(scale);
    }

    setRotation(rotation, angleRepresentation) {
        this.changed = true;
        this._setRotation(rotation, angleRepresentation);
    }

    setTranslation(translation) {
        this.changed = true;
        this._setTranslation(translation);
    }

    setTransform(transform) {
        this.changed = false;
        this.rowMajorTransform.apply(transform);
        this._setScale(Vector3.scale(this.rowMajorTransform));
        this._setTranslation(Vector3.translation(this.rowMajorTransform));
        this._setRotation(Vector3.rotation(this.rowMajorTransform, this.scale), AngleRepresentation.Radians);
        this.columnMajorTransform = Matrix4.transpose(this.rowMajorTransform);
    }

    setTranslation(translation) {
        this.changed = this.changed || true;
        this.translationChanged = this.translationChanged || true;
        this.translation.apply(translation);
    }

    _setScale(scale) {
        this.scaleChanged = true;
        this.scale.apply(scale);
    }

    _setRotation(rotation, angleRepresentation) {
        this.rotationChanged = true;
        angleRepresentation = angleRepresentation || this.angleRepresentation;
        this.rotation.apply((...args) => angleRepresentation.convert(this.angleRepresentation, rotation(...args))[0]);
    }

    _setTranslation(translation) {
        this.translationChanged = true;
        this.translation.apply(translation);
    }

    _update() {
        if (this.changed) {
            if (this.scaleChanged)
                this.scaleMatrix.apply(Matrix4.scale(this.scale));
            if (this.rotationChanged) {
                this.xRotationMatrix.apply(Matrix4.rotation(this.angleRepresentation.convert(AngleRepresentation.Radians, this.rotation.x())[0], Vector3.RIGHT));
                this.yRotationMatrix.apply(Matrix4.rotation(this.angleRepresentation.convert(AngleRepresentation.Radians, this.rotation.y())[0], Vector3.UP));
                this.zRotationMatrix.apply(Matrix4.rotation(this.angleRepresentation.convert(AngleRepresentation.Radians, this.rotation.z())[0], Vector3.FRONT));
            }
            if (this.translationChanged)
                this.translationMatrix.apply(Matrix4.translation(this.translation));
            this.rowMajorTransform
                .apply(Matrix4.copy(this.translationMatrix))
                .dot(this.zRotationMatrix)
                .dot(this.yRotationMatrix)
                .dot(this.xRotationMatrix)
                .dot(this.scaleMatrix);
            this.columnMajorTransform = Matrix4.transpose(this.rowMajorTransform);
            this.changed = this.scaleChanged = this.rotationChanged = this.translationChanged = false;
        }
    }
}