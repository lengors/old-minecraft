import { Debug } from '../core/debug.js';
import { Reflection } from '../util/reflection.js';
import { ArgumentsParser } from '../util/parser.js';
import { IllegalArgumentException } from '../core/exceptions.js';

export class Matrix {
    static add = new ArgumentsParser()
        .on([Matrix, Matrix, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, argument, target);
            const size = Math.max(matrix.data.length, argument.data.length);
            for (let i = 0; i < size; ++i)
                target.data[i] = (matrix.data[i] || 0) + (argument.data[i] || 0);
            return target;
        }).on([Matrix, Number.isFinite, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, target);
            for (let i = 0; i < matrix.data.length; ++i)
                target.data[i] = matrix.data[i] + argument;
            return target;
        }).on([Matrix, argument => argument instanceof Matrix || Number.isFinite(argument)], (matrix, argument) => {
            return Matrix.add(matrix, argument, new Matrix(matrix.height, matrix.width))
        }).bind();

    static copy = new ArgumentsParser()
        .on([Matrix, Reflection.isCallable], (matrix, fill) => (i, self) => matrix.data[i] || fill(i, self))
        .on([Matrix, Number.isFinite], (matrix, fill) => i => matrix.data[i] || fill)
        .on([Matrix], matrix => Matrix.copy(matrix, 0))
        .bind();

    static div = new ArgumentsParser()
        .on([Matrix, Matrix, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, argument, target);
            const size = Math.max(matrix.data.length, argument.data.length);
            for (let i = 0; i < size; ++i)
                target.data[i] = (matrix.data[i] || 0) / (argument.data[i] || 0);
            return target;
        }).on([Matrix, Number.isFinite, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, target);
            for (let i = 0; i < matrix.data.length; ++i)
                target.data[i] = matrix.data[i] / argument;
            return target;
        }).on([Matrix, argument => argument instanceof Matrix || Number.isFinite(argument)], (matrix, argument) => {
            return Matrix.div(matrix, argument, new Matrix(matrix.height, matrix.width))
        }).bind();

    static dot = new ArgumentsParser().
        on([Matrix, Matrix, Matrix], (matrix, argument, target) => {
            Debug.assert(matrix.width == argument.height, IllegalArgumentException);
            Debug.assert(target.height == matrix.height, IllegalArgumentException);
            Debug.assert(target.width == argument.width, IllegalArgumentException);
            const data = Array();
            for (let i = 0; i < matrix.height; ++i) {
                const matrixOffset = i * matrix.width;
                const targetOffset = i * matrix.height;
                for (let j = 0; j < argument.width; ++j) {
                    let sum = 0;
                    for (let k = 0; k < matrix.width; ++k)
                        sum += (matrix.data[matrixOffset + k] || 0) * (argument.data[k * argument.width + j] || 0);
                    data[targetOffset + j] = sum;
                }
            }
            target.data = data;
            return target;
        }).on([Matrix, Matrix], (matrix, argument) => Matrix.dot(matrix, argument, new Matrix(matrix.height, argument.width)))
        .bind();

    static lookAt = new ArgumentsParser()
        .on([camera => camera instanceof Vector, target => target instanceof Vector, up => up instanceof Vector], (camera, target, up) => {
            up = new Vector3(Vector3.copy(up));
            target = new Vector3(Vector3.copy(target));
            camera = new Vector3(Vector3.copy(camera));
            const direction = Vector3
                .sub(camera, target, new Vector3())
                .normalize();
            const right = up.cross(direction).normalize();
            up = Vector3.cross(direction, right, new Vector3());
            const lookAtMatrix = new Matrix4(Matrix.fill(
                right.x(), up.x(), direction.x(), camera.x(),
                right.y(), up.y(), direction.y(), camera.y(),
                right.z(), up.z(), direction.z(), camera.z(),
                0, 0, 0, 1
            ));
            return Matrix.map(lookAtMatrix, Matrix.identity);
        }).on([camera => camera instanceof Vector, target => target instanceof Vector], (camera, target) => Matrix.lookAt(camera, target, Vector3.UP))
        .bind();

    static map = new ArgumentsParser()
        .on([Matrix, Number.isFinite, Number.isFinite, Reflection.isCallable], (target, offsetY, offsetX, remaining) => {
            return (i, self) => {
                const x = i % self.width + offsetX;
                const y = Math.floor(i / self.width) + offsetY;
                if (x >= 0 && x < target.width && y >= 0 && y < target.height)
                    return target.get(y, x);
                return remaining(i, self);
            }
        }).on([Matrix, Number.isFinite, Number.isFinite], (target, offsetY, offsetX) => Matrix.map(target, offsetY, offsetX, () => 0))
        .on([Matrix, Reflection.isCallable], (target, remaining) => Matrix.map(target, 0, 0, remaining))
        .on([Matrix], target => Matrix.map(target, () => 0))
        .bind();

    static mul = new ArgumentsParser()
        .on([Matrix, Matrix, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, argument, target);
            const size = Math.max(matrix.data.length, argument.data.length);
            for (let i = 0; i < size; ++i)
                target.data[i] = (matrix.data[i] || 0) * (argument.data[i] || 0);
            return target;
        }).on([Matrix, Number.isFinite, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, target);
            for (let i = 0; i < matrix.data.length; ++i)
                target.data[i] = matrix.data[i] * argument;
            return target;
        }).on([Matrix, argument => argument instanceof Matrix || Number.isFinite(argument)], (matrix, argument) => {
            return Matrix.mul(matrix, argument, new Matrix(matrix.height, matrix.width))
        }).bind();

    static orthographic = new ArgumentsParser()
        .on([Number.isFinite, Number.isFinite, Number.isFinite, Number.isFinite, Number.isFinite, Number.isFinite], (left, right, bottom, top, near, far) => {
            const width = right - left;
            const height = top - bottom;
            const range = near - far;
            const values = [
                width * 0.5, 0, 0, -(left + right) / width,
                0, height * 0.5, 0, -(bottom + top) / height,
                0, 0, range * 0.5, (near + far) / range,
                0, 0, 0, 1
            ];
            return i => values[i];
        });

    static perspective = new ArgumentsParser()
        .on([Number.isFinite, Number.isFinite, Number.isFinite, Number.isFinite], (FOV, aspectRatio, near, far) => {
            const tan = Math.tan(FOV * 0.5);
            const range = near - far;
            const values = [
                1 / (aspectRatio * tan), 0, 0, 0,
                0, 1 / tan, 0, 0,
                0, 0, (far + near) / range, 2 * far * near / range,
                0, 0, -1, 0
            ]
            return i => values[i];
        }).bind();

    static rotation = new ArgumentsParser()
        .on([Number.isFinite, argument => argument instanceof Vector], (angle, axis) => {
            axis = Vector.normalize(axis);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const iCos = 1 - cos;
            const x = axis.x();
            const y = axis.y();
            const z = axis.z();
            const xy = x * y * iCos;
            const xz = x * z * iCos;
            const yz = y * z * iCos;
            const xSin = x * sin;
            const ySin = y * sin;
            const zSin = z * sin;
            return Matrix.map(new Matrix3(Matrix.fill(
                cos + x * x * iCos, xy - zSin, xz + ySin,
                xy + zSin, cos + y * y * iCos, yz - xSin,
                xz - ySin, yz + xSin, cos + z * z * iCos
            )), Matrix.identity);
        }).on([argument => argument instanceof Quaternion], quaternion => {
            const x = quaternion.x();
            const y = quaternion.y();
            const z = quaternion.z();
            const w = quaternion.w();
            const x2 = x * x;
            const y2 = y * y;
            const z2 = z * z;
            const w2 = w * w;
            const xy = 2 * x * y;
            const xz = 2 * x * z;
            const yz = 2 * y * z;
            const wx = 2 * w * x;
            const wy = 2 * w * y;
            const wz = 2 * w * z;
            return Matrix.map(new Matrix3(Matrix.fill(
                w2 + x2 - y2 - z2, xy - wz, xz + wy,
                xy + wz, w2 - x2 + y2 - z2, yz - wx,
                xz - wy, yz + wx, w2 - x2 - y2 + z2
            )), Matrix.identity);
        }).on([Number.isFinite], angle => Matrix.rotation(angle, Vector3.FRONT))
        .bind();

    static scale = new ArgumentsParser()
        .on([Number.isFinite, Number.isFinite, Number.isFinite], (x, y, z) => {
            const args = [x, y, z];
            return (i, self) => i % (self.width + 1) == 0 ? args[Math.floor(i / self.width)] || 1 : 0;
        }).on([Number.isFinite, Number.isFinite], (x, y) => Matrix.scale(x, y, 0))
        .on([argument => argument instanceof Vector], vector => Matrix.scale(vector.x(), vector.y(), vector.z()))
        .bind();

    static sub = new ArgumentsParser()
        .on([Matrix, Matrix, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, argument, target);
            const size = Math.max(matrix.data.length, argument.data.length);
            for (let i = 0; i < size; ++i)
                target.data[i] = (matrix.data[i] || 0) - (argument.data[i] || 0);
            return target;
        }).on([Matrix, Number.isFinite, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, target);
            for (let i = 0; i < matrix.data.length; ++i)
                target.data[i] = matrix.data[i] - argument;
            return target;
        }).on([Matrix, argument => argument instanceof Matrix || Number.isFinite(argument)], (matrix, argument) => {
            return Matrix.sub(matrix, argument, new Matrix(matrix.height, matrix.width))
        }).bind();

    static translation = new ArgumentsParser()
        .on([Number.isFinite, Number.isFinite, Number.isFinite], (x, y, z) => {
            const args = [x, y, z];
            return (i, self) => {
                const x = i % self.width;
                const y = Math.floor(i / self.width);
                if (x == self.width - 1 && y < args.length)
                    return args[y];
                return Matrix.identity(i, self);
            };
        }).on([Number.isFinite, Number.isFinite], (x, y) => Matrix.translation(x, y, 0))
        .on([argument => argument instanceof Vector], vector => Matrix.translation(vector.x(), vector.y(), vector.z()))
        .bind();

    static transpose = new ArgumentsParser()
        .on([Matrix, Matrix], (matrix, target) => {
            Debug.assert(target.width == matrix.height, IllegalArgumentException);
            Debug.assert(target.height == matrix.width, IllegalArgumentException);
            const data = Array();
            for (let i = 0; i < matrix.width; ++i) {
                const offset = i * matrix.height;
                for (let j = 0; j < matrix.height; ++j)
                    data[offset + j] = matrix.data[j * matrix.width + i] || 0;
            }
            target.data = data;
            return target;
        }).on([Matrix], matrix => Matrix.transpose(matrix, new Matrix(matrix.width, matrix.height)))
        .bind();

    static validate = new ArgumentsParser()
        .on([Matrix, Matrix, Matrix], (matrix, argument, target) => {
            Matrix.validate(matrix, argument);
            Matrix.validate(matrix, target);
        }).on([Matrix, Matrix], (matrix, target) => {
            Debug.assert(matrix.width == target.width, IllegalArgumentException);
            Debug.assert(matrix.height == target.height, IllegalArgumentException);
        }).bind();

    apply = new ArgumentsParser()
        .on([Reflection.isFunction, Number.isFinite, Number.isFinite], (generator, start, end) => {
            Debug.assert(end <= this.size(), IllegalArgumentException);
            Debug.assert(start >= 0 && start <= end, IllegalArgumentException);
            for (let i = start; i < end; ++i) {
                const value = generator(i, this) || 0;
                Debug.assert(Number.isFinite(value), IllegalArgumentException);
                this.data[i] = value;
            }
            return this;
        }).on([Reflection.isFunction, Number.isFinite], (generator, start) => this.apply(generator, start, this.size()))
        .on([Reflection.isFunction], generator => this.apply(generator, 0))
        .bind();

    get = new ArgumentsParser()
        .on([Number.isFinite, Number.isFinite], (i, j) => this.get(i * this.width + j))
        .on([Number.isFinite], index => {
            Debug.assert(index >= 0 && index < this.size(), IllegalArgumentException);
            return this.data[index] || 0;
        }).bind();

    set = new ArgumentsParser()
        .on([Number.isFinite, Number.isFinite, Number.isFinite], (i, j, value) => this.set(i * this.width + j, value))
        .on([Number.isFinite, Number.isFinite], (index, value) => {
            Debug.assert(index >= 0 && index < this.size(), IllegalArgumentException);
            this.data[index] = value;
            return this;
        }).bind();

    data;
    width;
    height;

    constructor(height, width, generator) {
        Debug.assert(Number.isFinite(width), IllegalArgumentException);
        Debug.assert(Number.isFinite(height), IllegalArgumentException);
        this.width = width;
        this.height = height;
        this.data = new Array();
        if (generator)
            this.apply(generator);
    }

    add() {
        return Matrix.add(this, ...arguments, this);
    }

    div() {
        return Matrix.div(this, ...arguments, this);
    }

    dot() {
        return Matrix.dot(this, ...arguments, this);
    }

    equals(argument) {
        if (this == argument)
            return true;
        if (!(argument && argument instanceof Matrix))
            return false;
        if (this.constructor != argument.constructor)
            return false;
        if (this.height != argument.height)
            return false;
        if (this.width != argument.width)
            return false;
        const size = Math.max(this.data.length, argument.data.length);
        for (let i = 0; i < size; ++i)
            if ((this.data[i] || 0) != (argument.data[i] || 0))
                return false;
        return true;
    }

    mul() {
        return Matrix.mul(this, ...arguments, this);
    }

    size() {
        return this.width * this.height;
    }

    sub() {
        return Matrix.sub(this, ...arguments, this);
    }

    toString() {
        let string = '';
        for (let i = 0; i < this.height;) {
            const offset = i++ * this.width;
            for (let j = 0; j < this.width;) {
                string += this.data[offset + j++] || 0;
                if (j != this.width)
                    string += ', '
            }
            if (i != this.height)
                string += '\n';
        }
        return string;
    }

    transpose() {
        return Matrix.transpose(this, ...arguments, this);
    }

    static fill() {
        for (const argument of arguments)
            Debug.assert(Number.isFinite(argument), IllegalArgumentException);
        return i => arguments[i] || 0;
    }

    static identity(i, self) {
        return i % (self.width + 1) == 0 ? 1 : 0;
    }

    static random() {
        return Math.random();
    }
}

