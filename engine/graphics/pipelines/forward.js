import { Texture } from "../texture.js";
import { WebGLContext } from "../webgl/context.js";
import { Exception } from "../../core/exceptions.js";
import { Reflection } from "../../util/reflection.js";
import { GameObject } from "../../core/gameObject.js";
import { Matrix4, Vector3, Vector4 } from "../../math/matrix.js";

export class ForwardPipeline {
    _context;
    configuration;

    matrices = {
        view: null,
        world: null,
        projection: null
    }

    // helpers
    skyColor = new Vector4();
    viewPosition = new Vector3();

    meshes = new Object();
    shaders = new Object();
    programs = new Object();
    textures = new Object();

    clean = {
        meshes: new Set(),
        shaders: new Set(),
        textures: new Set(),
        programs: new Set(),
    };

    constructor(configuration = {}) {
        if (!(configuration._context && configuration._context instanceof WebGLContext))
            throw new Exception('ForwardPipeline requires WebGLContext');
        this._context = configuration._context;
        delete configuration._context;
        this.update(configuration);
    }

    call(func, values) {
        if (values)
            this._context.gl[func](...values);
        else if (this.configuration[func])
            for (const values of this.configuration[func])
                this._context.gl[func](...values);
    }

    cleanup() {
        // Clean meshes
        for (const meshID of this.clean.meshes.values())
            if (this._context.destroyMesh(meshID))
                this.clean.meshes.delete(meshID);

        // Clean textures
        for (const textureID of this.clean.textures.values())
            if (this._context.destroyTexture(textureID))
                this.clean.textures.delete(textureID);

        // Clean programs
        for (const programID of this.clean.programs.values())
            if (this._context.destroyProgram(programID))
                this.clean.programs.delete(programID);

        // Clean shaders
        for (const shaderID of this.clean.shaders.values())
            if (this._context.destroyShader(shaderID))
                this.clean.shaders.delete(shaderID);
    }

    draw(initialMaterialInstance, object, materialComponent) {

        // get required values
        const program = materialComponent.program;

        // get GPU instance of program
        const glProgram = this._context.getProgram(program);

        // Check if program is ready
        if (!glProgram)
            return;

        // Get material
        const material = materialComponent.material;

        // Get world matrix
        const world = object.getTransform().transpose();

        // Textures
        const textures = {};

        // Material instance
        const materialInstance = {
            ...initialMaterialInstance,
            world: world,
        };

        // Unit count
        let unitCount = 0;

        // get GPU instance of texture (if required)
        for (const key in material)
            if (material[key] instanceof Texture) {
                if (!(textures[key] = this._context.getTexture(material[key])))
                    return;
                materialInstance[key] = unitCount++;
            } else
                materialInstance[key] = material[key];

        // get GPU instance of mesh
        const glMesh = this._context.getMesh(object.meshComponent.mesh, glProgram);

        // bind GPU program
        this._context.useProgram(glProgram);

        // bind GPU instance of textures
        for (const key in textures)
            this._context.useTexture(textures[key], materialInstance[key]);

        // bind GPU material properties
        this._context.useMaterial(materialInstance);

        // bind GPU instance of mesh
        this._context.useMesh(glMesh);

        // issue GPU render call
        this._context.drawMesh(glMesh);
    }

    prepare() {
        this.call('clear');
    }

    register(object) {

        // Register material
        if (object.materialComponent) {

            // Get program cache
            const programID = this._context.getProgramID(object.materialComponent.program);

            // Register object as owner of program
            if ((this.programs[programID] = this.programs[programID] || new Set()).add(object._id))
                this.clean.programs.delete(programID);

            // Register object as owner of shaders
            for (const shaderID of programID)
                if ((this.shaders[shaderID] = this.shaders[shaderID] || new Set()).add(object._id))

                    // Remove from cleanup
                    this.clean.shaders.delete(shaderID);

            // Register textures
            for (const key in object.materialComponent.material)
                if (object.materialComponent.material[key] instanceof Texture) {

                    // Get texture id
                    const textureID = this._context.getTextureID(object.materialComponent.material[key]);

                    // Register object as owner of texture
                    if ((this.textures[textureID] = this.textures[textureID] || new Set()).add(object._id))

                        // Remove from cleanup
                        this.clean.textures.delete(textureID);
                }
        }

        // Register mesh
        if (object.meshComponent) {

            // Get mesh id
            const meshID = object.meshComponent.mesh.id;

            // Register mesh
            if ((this.meshes[meshID] = this.meshes[meshID] || new Set()).add(object._id))

                // Remove from cleanup
                this.clean.meshes.delete(meshID);
        }
    }

