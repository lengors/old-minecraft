export class UUID {
    // Taken from: https://stackoverflow.com/a/53723395
    static generate() {
        UUID.instances = UUID.instances || new Set();
        let result;
        const hexadecimal = (number, padding) => number.toString(16).padStart(padding, 0);
        do {
            const view = new DataView(new ArrayBuffer(16));
            crypto.getRandomValues(new Uint8Array(view.buffer));
            view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x40);
            view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80);
            const v0 = hexadecimal(view.getUint32(0), 8);
            const v1 = hexadecimal(view.getUint16(4), 4);
            const v2 = hexadecimal(view.getUint16(6), 4);
            const v3 = hexadecimal(view.getUint16(8), 4);
            const v4 = hexadecimal(view.getUint32(10), 8);
            const v5 = hexadecimal(view.getUint16(14), 4);
            result = `${v0}-${v1}-${v2}-${v3}-${v4}${v5}`;
        } while (UUID.instances.has(result));
        return result;
    }
}