export class SquareMatrix extends Matrix {
    constructor(size, generator) {
        super(size, size, generator);
    }
}

export class Matrix2x3 extends Matrix {
    constructor(generator) {
        super(2, 3, generator);
    }
}

export class Matrix2x4 extends Matrix {
    constructor(generator) {
        super(2, 4, generator);
    }
}

export class Matrix3x2 extends Matrix {
    constructor(generator) {
        super(3, 2, generator);
    }
}

export class Matrix3x4 extends Matrix {
    constructor(generator) {
        super(3, 4, generator);
    }
}

export class Matrix4x2 extends Matrix {
    constructor(generator) {
        super(4, 2, generator);
    }
}

export class Matrix4x3 extends Matrix {
    constructor(generator) {
        super(4, 3, generator);
    }
}

export class Matrix2 extends SquareMatrix {
    constructor(generator) {
        super(2, generator);
    }
}

export class Matrix3 extends SquareMatrix {
    constructor(generator) {
        super(3, generator);
    }
}

export class Matrix4 extends SquareMatrix {
    constructor(generator) {
        super(4, generator);
    }
}

export class Vector extends Matrix {
    static dot = new ArgumentsParser(Matrix.dot)
        .on([Vector, Vector], (vector, argument) => {
            let sum = 0;
            const size = Math.max(vector.data.length, argument.data.length);
            for (let i = 0; i < size; ++i)
                sum += (vector.data[i] || 0) * (argument.data[i] || 0);
            return sum;
        }).bind();

