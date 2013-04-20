declare var require;
declare var test;
declare var suite;

(function () {
"use strict";

var assert = require("assert");
var t = {
    module: suite,
    test: test,
    testAsync: function (description, testFunc) {
        test(description, testFunc);
    },
    equal:    assert.equal,
    notEqual: assert.notEqual,
    deepEqual:    assert.deepEqual,
    notDeepEqual: assert.notDeepEqual,
    strictEqual:    assert.strictEqual,
    notStrictEqual: assert.notStrictEqual,
    ok: assert.ok,
    throws: assert.throws,
};

function createOutputStream() {
    return {
        buffer: [],
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

}).call(this);
