/// <reference path="..\src\GifWriter.ts" />
/// <reference path="test_common.ts"/>

(function () {
"use strict";

function createOutputStream() {
    return {
        buffer: <string[]>[],
        writeByte: function (b: number) {
            this.buffer.push(b);
        },
        writeBytes: function (bb: number[]) {
            Array.prototype.push.apply(this.buffer, bb);
        },
    };
}

t.testAsync("Write header of GIF89a", function (done) {
    var outputStream = createOutputStream();
    var gifWriter = new vividcode.image.GifWriter(outputStream);
    gifWriter.writeHeader();
    t.strictEqual(outputStream.buffer.length, 6, "Size of header is 6 bytes");
    t.deepEqual(String.fromCharCode.apply(String, outputStream.buffer.slice(0,3)), "GIF",
        "First 3 bytes (Signature) represents \"GIF\"");
    t.deepEqual(String.fromCharCode.apply(String, outputStream.buffer.slice(3,6)), "89a",
        "Next 3 bytes (Version) represents \"89a\"");
    done();
});

t.testAsync("Write logical screen info without color table", function (done) {
    var outputStream = createOutputStream();
    var gifWriter = new vividcode.image.GifWriter(outputStream);
    gifWriter.writeLogicalScreenInfo({ width: 2, height: 1 });

    t.strictEqual(outputStream.buffer.length, 7, "Size of logical screen descriptor is 7 bytes");
    t.deepEqual(outputStream.buffer.slice(0,4), [0x02, 0x00, 0x01, 0x00],
        "First 4 bytes represents width and height");
    t.deepEqual(outputStream.buffer.slice(4,7), [0x77, 0x00, 0x00],
        "Next 3 bytes is default value");
    done();
});

t.testAsync("Write logical screen info with color table", function (done) {
    var outputStream = createOutputStream();
    var gifWriter = new vividcode.image.GifWriter(outputStream);

    var colorTableData = [0,1,2, 50,51,52, 253,254,255];
    gifWriter.writeLogicalScreenInfo({ width: 2, height: 1 }, { colorTableData: colorTableData });

    t.strictEqual(outputStream.buffer.length, 19, "Size of logical screen descriptor and global color table is 19 bytes");
    t.deepEqual(outputStream.buffer.slice(0,4), [0x02, 0x00, 0x01, 0x00],
        "First 4 bytes represents width and height");
    t.deepEqual(outputStream.buffer.slice(4,7), [0xF1, 0x00, 0x00],
        "Next 3 bytes is default value");
    done();
});

t.testAsync("Write table based image", function (done) {
    var outputStream = createOutputStream();
    var gifWriter = new vividcode.image.GifWriter(outputStream);
    var indexedColorImage = new vividcode.image.IndexedColorImage(
        { width: 2, height: 2 },
        [0,0,0,0],
        [0,0,0]
    );
    var basicImageDataBytes = [
        // Image Descriptor
        0x2C, 0x00,0x00, 0x00,0x00, 0x02,0x00, 0x02,0x00, 0x80,
        // Color Table
        0x00,0x00,0x00, 0x00,0x00,0x00,
        // Image Data
        0x02, // initial code size
        0x02, // block size
        0x84, // (10 000 100) binary
        0x51, // (0 101 000 1) binary
        0x00  // terminates blocks
    ];

    gifWriter.writeTableBasedImage(indexedColorImage);
    t.deepEqual(outputStream.buffer, basicImageDataBytes);

    outputStream.buffer = [];
    gifWriter.writeTableBasedImage(indexedColorImage, { leftPosition: 3, topPosition: 5 });
    var bytesWithPosL3T5 = basicImageDataBytes.map(b => b);
    bytesWithPosL3T5[1] = 0x03;
    bytesWithPosL3T5[3] = 0x05;
    t.deepEqual(outputStream.buffer, bytesWithPosL3T5, "Position options (left: 3, top: 5)");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage);
    var basicGraphicControlBytes = [
        // Extension Introducer: 0x21
        0x21,
        // Graphic Control Label: 0xF9
        0xF9,
        // Block Size: always this block containes 4 bytes
        0x04,
        // Diposal Method : 2, User Input Flag : 0, Transparent Color Flag : 0
        0x08,
        // Delay Time : 0
        0x00,0x00,
        // Transparent Color Index : 0
        0x00,
        // Block Terminator
        0x00
    ];
    t.deepEqual(outputStream.buffer, basicGraphicControlBytes.concat(basicImageDataBytes),
        "Default Graphic Control Extension");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage,
        { leftPosition: 3, topPosition: 5 });
    t.deepEqual(outputStream.buffer, basicGraphicControlBytes.concat(bytesWithPosL3T5),
        "Default Graphic Control Extension with Position options (left: 3, top: 5)");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage,
        { delayTimeInMS: 1000 });
    var delayTimeBytes = basicGraphicControlBytes.map(b => b);
    delayTimeBytes[4] = 100;
    t.deepEqual(outputStream.buffer, delayTimeBytes.concat(basicImageDataBytes),
        "Delay Time is set (100)");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage,
        { transparentColorIndex: 0 });
    var tcBytes = basicGraphicControlBytes.map(b => b);
    tcBytes[3] = 0x09;
    tcBytes[6] = 0x00;
    t.deepEqual(outputStream.buffer, tcBytes.concat(basicImageDataBytes),
        "Transparent color is set (0)");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage,
        { transparentColorIndex: 2 });
    tcBytes = basicGraphicControlBytes.map(b => b);
    tcBytes[3] = 0x09;
    tcBytes[6] = 0x02;
    t.deepEqual(outputStream.buffer, tcBytes.concat(basicImageDataBytes),
        "Transparent color is set (2)");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage,
        { transparentColorIndex: -1 });
    t.deepEqual(outputStream.buffer, basicGraphicControlBytes.concat(basicImageDataBytes),
        "Transparent color is not set (2)");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage,
        { disposalMethod: 3 });
    var dispBytes = basicGraphicControlBytes.map(b => b);
    dispBytes[3] = 0x0C; // 0b00001100
    t.deepEqual(outputStream.buffer, dispBytes.concat(basicImageDataBytes),
        "Disposal Method is set (3)");

    outputStream.buffer = [];
    gifWriter.writeTableBasedImageWithGraphicControl(indexedColorImage,
        { transparentColorIndex: 1, disposalMethod: 3 });
    var dispTransBytes = basicGraphicControlBytes.map(b => b);
    dispTransBytes[3] = 0x0D; // 0b00001101
    dispTransBytes[6] = 0x01;
    t.deepEqual(outputStream.buffer, dispTransBytes.concat(basicImageDataBytes),
        "Disposal Method and Transparent color are set");

    done();
});

t.testAsync("Write Loop Control (Application Extension)", function (done) {
    var outputStream = createOutputStream();
    var gifWriter = new vividcode.image.GifWriter(outputStream);
    gifWriter.writeLoopControlInfo(0x100);

    t.deepEqual(outputStream.buffer,
        [
            // Fixed value
            0x21, 0xFF, 11, 0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45,
            0x32, 0x2E, 0x30, 3, 0x01,
            // according to loop count
            0x00, 0x01,
            // Fixed value
            0x00,
        ]);
    done();
});

t.testAsync("Write trailer", function (done) {
    var outputStream = createOutputStream();
    var gifWriter = new vividcode.image.GifWriter(outputStream);
    gifWriter.writeTrailer();

    t.strictEqual(outputStream.buffer.length, 1, "output 1 bytes");
    t.deepEqual(outputStream.buffer.slice(0,1), [0x3B],
        "First 1 byte is byte of Trailer");
    done();
});

}).call(this);