    static lerp = new ArgumentsParser()
        .on([Vector, Vector, Number.isFinite, Vector], (source, destination, factor, target) => {
            Debug.assert(source.height == destination.height, IllegalArgumentException);
            Debug.assert(source.height == target.height, IllegalArgumentException);
            const size = Math.max(destination.data.length, source.data.length);
            for (let i = 0; i < size; ++i)
                target.data[i] = (source.data[i] || 0) + ((destination.data[i] || 0) - (source.data[i] || 0)) * factor;
            return target;
        }).on([Vector, Vector, Number.isFinite], (source, destination, factor) => Vector.lerp(source, destination, factor, new Vector(source.height)))
        .bind();

    static normalize = new ArgumentsParser()
        .on([Vector, Vector], (vector, target) => {
            const magnitude = vector.magnitude();
            Debug.assert(target.height == vector.height, IllegalArgumentException);
            Debug.assert(magnitude != 0, IllegalArgumentException);
            if (magnitude != 1) {
                const multiplier = 1 / magnitude;
                for (let i = 0; i < vector.data.length; ++i)
                    target.data[i] = vector.data[i] * multiplier;
            } else if (vector != target)
                for (let i = 0; i < vector.data.length; ++i)
                    target.data[i] = vector.data[i];
            return target;
        }).on([Vector], vector => Vector.normalize(vector, new Vector(vector.height)))
        .bind();

