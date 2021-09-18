import { Mesh } from "../graphics/mesh.js";
import { Texture } from "../graphics/texture.js";
import { Vector3, Matrix4 } from "../math/matrix.js";
import { TransformComponent } from "./components/transformComponent.js";
import { MeshComponent } from "../graphics/components/meshComponent.js";
import { MaterialComponent } from "../graphics/components/materialComponent.js";

export class ResourceManager {
    static images = {
        cache: new Object(),
        promises: new Object()
    };

    static jsons = {
        cache: new Object(),
        promises: new Object()
    };

    static models = {
        cache: new Object(),
        promises: new Object()
    };

    static prefabs = {
        cache: new Object(),
        promises: new Object()
    };

    static resources = {
        cache: new Object(),
        promises: new Object()
    };

    static getURL(path, url = window.location.origin) {
        return new URL(path, url);
    }

    static loadImage(path, async = true) {
        const url = ResourceManager.getURL(path);
        if (!ResourceManager.images.promises[url.href])
            ResourceManager.images.promises[url.href] = new Promise((resolve, reject) => {
                if (ResourceManager.images.cache[url.href])
                    resolve(url, async);
                else {
                    const image = new Image();
                    image.onload = function () {
                        ResourceManager.images.cache[url.href] = this;
                        resolve(url, async);
                    }
                    image.onerror = (...args) => reject(url, async, ...args);
                    image.src = url.href;
                }
            });
        return ResourceManager.images.promises[url.href];
    }

    static loadJSON(path, async = true) {
        const url = ResourceManager.getURL(path);
        if (!ResourceManager.jsons.promises[url.href])
            ResourceManager.jsons.promises[url.href] = new Promise((resolve, reject) => {
                if (ResourceManager.jsons.cache[url.href])
                    resolve(url, async);
                else
                    ResourceManager.loadResource(path, async)
                        .then((url, async) => {
                            ResourceManager.jsons.cache[url.href] = JSON.parse(ResourceManager.resources.cache[url.href]);
                            resolve(url, async);
                        }).catch(reject);
            });
        return ResourceManager.jsons.promises[url.href];
    }

    static loadModel(path, async = true) {
        const url = ResourceManager.getURL(path);
        if (!ResourceManager.models.promises[url.href])
            ResourceManager.models.promises[url.href] = new Promise((resolve, reject) => {
                if (ResourceManager.models.cache[url.href])
                    resolve(url, async);
                else
                    ResourceManager.loadJSON(path, async)
                        .then((url, async) => {
                            const meshes = ResourceManager.jsons.cache[url.href].meshes;
                            const materials = ResourceManager.jsons.cache[url.href].materials;
                            const model = {
                                meshes: [],
                                materials: [],
                                node: ResourceManager.jsons.cache[url.href].rootnode,
                            };
                            for (const { materialindex, primitivetypes, vertices, normals, numuvcomponents, texturecoords, faces } of meshes) {
                                if (!model.materials[materialindex]) {
                                    const material = { index: materialindex };
                                    for (const { key, value } of materials[materialindex].properties)
                                        if (key == '$mat.shininess')
                                            material.shininess = value;
                                        else if (key == '$clr.diffuse')
                                            material.diffuse = new Vector3(Vector3.fill(...value));
                                        else if (key == '$clr.ambient')
                                            material.ambient = new Vector3(Vector3.fill(...value));
                                        else if (key == '$clr.specular')
                                            material.specular = new Vector3(Vector3.fill(...value));
                                    for (const { type, path, texflags }
                                        of materials[materialindex].textures)
                                        if (type == 0) {
                                            material.albedoMap = new Texture({
                                                image: ResourceManager.getURL(path, url).pathname,
                                                itemSize: numuvcomponents[0],
                                            });
                                            for (const { key, value } of texflags)
                                                if (key == '$tex.gen_mipmaps')
                                                    material.albedoMap.generateMipmaps = parseInt(value) > 0;
                                                else if (key == '$tex.min_filter')
                                                    material.albedoMap.minFilter = parseInt(value);
                                                else if (key == '$tex.mag_filter')
                                                    material.albedoMap.magFilter = parseInt(value);
                                                else if (key == '$tex.wrap_s')
                                                    material.albedoMap.wrapS = parseInt(value);
                                                else if (key == '$tex.wrap_t')
                                                    material.albedoMap.wrapT = parseInt(value);
                                                else if (key == '$tex.flip_x')
                                                    material.albedoMap.flipTextureX = parseInt(value) > 0;
                                                else if (key == '$tex.flip_y')
                                                    material.albedoMap.flipTextureY = parseInt(value) > 0;
                                        }
                                    model.materials[materialindex] = material;
                                }
                                model.meshes.push(new Mesh({
                                    primitive: primitivetypes,
                                    faces: Array.prototype.concat.apply([], faces),
                                    attributes: {
                                        normals: {
                                            data: normals,
                                            itemSize: 3
                                        },
                                        vertices: {
                                            data: vertices,
                                            itemSize: 3
                                        },
                                        coordinates: {
                                            data: Array.prototype.concat.apply([], texturecoords),
                                            itemSize: numuvcomponents[0]
                                        }
                                    }
                                }));
                            }

                            ResourceManager.models.cache[url.href] = model;
                            resolve(url, async);
                        }).catch(reject);
            });
        return ResourceManager.models.promises[url.href];
    }

