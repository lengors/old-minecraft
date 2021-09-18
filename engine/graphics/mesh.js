import { Exception } from "../core/exceptions.js";
import { Vector, Vector3 } from "../math/matrix.js";

export class Mesh {
    primitive;

    faces;
    attributes;

    constructor(configuration = {}) {
        Object
            .entries(configuration)
            .forEach(([key, value]) => this[key] = value);

        // Invalid mesh
        if (!this.attributes
            || !this.attributes.vertices
            || !this.attributes.vertices.data
            || !this.attributes.vertices.itemSize
            || this.attributes.vertices.data.length % this.attributes.vertices.itemSize != 0)
            throw new Exception('mesh must have at least its vertices defined ');

        // Invalid primitive type
        if (!Number.isFinite(this.primitive) || this.primitive < 0 || this.primitive > 6)
            throw new Exception('invalid primitive type');

        if (!configuration.hasOwnProperty('computeNormals'))
            configuration.computeNormals = true;

        // Compute normals
        if (!this.attributes.normals && configuration.computeNormals)
            this.computeNormals();

        // Compute faces
        if (!this.faces)
            this.computeFaces();
    }

    // Calculates faces based on attributes (override existing faces)
    computeFaces() {
        // Vertices
        const { data, itemSize } = this.attributes.vertices;

        // Mapped faces
        const faces = {};

        // Faces data
        this.faces = [];

        // Create faces
        for (let i = 0; i < data.length / itemSize;) {

            // Build vertex
            const vertex = Object
                .values(this.attributes)
                .flatMap(({ data, itemSize }) => data.slice(i * itemSize, (i + 1) * itemSize));

            // Current face
            let face;

            // Check if face is already defined
            if (Number.isFinite(face = faces[vertex]))

                // Remove vertex
                Object
                    .values(this.attributes)
                    .forEach(({ data, itemSize }) => data.splice(i * itemSize, itemSize));

            else

                // Create face
                face = faces[vertex] = i++;


            // Push face
            this.faces.push(face);
        }
    }

    // TODO implement for remaining primitive types where it makes sense
    computeNormals() {

        // There's no face normals for lines and points and calculation for other triangle like primitives are not supported
        if (this.primitive == 4) {

            // Face size is always 3
            const faceSize = 3;

            // Rebuild faces
            const rebuildFaces = this.faces ? true : false;

            // Build vertices from faces
            if (rebuildFaces) {

                // Rebuild attributes
                for (const attribute of Object.values(this.attributes)) {

                    // New attribute array
                    const data = [];
                    for (const face of this.faces)
                        data.push(...attribute.data.slice(face * attribute.itemSize, (face + 1) * attribute.itemSize));

                    // Update attribute
                    attribute.data = data;
                }
            }

            // Get vertices
            const vertices = this.attributes.vertices;

            // Vector3 for computations
            const target = new Vector(Math.max(vertices.itemSize, 3));
            const points = Array.apply(null, Array(faceSize)).map(() => new Vector(Math.max(vertices.itemSize, 3)));
            const vectors = Array.apply(null, Array(faceSize - 1)).map(() => new Vector(Math.max(vertices.itemSize, 3)));

            // Compute face count
            const faceCount = vertices.data.length / (faceSize * vertices.itemSize);

            // Initialize normals
            this.attributes.normals = {
                itemSize: 3,
                data: []
            };

            // Compute normals
            for (let i = 0; i < faceCount; ++i) {

                // Vertex offset
                const offset = i * faceSize;

                // Get vertices
                for (let j = 0; j < faceSize; ++j) {

                    // Get index
                    const index = (offset + j) * vertices.itemSize;

                    // Set point's vertex data
                    points[j].data = vertices.data.slice(index, index + vertices.itemSize);
                }

                // Compute vectors
                for (let j = 1; j < points.length; ++j)
                    Vector.sub(points[j], points[0], vectors[j - 1]);

                // Compute product between vectors
                Vector3.cross(vectors[0], vectors[1], target);

                // Normalize
                target.normalize();

                // Push to normals
                this.attributes.normals.data.push(...target.data);
                this.attributes.normals.data.push(...target.data);
                this.attributes.normals.data.push(...target.data);
            }

            // Rebuild faces
            if (rebuildFaces)
                this.computeFaces();
        }
    }

    getFaceSize() {
        return Math.floor((this.primitive - 1) / 3) + 2;
    }
}