    static rotation = new ArgumentsParser()
        .on([Matrix4, Vector], (matrix, scale) => {
            let thetaX, thetaY, thetaZ;
            const [x, y, z] = [scale.x(), scale.y(), scale.z()];
            const m20 = matrix.get(2, 0) / x;
            if (m20 != -1 && m20 != 1) {
                thetaY = Math.asin(-m20);
                thetaZ = Math.atan2(matrix.get(1, 0) / x, matrix.get(0, 0) / x);
                thetaX = Math.atan2(matrix.get(2, 1) / y, matrix.get(2, 2) / z);
            } else {
                thetaY = -Math.PI * 0.5 * m20;
                thetaX = 0;
                thetaZ = m20 * Math.atan2(-matrix.get(1, 2) / z, matrix.get(1, 1) / y);
            }
            return Matrix.fill(thetaX, thetaY, thetaZ);
        }).on([Matrix4], matrix => Vector3.rotation(matrix, new Vector3(Vector3.scale(matrix))))
        .bind();

    static scale = new ArgumentsParser()
        .on([Matrix4], matrix => {
            const column0 = new Vector3(Vector3.fill(matrix.get(0, 0), matrix.get(1, 0), matrix.get(2, 0)));
            const column1 = new Vector3(Vector3.fill(matrix.get(0, 1), matrix.get(1, 1), matrix.get(2, 1)));
            const column2 = new Vector3(Vector3.fill(matrix.get(0, 2), matrix.get(1, 2), matrix.get(2, 2)));
            const values = [column0.magnitude(), column1.magnitude(), column2.magnitude()];
            return Matrix.fill(...values);
        }).bind();

