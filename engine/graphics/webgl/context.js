import { Exception } from "../../core/exceptions.js";
import { ResourceManager } from "../../core/resourceManager.js"

export class WebGLContext {
    gl;

    filters = [];
    uniforms = {};
    wrapModes = [];
    primitives = [];
    textureTargets = [];

    meshes = new Object();
    shaders = new Object();
    programs = new Object();
    textures = new Object();
    vertexArrays = new Object();
    vertexBuffers = new Object();

    getMesh;
    useMesh;
    drawMesh;
    destroyMesh;

    drawType;
    faceType;

    // optimization to avoid constant binding
    usedProgram;
    usedVertexArray;
    usedVertexBuffers;
    usedTextures = [];

    constructor(configuration = {}) {
        // Canvas is mandatory
        if (!configuration._canvas)
            throw new Exception('the instantiation of a WebGL context requires a canvas');

        // Get WebGL context
        this.gl = configuration._canvas.getContext('webgl2') || configuration._canvas.getContext('webgl') || configuration._canvas.getContext('experimental-webgl');

        // WebGL context is mandatory
        if (!this.gl)
            throw new Exception('your browser doesn\'t support WebGL');

        // Set bind, draw and get mesh functions
        if (this.gl instanceof WebGLRenderingContext) {
            this.faceType = Uint16Array;
            this.drawType = this.gl.UNSIGNED_SHORT;
            this.getMesh = this.getVertexBuffers;
            this.useMesh = this.useVertexBuffers;
            this.drawMesh = this.drawVertexBuffers;
            this.destroyMesh = this.destroyVertexBuffers;
        } else {
            this.faceType = Uint32Array;
            this.drawType = this.gl.UNSIGNED_INT;
            this.getMesh = this.getVertexArray;
            this.useMesh = this.useVertexArray;
            this.drawMesh = this.drawVertexArray;
            this.destroyMesh = this.destroyVertexArray;
        }

        // Set primitives map
        this.primitives[0] = this.gl.POINTS;
        this.primitives[1] = this.gl.LINES;
        this.primitives[2] = this.gl.LINE_STRIP;
        this.primitives[3] = this.gl.LINE_LOOP;
        this.primitives[4] = this.gl.TRIANGLES;
        this.primitives[5] = this.gl.TRIANGLE_STRIP;
        this.primitives[6] = this.gl.TRIANGLE_FAN;

        // Set filters map
        this.filters[0] = this.gl.LINEAR;
        this.filters[1] = this.gl.NEAREST;
        this.filters[2] = this.gl.NEAREST_MIPMAP_NEAREST;
        this.filters[3] = this.gl.LINEAR_MIPMAP_NEAREST;
        this.filters[4] = this.gl.NEAREST_MIPMAP_LINEAR;
        this.filters[5] = this.gl.LINEAR_MIPMAP_LINEAR;

        // Set wrap modes
        this.wrapModes[0] = this.gl.REPEAT;
        this.wrapModes[1] = this.gl.MIRRORED_REPEAT;
        this.wrapModes[2] = this.gl.CLAMP_TO_EDGE;
        this.wrapModes[3] = this.gl.CLAMP_TO_BORDER;

        // Set texture target maps
        this.textureTargets[0] = this.gl.TEXTURE_2D;
        this.textureTargets[1] = this.gl.TEXTURE_3D;
        this.textureTargets[2] = this.gl.TEXTURE_CUBE_MAP;

        // Set uniforms' submit functions map
        this.uniforms[this.gl.FLOAT] = [this.gl.uniform1f.bind(this.gl), this.unravelVector1(this.gl.uniform1fv.bind(this.gl))];
        this.uniforms[this.gl.FLOAT_VEC2] = [this.unravelVector2(this.unravel(this.gl.uniform2f.bind(this.gl))), this.unravelVector2(this.gl.uniform2fv.bind(this.gl))];
        this.uniforms[this.gl.FLOAT_VEC3] = [this.unravelVector3(this.unravel(this.gl.uniform3f.bind(this.gl))), this.unravelVector3(this.gl.uniform3fv.bind(this.gl))];
        this.uniforms[this.gl.FLOAT_VEC4] = [this.unravelVector4(this.unravel(this.gl.uniform4f.bind(this.gl))), this.unravelVector4(this.gl.uniform4fv.bind(this.gl))];
        this.uniforms[this.gl.FLOAT_MAT2] = [this.unravelMatrix(this.gl.uniformMatrix2fv.bind(this.gl)), this.unravelMatrix(this.gl.uniformMatrix2fv.bind(this.gl))];
        this.uniforms[this.gl.FLOAT_MAT3] = [this.unravelMatrix(this.gl.uniformMatrix3fv.bind(this.gl)), this.unravelMatrix(this.gl.uniformMatrix3fv.bind(this.gl))];
        this.uniforms[this.gl.FLOAT_MAT4] = [this.unravelMatrix(this.gl.uniformMatrix4fv.bind(this.gl)), this.unravelMatrix(this.gl.uniformMatrix4fv.bind(this.gl))];
        this.uniforms[this.gl.INT] = [this.gl.uniform1i.bind(this.gl), this.unravelVector1(this.gl.uniform1iv.bind(this.gl))];
        this.uniforms[this.gl.INT_VEC2] = [this.unravelVector2(this.unravel(this.gl.uniform2i.bind(this.gl))), this.unravelVector2(this.gl.uniform2iv.bind(this.gl))];
        this.uniforms[this.gl.INT_VEC3] = [this.unravelVector3(this.unravel(this.gl.uniform3i.bind(this.gl))), this.unravelVector3(this.gl.uniform3iv.bind(this.gl))];
        this.uniforms[this.gl.INT_VEC4] = [this.unravelVector4(this.unravel(this.gl.uniform4i.bind(this.gl))), this.unravelVector4(this.gl.uniform4iv.bind(this.gl))];
        this.uniforms[this.gl.SAMPLER_2D] = this.uniforms[this.gl.INT];
        this.uniforms[this.gl.SAMPLER_3D] = this.uniforms[this.gl.INT];
        this.uniforms[this.gl.SAMPLER_CUBE] = this.uniforms[this.gl.INT];
    }

