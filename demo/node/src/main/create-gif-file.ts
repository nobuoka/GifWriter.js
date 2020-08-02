import * as gw from "gif-writer";
import * as fs from "fs";

// This defines an image data which will be written to a file.
var indexedColorImage = new gw.IndexedColorImage(
    { width: 9, height: 9 },
    // image data: one element represents one pixel.
    //   value is color index: 0 is black (0,0,0) and 1 is white (255,255,255) in this example.
    [
        0,0,0,1,1,1,0,0,0,
        0,0,0,1,1,1,0,0,0,
        0,0,0,1,1,1,0,0,0,
        1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,
        0,0,0,1,1,1,0,0,0,
        0,0,0,1,1,1,0,0,0,
        0,0,0,1,1,1,0,0,0,
    ],
    // palette data: sequence of three elements (red, green, blue) represents one color.
    [0,0,0, 255,255,255]
);

class MyOutputStream implements gw.IOutputStream {
    buffer: number[] = [];
    writeByte(b: number): void {
        this.buffer.push(b);
    }
    writeBytes(bb: number[]): void {
        Array.prototype.push.apply(this.buffer, bb);
    }
}
// This object is used by GifWriter. Only two methods `writeByte` and `writeBytes` are
// required.
var outputStream = new MyOutputStream();

// Write GIF data to outputStream.
var gifWriter = new gw.GifWriter(outputStream);
gifWriter.writeHeader();
gifWriter.writeLogicalScreenInfo({
    width: indexedColorImage.width,
    height: indexedColorImage.height,
});
gifWriter.writeTableBasedImage(indexedColorImage);
gifWriter.writeTrailer();

// Write data to file. (node.js)
var buf = new Buffer(outputStream.buffer);
fs.writeFile('test.gif', buf, (err) => {
    if (err) console.log(err);
    else console.log('It\'s saved!');
});
