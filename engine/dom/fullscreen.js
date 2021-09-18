export class Fullscreen {
    static disable() {
        if (document.fullscreenElement)
            document.exitFullscreen();
    }

    static enable(object) {
        if (!document.fullscreenEnabled || !object.windowComponent || Fullscreen.isEnabled(object))
            return;
        Fullscreen.disable();
        object.windowComponent.element.requestFullscreen();
    }

    static isEnabled(object) {
        if (!object.windowComponent)
            return false;
        if (!document.fullscreenElement)
            return false;
        return document.fullscreenElement.gameComponent == object.domComponent;
    }
}