    destroyProgram(programID) {
        // Get prorgram
        let glProgram = this.programs[programID];

        // Check program
        if (!glProgram)
            return false;

        // Destroy program
        this.gl.deleteProgram(glProgram.gl);

        // Remove program
        delete this.programs[programID];

        // Program deleted
        return true;
    }

    destroyShader(shaderID) {

        // Get shader
        let glShader = this.shaders[shaderID];

        // Check shader
        if (!glShader || Promise.resolve(glShader) == glShader)
            return false;

        // Destroy shader
        this.gl.deleteShader(glShader.gl);

        // Remove shader
        delete this.shaders[shaderID];

        // Shader deleted
        return true;
    }

    destroyTexture(textureID) {

        // Get texture
        let glTexture = this.textures[textureID];

        // Check texture
        if (!glTexture)
            return false;

        // Destroy texture
        this.gl.deleteTexture(glTexture.gl);

        // Remove texture
        delete this.textures[textureID];

        // Texture deleted
        return true;
    }

    destroyVertexArray(meshID) {

        // Get vertex array
        let glVertexArray = this.vertexArrays[meshID];

        // Check vertex array
        if (!glVertexArray)
            return false;

        // Delete vertex buffers
        if (!this.destroyVertexBuffers(meshID))
            return false;

        // Destroy vertex array
        this.gl.deleteVertexArray(glVertexArray.gl);

        // Remove vertex array
        delete this.vertexArrays[meshID];

        // Vertex array deleted
        return true;
    }

