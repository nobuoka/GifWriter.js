module vividcode.image {
    export interface IOutputStream {
        writeByte(byte: number): void;
        writeBytes(bytes: number[]): void;
    }
    export interface IImageSize {
        width: number;
        height: number;
    }
    export interface ILogicalScreenInfoOptions {
        sizeOfColorTable?: number;
        colorTableData?: number[];
        colorTableSortFlag?: bool;
        bgColorIndex?: number;
        pxAspectRatio?: number;
    }

    export class GifWriter {
        private __os: IOutputStream;
        constructor(outputStream: IOutputStream) {
            this.__os = outputStream;
        }

        private __writeInt2(v: number) {
            this.__os.writeBytes([v & 0xFF, (v >> 8) & 0xFF]);
        }

        /*
           http://www.w3.org/Graphics/GIF/spec-gif89a.txt
           <GIF Data Stream>         ::= Header <Logical Screen> <Data>* Trailer
           <Logical Screen>          ::= Logical Screen Descriptor [Global Color Table]
           <Data>                    ::= <Graphic Block>  |
                                         <Special-Purpose Block>
           <Graphic Block>           ::= [Graphic Control Extension] <Graphic-Rendering Block>
           <Graphic-Rendering Block> ::= <Table-Based Image>  |
                                         Plain Text Extension
           <Table-Based Image>       ::= Image Descriptor [Local Color Table] Image Data
           <Special-Purpose Block>   ::= Application Extension  |
                                         Comment Extension
         */

        writeHeader() {
            var os = this.__os;
            // Signature
            os.writeBytes([0x47, 0x49, 0x46]); // "GIF"
            // Version
            os.writeBytes([0x38, 0x39, 0x61]); // "89a"
        }

        // write <Logical Screen>
        writeLogicalScreenInfo(imageSize: IImageSize, options?: ILogicalScreenInfoOptions) {
            if (!options) options = {};
            var sizeOfColorTable =
                "sizeOfColorTable" in options ? options.sizeOfColorTable :
                options.colorTableData ? this.__calcSizeOfColorTable(options.colorTableData) :
                                       7; // 256 colors
            var bgColorIndex = ("bgColorIndex" in options ? options.bgColorIndex : 0);
            var pxAspectRatio = ("pxAspectRatio" in options ? options.pxAspectRatio : 0);
            this.__writeLogicalScreenDescriptor(
                imageSize, !!options.colorTableData, !!options.colorTableSortFlag,
                sizeOfColorTable, bgColorIndex, pxAspectRatio);
            if (!!options.colorTableData) this.__writeColorTable(options.colorTableData, sizeOfColorTable);
        }

        private __calcSizeOfColorTable(colorTableData) {
            var numColors = colorTableData.length / 3;
            var sct = 0;
            var v = 2;
            while (v < numColors) {
                sct++;
                v = v << 1;
            }
            return sct;
        }

        private __writeLogicalScreenDescriptor(imageSize: IImageSize, useGlobalColorTable: bool, colorTableSortFlag: bool, sizeOfColorTable: number, bgColorIndex: number, pxAspectRatio: number) {
            var os = this.__os;
            // Logical Screen Width and Height
            this.__writeInt2(imageSize.width);
            this.__writeInt2(imageSize.height);
            // packed fields
            os.writeByte(
                // Global Color Table Flag (1 bit)
                (useGlobalColorTable ? 0x80 : 0x00) |
                // Color Resolution (3 bits) : always 7
                0x70 |
                // Sort Flag (1 bit)
                (colorTableSortFlag ? 0x08 : 0x00) |
                // Size of Global Color Table (3 bits)
                sizeOfColorTable
            );

            // Background Color Index
            os.writeByte(bgColorIndex);
            // Pixel Aspect Ratio
            os.writeByte(pxAspectRatio);
        }

        private __writeColorTable(colorTableData: number[], sizeOfColorTable: number) {
            var os = this.__os;
            os.writeBytes(colorTableData);
            var rem = (3 * Math.pow(2, sizeOfColorTable+1)) - colorTableData.length;
            var remBytes = [];
            while (--rem >= 0) remBytes.push(0);
            os.writeBytes(remBytes);
        }
    }
}