    static translation = new ArgumentsParser()
        .on([Matrix4], matrix => Matrix.fill(matrix.get(0, 3), matrix.get(1, 3), matrix.get(2, 3)))
        .bind();

    x = new ArgumentsParser()
        .on([Number.isFinite], x => {
            Debug.assert(this.height >= 1, IllegalArgumentException);
            this.data[0] = x;
            return this;
        }).on([], () => this.data[0] || 0)
        .bind();

    y = new ArgumentsParser()
        .on([Number.isFinite], y => {
            Debug.assert(this.height >= 2, IllegalArgumentException);
            this.data[1] = y;
            return this;
        }).on([], () => this.data[1] || 0)
        .bind();

    z = new ArgumentsParser()
        .on([Number.isFinite], z => {
            Debug.assert(this.height >= 3, IllegalArgumentException);
            this.data[2] = z;
            return this;
        }).on([], () => this.data[2] || 0)
        .bind();

    w = new ArgumentsParser()
        .on([Number.isFinite], w => {
            Debug.assert(this.height >= 4, IllegalArgumentException);
            this.data[3] = w;
            return this;
        }).on([], () => this.data[3] || 1)
        .bind();

    constructor(size, generator) {
        super(size, 1, generator);
    }

    lerp() {
        return Vector.lerp(this, ...arguments, this);
    }