    render(camera, lights, renderables) {

        // Stacks
        const materialStack = [];

        // Already render
        const rendered = new Set();

        // Get view matrix from camera transform
        let viewMatrix = camera.getTransform();
        const viewRotation = new Vector3(Vector3.rotation(viewMatrix));
        const viewTranslation = new Vector3(Vector3.translation(viewMatrix));
        const viewTranslationMatrix = new Matrix4(Matrix4.translation(Vector3.mul(viewTranslation, -1, this.viewPosition)));
        const viewRotationMatrixX = new Matrix4(Matrix4.rotation(viewRotation.x(), Vector3.RIGHT));
        const viewRotationMatrixY = new Matrix4(Matrix4.rotation(viewRotation.y(), Vector3.UP));
        const viewRotationMatrixZ = new Matrix4(Matrix4.rotation(viewRotation.z(), Vector3.FRONT));
        viewMatrix = new Matrix4()
            .apply(Matrix4.copy(viewRotationMatrixZ))
            .dot(viewRotationMatrixY)
            .dot(viewRotationMatrixX)
            .transpose()
            .dot(viewTranslationMatrix)
            .transpose();

        // Initial material instance
        const materialInstance = {
            lightColors: [],
            view: viewMatrix,
            lightDirections: [],
            lightCount: lights.size,
            viewPosition: viewTranslation,
            projection: camera.cameraComponent.projection.getProjectionMatrix(),
            skyColor: this.skyColor.apply(Vector4.fill(...this.configuration['clearColor'][0])),
        };

        // Add lights to material instance
        for (let light of lights) {
            materialInstance.lightColors.push(light.lightComponent.color);
            materialInstance.lightDirections.push(light.lightComponent.direction);
        }

        // Render all renderables
        for (let renderable of renderables)

            // Submit to render if it has not been rendered yet
            if (!rendered.has(renderable)) {

                // Stacked objects
                const stack = [];

                // For each member of family
                for (const object of GameObject.family(renderable)) {

                    // Register renderable as rendered
                    rendered.add(renderable);

                    // Verify stack
                    while (stack[stack.length - 1] != object._parent) {

                        // Pop object from stack
                        const object = stack.pop();

                        // Pop material
                        if (object.materialComponent)
                            materialStack.pop();
                    }

                    // Push object to stack
                    stack.push(object);

                    // Push material
                    if (object.materialComponent)
                        materialStack.push(object.materialComponent);

                    // Render object
                    if (object.meshComponent)

                        // Draw object
                        this.draw(materialInstance, object, materialStack[materialStack.length - 1]);
                }

                // Pop remaining of stack
                while (stack.length != 0) {

                    // Pop object from stack
                    const object = stack.pop();

                    // Pop material
                    if (object.materialComponent)
                        materialStack.pop();
                }
            }
    }

    unregister(object) {

        // Unregister material
        if (object.materialComponent) {

            // Get program cache
            const programID = this._context.getProgramID(object.materialComponent.program);

            // Register object as owner of program
            (this.programs[programID] = this.programs[programID] || new Set()).delete(object._id);

            // Check if program is to destroy
            if (this.programs[programID].size == 0)

                // Destroy program
                this.clean.programs.add(programID);

            // Unregister object as owner of shaders
            for (const shaderID of programID) {

                // Unregister object as owner of shader
                (this.shaders[shaderID] = this.shaders[shaderID] || new Set()).delete(object._id);

                // Check if shader is to destroy
                if (this.shaders[shaderID].size == 0)

                    // Destroy shader
                    this.clean.shaders.add(shaderID);
            }

            // Unregister textures
            for (const key in object.materialComponent.material)
                if (object.materialComponent.material[key] instanceof Texture) {

                    // Get texture id
                    const textureID = this._context.getTextureID(object.materialComponent.material[key]);

                    // Unregister object as owner of texture
                    (this.textures[textureID] = this.textures[textureID] || new Set()).delete(object._id);

                    // Check if texture is to destroy
                    if (this.textures[textureID].size == 0)

                        // Destroy program
                        this.clean.textures.add(textureID);
                }
        }

        // Unregister  mesh
        if (object.meshComponent) {

            // Get mesh id
            const meshID = object.meshComponent.mesh.id;

            // Unregister mesh
            (this.meshes[meshID] = this.meshes[meshID] || new Set()).delete(object._id);

            // Check if mesh is to destroy
            if (this.meshes[meshID].size == 0)

                // Destroy program
                this.clean.meshes.add(meshID);
        }
    }

    update(configuration = {}) {
        for (const key in configuration)
            for (const values of configuration[key])
                for (let j = 0; j < values.length; ++j)
                    if (Reflection.isString(values[j]))
                        values[j] = this._context.gl[values[j]];

        if (configuration.clear)
            for (const values of configuration.clear) {
                let sum = 0;
                for (let j = 0; j < values.length; ++j)
                    sum |= values[j];
                values.splice(0);
                values.push(sum);
            }

        this.configuration = Object.assign(this.configuration || {}, configuration);
        for (const key in configuration)
            this.call(key);
    }
}