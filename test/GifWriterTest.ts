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

}).call(this);
