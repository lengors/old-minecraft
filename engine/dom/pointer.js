import { Exception } from "../core/exceptions.js";

export class Pointer {
    static exitPointerLock() {
        if (Pointer.getPointerLockElement()) {
            if (Pointer._exitPointerLock)
                Pointer._exitPointerLock();
            Pointer._exitPointerLock = document.exitPointerLock
                || document.oExitPointerLock
                || document.msExitPointerLock
                || document.mozExitPointerLock
                || document.webkitExitPointerLock;
            if (!Pointer._exitPointerLock)
                throw new Exception('pointer lock not supported by your browser');
            Pointer._exitPointerLock = Pointer._exitPointerLock.bind(document);
            Pointer._exitPointerLock();
        }
    }

    static getPointerLockChangeEvent() {
        if (Pointer._pointerLockChangeEvent)
            return Pointer._pointerLockChangeEvent;
        else if ('onpointerlockchange' in document)
            Pointer._pointerLockChangeEvent = 'pointerlockchange';
        else if ('onopointerlockchange' in document)
            Pointer._pointerLockChangeEvent = 'opointerlockchange';
        else if ('onmspointerlockchange' in document)
            Pointer._pointerLockChangeEvent = 'mspointerlockchange';
        else if ('onmozpointerlockchange' in document)
            Pointer._pointerLockChangeEvent = 'mozpointerlockchange';
        else if ('onwebkitpointerlockchange' in document)
            Pointer._pointerLockChangeEvent = 'webkitpointerlockchange';
        else
            throw new Exception('pointer lock change event not supported by your browser');
        return Pointer._pointerLockChangeEvent;
    }

    static getPointerLockElement() {
        return document.pointerLockElement
            || document.oPointerLockElement
            || document.msPointerLockElement
            || document.mozPointerLockElement
            || document.webkitPointerLockElement;
    }

    static getPointerLockObject() {
        const pointerLockElement = Pointer.getPointerLockElement();
        if (!pointerLockElement)
            return null;
        if (!pointerLockElement.gameComponent)
            return null;
        return pointerLockElement.gameComponent._gameObject;
    }

    static requestPointerLock(gameObject) {
        if (gameObject.domComponent) {
            if (gameObject.domComponent._requestPointerLock)
                gameObject.domComponent._requestPointerLock();
            gameObject.domComponent._requestPointerLock = gameObject.domComponent.element.requestPointerLock
                || gameObject.domComponent.element.oRequestPointerLock
                || gameObject.domComponent.element.msRequestPointerLock
                || gameObject.domComponent.element.mozRequestPointerLock
                || gameObject.domComponent.element.webkitRequestPointerLock;
            if (!gameObject.domComponent._requestPointerLock)
                throw new Exception('pointer lock not supported by your browser on the DOM element');
            gameObject.domComponent._requestPointerLock = gameObject.domComponent._requestPointerLock.bind(gameObject.domComponent.element);
            gameObject.domComponent._requestPointerLock();
        }
    }
}