module vividcode.image {
    export interface IOutputStream {
        writeByte(byte: number): void;
        writeBytes(bytes: number[]): void;
    }

    export class GifWriter {
        private __os: IOutputStream;
        constructor(outputStream: IOutputStream) {
            this.__os = outputStream;
        }

        writeHeader() {
            var os = this.__os;
            // Signature
            os.writeBytes([0x47, 0x49, 0x46]); // "GIF"
            // Version
            os.writeBytes([0x38, 0x39, 0x61]); // "89a"
        }
    }
}