    destroyVertexBuffers(meshID) {

        // Get vertex buffers
        let glVertexBuffers = this.vertexBuffers[meshID];

        // Check vertex buffers
        if (!glVertexBuffers)
            return false;

        // Delete attributes
        for (const attribute in glVertexBuffers.attributes)
            this.gl.deleteBuffer(glVertexBuffers.attributes[attribute].gl);

        // Destroy vertex buffers
        this.gl.deleteBuffer(glVertexBuffers.gl);

        // Remove vertex buffers
        delete this.vertexBuffers[meshID];

        // Vertex array deleted
        return true;
    }

    drawVertexArray(glVertexArray) {
        this.drawVertexBuffers(glVertexArray.buffers);
    }

    drawVertexBuffers(glBuffers) {
        this.gl.drawElements(glBuffers.primitive, glBuffers.itemCount, this.drawType, 0);
    }

    getProgramID(program) {

        // Program id
        const id = [];

        // Get individual IDs
        for (const key in program)
            id.push(this.getShaderID(program[key]));

        // Retrieve id
        return id;
    }

    getProgram(program) {

        // Shaders instances
        const glShaders = [];

        // Load shaders
        for (const key in program) {

            // Link
            const shader = program[key];

            // Get shader instance or promise
            const glShader = this.getShader(shader, key);

            // Check shader
            if (Promise.resolve(glShader) == glShader)
                return null;

            // Shader is loaded
            glShaders.push(glShader);
        }

        // Get program id
        const id = this.getProgramID(program);

        // Get program
        let glProgram = this.programs[id];

        // Check program
        if (!glProgram) {

            // Generate program
            glProgram = {
                id: id,
                uniforms: {},
                attributes: {},
                gl: this.gl.createProgram(),
            };

            // Attach shaders
            glShaders.forEach(glShader => this.gl.attachShader(glProgram.gl, glShader.gl));

            // Link program
            this.gl.linkProgram(glProgram.gl);

            // Check linkage
            if (!this.gl.getProgramParameter(glProgram.gl, this.gl.LINK_STATUS))
                throw new Exception(`WebGL: linking program: ${this.gl.getProgramInfoLog(glProgram.gl)}`);

            // Validate program
            this.gl.validateProgram(glProgram.gl);

            // Check validation
            if (!this.gl.getProgramParameter(glProgram.gl, this.gl.VALIDATE_STATUS))
                throw new Exception(`WebGL: validating program: ${this.gl.getProgramInfoLog(glProgram.gl)}`);

            // Get attributes
            const glAttributeCount = this.gl.getProgramParameter(glProgram.gl, this.gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < glAttributeCount; ++i) {
                const glAttribute = this.gl.getActiveAttrib(glProgram.gl, i);
                glProgram.attributes[glAttribute.name] = glAttribute;
                glProgram.attributes[glAttribute.name].location = this.gl.getAttribLocation(glProgram.gl, glAttribute.name);
            }

            // Get uniforms
            const glUniformCount = this.gl.getProgramParameter(glProgram.gl, this.gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < glUniformCount; ++i) {
                const glUniform = this.gl.getActiveUniform(glProgram.gl, i);
                const glIsArray = glUniform.name.endsWith('[0]');
                const name = glIsArray ? glUniform.name.slice(0, glUniform.name.length - '[0]'.length) : glUniform.name;
                if (glIsArray) {
                    glUniform.isArray = 1;
                    glUniform.locations = [];
                    for (let i = 0; i < glUniform.size; ++i)
                        glUniform.locations[i] = this.gl.getUniformLocation(glProgram.gl, `${name}[${i}]`);
                } else {
                    glUniform.isArray = 0;
                    glUniform.location = this.gl.getUniformLocation(glProgram.gl, glUniform.name);
                }
                glProgram.uniforms[name] = glUniform;
            }

            // Detach shaders
            glShaders.forEach(glShader => this.gl.detachShader(glProgram.gl, glShader.gl));

            // Update program register and retrieve promise
            this.programs[id] = glProgram;
        }

        // Retrieve shader
        return glProgram;
    }