    magnitude() {
        return Math.sqrt(this.squaredMagnitude());
    }

    normalize() {
        return Vector.normalize(this, ...arguments, this);
    }

    squaredMagnitude() {
        let sum = 0;
        for (let i = 0; i < this.data.length; ++i)
            sum += Math.pow(this.data[i] || 0, 2);
        return sum;
    }
}

export class Vector2 extends Vector {
    static DOWN = new Vector2(Matrix.fill(0, -1));
    static LEFT = new Vector2(Matrix.fill(-1, 0));
    static RIGHT = new Vector2(Matrix.fill(1, 0));
    static UP = new Vector2(Matrix.fill(0, 1));
    static ZERO = new Vector2(Matrix.fill(0, 0));
    static ONE = new Vector2(Matrix.fill(1, 1));

    static cross = new ArgumentsParser()
        .on([Vector, Vector], (vector, argument) => vector.x() * argument.y() - vector.y() * argument.x())
        .bind();

    constructor(generator) {
        super(2, generator);
    }
}

export class Vector3 extends Vector {
    static BACK = new Vector3(Matrix.fill(0, 0, -1));
    static DOWN = new Vector3(Matrix.fill(0, -1, 0));
    static FRONT = new Vector3(Matrix.fill(0, 0, 1));
    static LEFT = new Vector3(Matrix.fill(-1, 0, 0));
    static RIGHT = new Vector3(Matrix.fill(1, 0, 0));
    static UP = new Vector3(Matrix.fill(0, 1, 0));
    static ZERO = new Vector3(Matrix.fill(0, 0, 0));
    static ONE = new Vector3(Matrix.fill(1, 1, 1));

    static cross = new ArgumentsParser()
        .on([Vector, Vector, Vector], (vector, argument, target) => {
            Debug.assert(target.height == 3, IllegalArgumentException);
            const x = vector.y() * argument.z() - vector.z() * argument.y();
            const y = vector.z() * argument.x() - vector.x() * argument.z();
            const z = vector.x() * argument.y() - vector.y() * argument.x();
            target.x(x);
            target.y(y);
            target.z(z);
            return target;
        }).on([Vector, Vector], (vector, argument) => Vector3.cross(vector, argument, new Vector(vector.height)))
        .bind();

    constructor(generator) {
        super(3, generator);
    }

    cross() {
        return Vector3.cross(this, ...arguments, this);
    }
}

export class Vector4 extends Vector {
    constructor(generator) {
        super(4, generator);
    }
}

export class Quaternion extends Vector4 {
    static conjugate = new ArgumentsParser()
        .on([Quaternion, Quaternion], (quaternion, target) => {
            target.w(quaternion.w());
            target.x(-quaternion.x());
            target.y(-quaternion.y());
            target.z(-quaternion.z());
            return target;
        }).on([Quaternion], quaternion => Quaternion.conjugate(quaternion, new Quaternion()))
        .bind();

    static div = new ArgumentsParser(Matrix.div)
        .on([Quaternion, Quaternion, Quaternion], (quaternion, argument, target) => Quaternion.mul(quaternion, Quaternion.reciprocal(argument, target), target))
        .on([Quaternion, Quaternion], (quaternion, argument) => Quaternion.div(quaternion, argument, new Quaternion()))
        .bind();

    static lerp = new ArgumentsParser(Vector.lerp)
        .on([Quaternion, Quaternion, Number.isFinite, Reflection.isBoolean, Quaternion], (source, destination, factor, shortest, target) => {
            if (shortest && Vector.dot(source, destination) < 0)
                destination = Matrix.mul(destination, -1, new Quaternion());
            return Quaternion.lerp(source, destination, factor, target);
        })
        .bind();