    static loadPrefab(path, async = true) {
        const url = ResourceManager.getURL(path);
        if (!ResourceManager.prefabs.promises[url.href])
            ResourceManager.prefabs.promises[url.href] = new Promise((resolve, reject) => {
                if (ResourceManager.prefabs.cache[url.href])
                    resolve(url, async);
                else
                    ResourceManager.loadModel(path, async)
                        .then(() => {
                            // Model to process
                            const model = ResourceManager.models.cache[url.href];

                            // Prefabs to process
                            const prefabs = [{
                                prefab: {
                                    _children: []
                                },
                                node: model.node
                            }];

                            // Set root prefab
                            const [root] = prefabs;
                            ResourceManager.prefabs.cache[url.href] = root.prefab;

                            // While prefabs to process
                            while (prefabs.length > 0) {

                                // Get first node
                                const [{ prefab, node }] = prefabs.splice(0, 1);

                                // Set transform
                                if (node.transformation)
                                    prefab.transformComponent = {
                                        _component: TransformComponent,
                                        transform: Matrix4.fill(...node.transformation)
                                    };

                                // Process mesh
                                if (node.meshes && node.meshes.length > 0) {
                                    // Get mesh index (How can there be more than one mesh per node?)
                                    let mesh = node.meshes[0];

                                    // Get material index
                                    let material = ResourceManager.jsons.cache[url.href].meshes[mesh].materialindex;

                                    // Get actual mesh
                                    prefab.meshComponent = {
                                        _component: MeshComponent,
                                        mesh: model.meshes[mesh]
                                    };

                                    // Create material component
                                    prefab.materialComponent = {
                                        _component: MaterialComponent,
                                        material: model.materials[material]
                                    };
                                }

                                // Push children
                                if (node.children)
                                    for (const child of node.children) {
                                        const childPrefab = {
                                            _children: []
                                        };
                                        prefab._children.push(childPrefab);
                                        prefabs.push({
                                            prefab: childPrefab,
                                            node: child
                                        })
                                    }
                            }

                            // Resolve
                            resolve(url, async);
                        }).catch(reject);
            });
        return ResourceManager.prefabs.promises[url.href];
    }

    static loadResource(path, async = true) {
        const url = ResourceManager.getURL(path);
        if (!ResourceManager.resources.promises[url.href])
            ResourceManager.resources.promises[url.href] = new Promise((resolve, reject) => {
                if (ResourceManager.resources.cache[url.href])
                    resolve(url, async);
                else {
                    const request = new XMLHttpRequest();
                    request.open('GET', url.href, async);
                    request.onload = function () {
                        if (this.status >= 200 && this.status < 300) {
                            ResourceManager.resources.cache[url.href] = this.responseText;
                            resolve(url, async);
                        } else
                            reject({
                                url: url,
                                status: this.status,
                                statusText: this.statusText
                            });
                    }
                    request.onerror = function () {
                        reject({
                            url: url,
                            status: this.status,
                            statusText: this.statusText
                        });
                    }
                    request.send();
                }
            });
        return ResourceManager.resources.promises[url.href];
    }
}