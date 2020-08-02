import * as gw from "gif-writer";
import * as wwm from "./web-worker-messages";

declare interface MyWorkerGlobalScope {
    onmessage: (evt: wwm.MyWorkerRequestMessageEvent) => void;
    postMessage(message: wwm.MyWorkerResponseMessageData): void;
}
declare var self: MyWorkerGlobalScope;

var GifWriter = gw.GifWriter;
var IndexedColorImage = gw.IndexedColorImage;
var MedianCutColorReducer = gw.MedianCutColorReducer;

class OutputStream implements gw.IOutputStream {
    buffer: number[] = [];
    writeByte(b: number) { this.buffer.push(b) }
    writeBytes(bb: number[]) { Array.prototype.push.apply(this.buffer, bb) }
}

self.onmessage = function (evt) {
    var msg = evt.data;

    var imageDataList = msg.imageDataList;
    var paletteSize = msg.paletteSize;
    var delayTimeInMS = msg.delayTimeInMS;
    var IMG_SIZE = msg.imageSize;

    var indexedColorImages =
            imageDataList.map((e) => convertImgDataToIndexedColorImage(e, paletteSize));
    var os = new OutputStream();
    var gifWriter = new GifWriter(os);
    gifWriter.writeHeader();
    gifWriter.writeLogicalScreenInfo({ width: IMG_SIZE, height: IMG_SIZE });
    gifWriter.writeLoopControlInfo(0);
    indexedColorImages.forEach((img) => {
        gifWriter.writeTableBasedImageWithGraphicControl(img, { delayTimeInMS: delayTimeInMS });
    });
    gifWriter.writeTrailer();

    var gifDataStr = os.buffer.map((b) => String.fromCharCode(b)).join("");
    self.postMessage({ gifDataStr: gifDataStr });
};

function convertImgDataToIndexedColorImage(imgData: gw.IImageData, paletteSize: number): gw.IndexedColorImage {
    var reducer = new MedianCutColorReducer(imgData, paletteSize);
    var paletteData = reducer.process();
    var dat = Array.prototype.slice.call(imgData.data);
    var indexedColorImageData: number[] = [];
    for (var idx = 0, len = dat.length; idx < len; idx += 4) {
        var d = dat.slice(idx, idx+4); // r,g,b,a
        indexedColorImageData.push(reducer.map(d[0],d[1],d[2]));
    }
    return new IndexedColorImage({ width: imgData.width, height: imgData.height },
            indexedColorImageData, paletteData);
}
