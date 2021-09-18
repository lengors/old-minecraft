import { DOMComponent } from "./component.js";
import { WebGLContext } from "../../graphics/webgl/context.js";
import { ForwardPipeline } from "../../graphics/pipelines/forward.js";

export class WindowComponent extends DOMComponent {
    context;
    pipeline;

    exitPointerLock;
    requestPointerLock;

    initialize(configuration = {}) {
        super.initialize({
            ...configuration,
            tagName: 'canvas'
        });
        const _contextConstructor = configuration.context && configuration.context._constructor ? configuration.context._constructor : WebGLContext;
        const _pipelineConstructor = configuration.pipeline && configuration.pipeline._constructor ? configuration.pipeline._constructor : ForwardPipeline;
        this.context = new _contextConstructor({
            ...(configuration.context || {}),
            _canvas: this.element
        });
        this.pipeline = new _pipelineConstructor({
            ...(configuration.pipeline || {}),
            _context: this.context
        });
    }

    requestFullscreen() {
        this.element.requestFullscreen();
    }

    setHeight(height) {
        super.setHeight(height);
        if (this.element.height != height)
            this.element.height = height;
    }

    setWidth(width) {
        super.setWidth(width);
        if (this.element.width != width)
            this.element.width = width;
    }
}