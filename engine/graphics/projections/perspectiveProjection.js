import "../../math/utils.js";
import { Matrix4 } from "../../math/matrix.js";
import { ArgumentsParser } from "../../util/parser.js";

export class PerspectiveProjection {
    changed;
    farPlane;
    nearPlane;
    fieldOfView;
    aspectRatio;
    projectionMatrix;

    setAspectRatio = new ArgumentsParser()
        .on([Number.isFinite, Number.isFinite], (width, height) => this.setAspectRatio(width / height))
        .on([Number.isFinite], aspectRatio => {
            this.changed = this.aspectRatio != aspectRatio;
            this.aspectRatio = aspectRatio;
        }).bind();

    setFieldOfView = new ArgumentsParser()
        .on([Number.isFinite], fieldOfView => {
            this.changed = this.fieldOfView != fieldOfView;
            this.fieldOfView = fieldOfView;
        }).bind();

    setFarPlane = new ArgumentsParser()
        .on([Number.isFinite], farPlane => {
            this.changed = this.farPlane != farPlane;
            this.farPlane = farPlane;
        }).bind();

    setNearPlane = new ArgumentsParser()
        .on([Number.isFinite], nearPlane => {
            this.changed = this.nearPlane != nearPlane;
            this.nearPlane = nearPlane;
        }).bind();

    constructor(configuration = {}) {
        this.changed = true;
        this.projectionMatrix = new Matrix4();
        this.farPlane = configuration.farPlane || 10000;
        this.nearPlane = configuration.nearPlane || 0.01;
        this.fieldOfView = configuration.fieldOfView || Math.toRadians(60);
        this.aspectRatio = configuration.aspectRatio || (16 / 9);
    }

    getProjectionMatrix() {
        if (this.changed) {
            this.changed = false;
            this.projectionMatrix.apply(Matrix4.perspective(this.fieldOfView, this.aspectRatio, this.nearPlane, this.farPlane));
            this.projectionMatrix.transpose();
        }
        return this.projectionMatrix;
    }
}