    static mul = new ArgumentsParser(Matrix.mul)
        .on([Quaternion, Quaternion, Quaternion], (quaternion, argument, target) => {
            const qX = quaternion.x();
            const qY = quaternion.y();
            const qZ = quaternion.z();
            const qW = quaternion.w();
            const aX = argument.x();
            const aY = argument.y();
            const aZ = argument.z();
            const aW = argument.w();
            target.w(qW * aW - qX * aX - qY * aY - qZ * aZ);
            target.x(qW * aX + qX * aW + qY * aZ - qZ * aY);
            target.y(qW * aY - qX * aZ + qY * aW + qZ * aX);
            target.z(qW * aZ + qX * aY - qY * aX + qZ * aW);
            return target;
        }).on([Quaternion, Quaternion], (quaternion, argument) => Quaternion.mul(quaternion, argument, new Quaternion()))
        .bind();

    static rotation = new ArgumentsParser()
        .on([Number.isFinite, Vector], (angle, axis) => {
            angle *= 0.5;
            axis = Vector.normalize(axis);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return Matrix.fill(axis.x() * sin, axis.y() * sin, axis.z() * sin, cos);
        }).on([Number.isFinite], angle => {
            return Quaternion.rotation(angle, Vector3.FRONT);
        }).on([Matrix], matrix => {
            Debug.assert(matrix.width == 4, IllegalArgumentException);
            Debug.assert(matrix.height == 4, IllegalArgumentException);
            let x, y, z, w;
            const trace = matrix.get(0) + matrix.get(5) + matrix.get(10);
            if (trace > 0) {
                const s = 0.5 / Math.sqrt(trace + 1);
                w = 0.25 / s;
                x = (matrix.get(9) - matrix.get(6)) * s;
                y = (matrix.get(2) - matrix.get(8)) * s;
                z = (matrix.get(4) - matrix.get(1)) * s;
            } else if (matrix.get(0) > matrix.get(5) && matrix.get(0) > matrix.get(10)) {
                const s = 2 * Math.sqrt((1 + matrix.get(0)) - (matrix.get(5) + matrix.get(10)));
                w = (matrix.get(9) - matrix.get(6)) / s;
                x = 0.25 * s;
                y = (matrix.get(1) + matrix.get(4)) / s;
                z = (matrix.get(2) + matrix.get(8)) / s;
            } else if (matrix.get(5) > matrix.get(10)) {
                const s = 2 * Math.sqrt((1 + matrix.get(5)) - (matrix.get(0) + matrix.get(10)));
                w = (matrix.get(2) - matrix.get(8)) / s;
                x = (matrix.get(1) + matrix.get(4)) / s;
                y = 0.25 * s;
                z = (matrix.get(6) + matrix.get(9)) / s;
            } else {
                const s = 2 * Math.sqrt((1 + matrix.get(10)) - (matrix.get(0) + matrix.get(5)));
                w = (matrix.get(4) - matrix.get(1)) / s;
                x = (matrix.get(2) + matrix.get(8)) / s;
                y = (matrix.get(9) + matrix.get(6)) / s;
                z = 0.25 * s;
            }
            return Matrix.fill(x, y, z, w);
        }).bind();

    static reciprocal = new ArgumentsParser()
        .on([Quaternion, Quaternion], (quaternion, target) => {
            const scale = Quaternion.dot(quaternion, quaternion);
            target.w(quaternion.w() / scale);
            target.x(-quaternion.x() / scale);
            target.y(-quaternion.y() / scale);
            target.z(-quaternion.z() / scale);
            return target;
        }).on([Quaternion], quaternion => Quaternion.reciprocal(quaternion, new Quaternion()))
        .bind();

    constructor(generator) {
        super(generator);
    }

    conjugate() {
        return Quaternion.conjugate(this, ...arguments, this);
    }

    div() {
        return Quaternion.div(this, ...arguments, this);
    }

    lerp() {
        return Quaternion.lerp(this, ...arguments, this);
    }

    mul() {
        return Quaternion.mul(this, ...arguments, this);
    }

    reciprocal() {
        return Quaternion.reciprocal(this, ...arguments, this);
    }
}