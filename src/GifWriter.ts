module vividcode.image {
    export interface IOutputStream {
        writeByte(byte: number): void;
        writeBytes(bytes: number[]): void;
    }
    export interface IImageSize {
        width: number;
        height: number;
    }
    export interface IGifLogicalScreenInfoOptions {
        sizeOfColorTable?: number;
        colorTableData?: number[];
        colorTableSortFlag?: boolean;
        bgColorIndex?: number;
        pxAspectRatio?: number;
    }
    export interface IGifImageOptions {
        topPosition?: number;
        leftPosition?: number;
    }
    export interface IGifExtendedImageOptions extends IGifImageOptions {
        delayTimeInMS?: number;
        disposalMethod?: number;
        transparentColorIndex?: number;
    }

    export interface IIndexedColorImage {
        width: number;
        height: number;
        data: number[];
        paletteData: number[];
    }
    export class IndexedColorImage {
        width: number;
        height: number;
        data: number[];
        paletteData: number[];
        constructor(size: IImageSize, data: number[], paletteData: number[]) {
            this.width = size.width;
            this.height = size.height;
            this.data = data;
            this.paletteData = paletteData;
        }
    }

    class GifCompressedCodesToByteArrayConverter {
        private __out: number[];
        private __remNumBits: number;
        private __remVal: number;
        constructor() {
            this.__out = [];
            this.__remNumBits = 0;
            this.__remVal = 0;
        }
        push(code, numBits) {
            while (numBits > 0) {
                this.__remVal = ((code << this.__remNumBits) & 0xFF) + this.__remVal;
                if (numBits + this.__remNumBits >= 8) {
                    this.__out.push(this.__remVal);
                    numBits = numBits - (8 - this.__remNumBits);
                    code = (code >> (8 - this.__remNumBits));
                    this.__remVal = 0;
                    this.__remNumBits = 0;
                } else {
                    this.__remNumBits = numBits + this.__remNumBits;
                    numBits = 0;
                }
            }
        }
        flush() {
            this.push(0, 8);
            this.__remNumBits = 0;
            this.__remVal = 0;
            var out = this.__out;
            this.__out = [];
            return out;
        }
    }

    function compressWithLZW(actualCodes: number[], numBits: number) {
        // `numBits` is LZW-initial code size, which indicates how many bits are needed
        // to represents actual code.

        var bb = new GifCompressedCodesToByteArrayConverter();

        // GIF spec says: A special Clear code is defined which resets all
        // compression/decompression parameters and tables to a start-up state.
        // The value of this code is 2**<code size>. For example if the code size
        // indicated was 4 (image was 4 bits/pixel) the Clear code value would be 16
        // (10000 binary). The Clear code can appear at any point in the image data
        // stream and therefore requires the LZW algorithm to process succeeding
        // codes as if a new data stream was starting. Encoders should
        // output a Clear code as the first code of each image data stream.
        var clearCode = (1 << numBits);
        // GIF spec says: An End of Information code is defined that explicitly
        // indicates the end of the image data stream. LZW processing terminates
        // when this code is encountered. It must be the last code output by the
        // encoder for an image. The value of this code is <Clear code>+1.
        var endOfInfoCode = clearCode + 1;

        var nextCode;
        var curNumCodeBits;
        var dict;
        function resetAllParamsAndTablesToStartUpState() {
            // GIF spec says: The first available compression code value is <Clear code>+2.
            nextCode = endOfInfoCode + 1;
            curNumCodeBits = numBits + 1;
            dict = Object.create(null);
        }
        resetAllParamsAndTablesToStartUpState();
        bb.push(clearCode, curNumCodeBits); // clear code at first

        var concatedCodesKey = "";
        for (var i = 0, len = actualCodes.length; i < len; ++i) {
            var code = actualCodes[i];
            var dictKey = String.fromCharCode(code);
            if (!(dictKey in dict)) dict[dictKey] = code;

            var oldKey = concatedCodesKey;
            concatedCodesKey += dictKey;
            if (!(concatedCodesKey in dict)) {
                bb.push(dict[oldKey], curNumCodeBits);

                // GIF spec defines a maximum code value of 4095 (0xFFF)
                if (nextCode <= 0xFFF) {
                    dict[concatedCodesKey] = nextCode;
                    if (nextCode === (1 << curNumCodeBits)) curNumCodeBits++;
                    nextCode++;
                } else {
                    bb.push(clearCode, curNumCodeBits);
                    resetAllParamsAndTablesToStartUpState();
                    dict[dictKey] = code;
                }
                concatedCodesKey = dictKey;
            }
        }
        bb.push(dict[concatedCodesKey], curNumCodeBits);
        bb.push(endOfInfoCode, curNumCodeBits);
        return bb.flush();
    }

    export class GifWriter {
        private __os: IOutputStream;
        constructor(outputStream: IOutputStream) {
            this.__os = outputStream;
        }

        private __writeInt2(v: number) {
            this.__os.writeBytes([v & 0xFF, (v >> 8) & 0xFF]);
        }

        private __writeDataSubBlocks(data: number[]) {
            var os = this.__os;
            var curIdx = 0;
            var blockLastIdx;
            while (curIdx < (blockLastIdx = Math.min(data.length, curIdx + 254))) {
                var subarray = data.slice(curIdx, blockLastIdx);
                os.writeByte(subarray.length);
                os.writeBytes(subarray);
                curIdx = blockLastIdx;
            }
        }

        private __writeBlockTerminator() {
            this.__os.writeByte(0);
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

        writeTrailer() {
            this.__os.writeByte(0x3B);
        }

        // write <Logical Screen>
        writeLogicalScreenInfo(imageSize: IImageSize, options?: IGifLogicalScreenInfoOptions) {
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

        private __writeLogicalScreenDescriptor(imageSize: IImageSize, useGlobalColorTable: boolean, colorTableSortFlag: boolean, sizeOfColorTable: number, bgColorIndex: number, pxAspectRatio: number) {
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

        // write <Table-Based Image> (::= Image Descriptor [Local Color Table] Image Data)
        writeTableBasedImage(indexedColorImage: IIndexedColorImage, options?: IGifImageOptions) {
            if (!options) options = {};
            var useLocalColorTable = true; // currently use local color table always
            var sizeOfLocalColorTable = this.__calcSizeOfColorTable(indexedColorImage.paletteData);
            this.__writeImageDescriptor(indexedColorImage, useLocalColorTable,
                sizeOfLocalColorTable, options);
            if (useLocalColorTable) {
                this.__writeColorTable(indexedColorImage.paletteData,
                            (useLocalColorTable ? sizeOfLocalColorTable : 0));
            }
            this.__writeImageData(indexedColorImage.data, sizeOfLocalColorTable + 1);
        }

        writeTableBasedImageWithGraphicControl(indexedColorImage: IIndexedColorImage, gcOpts?: IGifExtendedImageOptions) {
            this.__writeGraphicControlExtension(gcOpts);
            this.writeTableBasedImage(indexedColorImage, gcOpts);
        }

        private __writeImageDescriptor(indexedColorImage: IIndexedColorImage, useLocalColorTable: boolean, sizeOfLocalColorTable: number, opts?: IGifExtendedImageOptions) {
            var os = this.__os;

            // Image Separator (1 Byte) : Identifies the beginning of an Image Descriptor
            os.writeByte(0x2C);
            // Image Left Position (2 Bytes) : Column number, in pixels, of the left edge
            //           of the image, with respect to the left edge of the Logical Screen.
            var leftPos = ("leftPosition" in opts ? opts.leftPosition : 0);
            this.__writeInt2(leftPos);
            // Image Top Position (2 Bytes) : Row number, in pixels, of the top edge of
            //           the image with respect to the top edge of the Logical Screen.
            var topPos = ("topPosition" in opts ? opts.topPosition : 0);
            this.__writeInt2(topPos);
            // Image Width (2 Bytes) and Height (2 bytes)
            this.__writeInt2(indexedColorImage.width);
            this.__writeInt2(indexedColorImage.height);

            // <Packed Fields>
            os.writeByte(
                // Local Color Table Flag (1 Bit)
                (useLocalColorTable ? 0x80 : 0x00) |
                // Interlace Flag (1 Bit)
                0x00 |
                // Sort Flag (1 Bit)
                0x00 |
                // Reserved (2 Bits)
                0x00 |
                // Size of Local Color Table (3 Bits)
                sizeOfLocalColorTable
            );
        }

        private __writeImageData(data: number[], numBitsForCode: number) {
            var os = this.__os;
            // Because of some algorithmic constraints, minimum value of `numBitsForCode` is 2
            if (numBitsForCode === 1) numBitsForCode = 2;

            var compressedBytes = compressWithLZW(data, numBitsForCode);
            os.writeByte(numBitsForCode);
            // PACKAGE THE BYTES
            this.__writeDataSubBlocks(compressedBytes);
            // GIF spec says : A block with a zero byte count terminates the
            // Raster Data stream for a given image.
            this.__writeBlockTerminator();
        }

        private __writeColorTable(colorTableData: number[], sizeOfColorTable: number) {
            var os = this.__os;
            os.writeBytes(colorTableData);
            var rem = (3 * Math.pow(2, sizeOfColorTable+1)) - colorTableData.length;
            var remBytes = [];
            while (--rem >= 0) remBytes.push(0);
            os.writeBytes(remBytes);
        }

        private __writeGraphicControlExtension(options?: IGifExtendedImageOptions) {
            if (!options) options = {};
            var os = this.__os;
            var delay = Math.round((options.delayTimeInMS || 0) / 10);
            var disposalMethod = ("disposalMethod" in options ? options.disposalMethod : 2);
            var transparentColorIndex;
            var transparentColorFlag;
            if (options.transparentColorIndex >= 0) {
                transparentColorIndex = options.transparentColorIndex & 0xFF;
                transparentColorFlag = 1;
            } else {
                transparentColorIndex = 0;
                transparentColorFlag = 0;
            }

            // Extension Introducer: 0x21
            // Graphic Control Label: 0xF9
            // Block Size: always this block containes 4 bytes
            os.writeBytes([0x21, 0xF9, 0x04]);

            // <Packed Field>
            os.writeByte(
                0 | // Reserved (3 bits)
                (disposalMethod << 2)| // Disposal Method (3 bits)
                0 | // User Input Flag (1 bit)
                transparentColorFlag // Transparent Color Flag (1 bit)
            );

            // Delay Time : 1/100 sec
            this.__writeInt2(delay);
            // Transparent Color Index
            os.writeByte(transparentColorIndex);
            // Block Terminator
            os.writeByte(0);
        }

        // One of Application Extension
        writeLoopControlInfo(repeatCount: number) {
            this.__os.writeBytes([
                // Extension Introducer
                0x21,
                // Extension Label
                0xFF,
                // Block Size
                11,
                // Application Identifier (8 Bytes) : "NETSCAPE"
                0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45,
                // Appl. Authentication Code (3 Bytes) : "2.0"
                0x32, 0x2E, 0x30,
                // Application Data
                3, // Sub-Block size
                0x01,
                (repeatCount & 0xFF), ((repeatCount >> 8) & 0xFF),
                // Block Terminator
                0x00,
            ]);
        }
    }
}