    getShaderID(shader) {
        return ResourceManager.getURL(shader).href;
    }

    getShader(shader, shaderType) {

        // Get shader id
        const id = this.getShaderID(shader);

        // Get shader
        let glShader = this.shaders[id];

        // Check shader
        if (!glShader)

            // Create shader promise
            glShader = this.shaders[id] = ResourceManager
                .loadResource(shader)
                .then(url => {

                    // Get shader type
                    shaderType = shaderType.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
                        .toUpperCase();

                    // Get shader type value
                    shaderType = this.gl[shaderType];

                    // Create shader
                    const glShader = {
                        id: id,
                        gl: this.gl.createShader(shaderType)
                    };

                    // Set source
                    this.gl.shaderSource(glShader.gl, ResourceManager.resources.cache[url.href]);

                    // Compile
                    this.gl.compileShader(glShader.gl);

                    // Check compilation
                    if (!this.gl.getShaderParameter(glShader.gl, this.gl.COMPILE_STATUS))
                        throw new Exception(`WebGL: compiling shader: ${this.gl.getShaderInfoLog(glShader.gl)}`);

                    // Update shader register
                    this.shaders[id] = glShader;
                });

        // Retrieve shader
        return glShader;
    }

    getTextureID(texture) {
        return ResourceManager.getURL(texture.image.src).href;
    }

    getTexture(texture) {

        // Check if image is ready
        if (!texture.isImageReady())
            return null;

        // Get id
        const id = this.getTextureID(texture);

        // Get texture
        let glTexture = this.textures[id];

        // Check texture
        if (!glTexture) {

            // Generate texture
            glTexture = {
                id: id,
                gl: this.gl.createTexture(),
                target: this.textureTargets[texture.itemSize - 2]
            }

            // Bind texture
            this.gl.bindTexture(glTexture.target, glTexture.gl);

            // Set parameters
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, texture.flipTextureY);
            this.gl.texParameteri(glTexture.target, this.gl.TEXTURE_MIN_FILTER, this.filters[texture.minFilter]);
            this.gl.texParameteri(glTexture.target, this.gl.TEXTURE_MAG_FILTER, this.filters[texture.magFilter]);
            this.gl.texParameteri(glTexture.target, this.gl.TEXTURE_WRAP_S, this.wrapModes[texture.wrapS]);
            this.gl.texParameteri(glTexture.target, this.gl.TEXTURE_WRAP_T, this.wrapModes[texture.wrapT]);
            if (texture.border)
                this.gl.texParameterfv(glTexture.target, this.gl.TEXTURE_BORDER_COLOR, texture.border);

            // Upload data
            this.gl.texImage2D(glTexture.target, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.image);

            // Generate mipmaps if requested
            if (texture.generateMipmaps)
                this.gl.generateMipmap(glTexture.target);

            // Update texture
            this.textures[id] = glTexture;
        }

