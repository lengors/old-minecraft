import { Exception } from "../core/exceptions.js";
import { Reflection } from "../util/reflection.js";
import { ResourceManager } from "../core/resourceManager.js";

export class Texture {
    image;
    wrapS;
    wrapT;
    border;
    itemSize;
    magFilter;
    minFilter;
    flipTextureX;
    flipTextureY;
    generateMipmaps;

    constructor(configuration = {}) {
        if (!(this.image = configuration.image))
            throw new Exception('Texture requires an image');
        if (!this.isImageReady())
            ResourceManager
                .loadImage(this.image)
                .then(url => this.image = ResourceManager.images.cache[url.href]);
        this.border = configuration.border;
        this.wrapS = configuration.wrapS || 0;
        this.wrapT = configuration.wrapT || 0;
        this.itemSize = configuration.itemSize || 2;
        this.magFilter = configuration.magFilter || 1;
        this.minFilter = configuration.minFilter || 1;
        this.generateMipmaps = configuration.generateMipmaps || false;
        this.flipTextureY = Reflection.isBoolean(configuration.flipTextureY) ? configuration.flipTextureY : true;
        this.flipTextureX = Reflection.isBoolean(configuration.flipTextureX) ? configuration.flipTextureX : false;
    }

    isImageReady() {
        return this.image instanceof Image || this.image instanceof Uint8Array;
    }
}