        // Retrieve texture
        return glTexture;
    }

    getVertexArray(mesh) {

        // Get vertex array
        let glVertexArray = this.vertexArrays[mesh.id];

        // Check vertex array
        if (!glVertexArray) {

            // Create vertex array
            glVertexArray = this.vertexArrays[mesh.id] = {
                id: mesh.id,
                buffers: null,
                programs: new Set(),
                gl: this.gl.createVertexArray(),
            };

            // Bind vertex array
            this.gl.bindVertexArray(glVertexArray.gl);

            // Create vertex buffers
            glVertexArray.buffers = this.getVertexBuffers(mesh);
        }

        // Retrieve vertex array
        return glVertexArray;
    }

    getVertexBuffers(mesh) {

        // Get vertex buffers
        let glVertexBuffers = this.vertexBuffers[mesh.id];

        // Check vertex buffers
        if (!glVertexBuffers) {

            // Get vertex buffers
            glVertexBuffers = this.vertexBuffers[mesh.id] = {
                attributes: {},
                gl: this.gl.createBuffer(),
                itemCount: mesh.faces.length,
                primitive: this.primitives[mesh.primitive],
            };

            // Bind element buffer
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, glVertexBuffers.gl);

            // Update element buffer data
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new this.faceType(mesh.faces), this.gl.STATIC_DRAW);

            // Create attributes
            for (const attribute in mesh.attributes) {

                // Get data and size
                const { data, itemSize } = mesh.attributes[attribute];

                // Create buffer
                const attributeBuffer = glVertexBuffers.attributes[attribute] = {
                    gl: this.gl.createBuffer(),
                    itemSize: itemSize
                }

                // Bind buffer
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attributeBuffer.gl);

                // Update buffer data
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
            }
        }

        // Retrieve vertex buffers
        return glVertexBuffers;
    }

    useMaterial(material) {

        // Use material
        for (const key in this.usedProgram.uniforms) {
            const glValue = material[key];
            const glUniform = this.usedProgram.uniforms[key];
            if (glUniform.isArray == 1) {
                const size = Math.min(glValue.length, glUniform.size);
                const uniformSetter = this.uniforms[glUniform.type][glUniform.isArray];
                for (let i = 0; i < size; ++i)
                    uniformSetter(glUniform.locations[i], glValue[i]);
            } else
                this.uniforms[glUniform.type][glUniform.isArray](glUniform.location, glValue);
        }
    }

    useProgram(glProgram) {

        // Check used program
        if (this.usedProgram != glProgram)

            // Use program
            this.gl.useProgram((this.usedProgram = glProgram).gl);
    }

    useTexture(glTexture, glUnit) {

        // Check used texture
        if (this.usedTextures[glUnit] != glTexture) {

            // Used texture
            this.gl.activeTexture(this.gl.TEXTURE0 + glUnit);
            this.gl.bindTexture(glTexture.target, (this.usedTextures[glUnit] = glTexture).gl);
        }
    }

    useVertexArray(glVertexArray) {

        // Check used vertex array
        if (this.usedVertexArray != glVertexArray) {

            // Check vertex array programs
            if (!glVertexArray.programs.has(this.usedProgram)) {

                // Use vertex buffers
                this.useVertexBuffers(glVertexArray.buffers);

                // Register program
                glVertexArray.programs.add(this.usedProgram);
            }

            // Use vertex array
            this.gl.bindVertexArray((this.usedVertexArray = glVertexArray).gl);
        }
    }

    useVertexBuffers(glVertexBuffers) {

        // Check current vertex buffer in use
        if (this.usedVertexBuffers != glVertexBuffers) {

            // Bind element buffer
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, (this.usedVertexBuffers = glVertexBuffers).gl);

            // Set attributes
            for (const attribute in this.usedProgram.attributes) {
                const attrib = this.usedProgram.attributes[attribute];
                const buffer = glVertexBuffers.attributes[attribute];
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.gl);
                this.gl.vertexAttribPointer(attrib.location, buffer.itemSize, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(attrib.location);
            }
        }
    }

    unravel(func) {
        return (location, values) => func(location, ...values);
    }

    unravelVector1(func) {
        return (location, ...values) => func(location, values);
    }

    unravelVector2(func) {
        return (location, ...values) => func(location, values.flatMap(value => [value.x(), value.y()]));
    }

    unravelVector3(func) {
        return (location, ...values) => func(location, values.flatMap(value => [value.x(), value.y(), value.z()]));
    }

    unravelVector4(func) {
        return (location, ...values) => func(location, values.flatMap(value => [value.x(), value.y(), value.z(), value.y()]));
    }

    unravelMatrix(func) {
        return (location, ...values) => func(location, false, values.flatMap(value => value.data));
    }
}