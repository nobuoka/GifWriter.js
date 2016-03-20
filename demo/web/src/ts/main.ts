import * as wwm from "./web-worker-messages";

var worker = <wwm.MyWorker> new Worker("./demo/web-worker.bundle.js");
var IMG_SIZE = 128;

var workingSpaceElem: HTMLElement;
var imageDataList: ImageData[];

function convertImgElemToImgData(imgElem: HTMLImageElement): ImageData {
    var canvasElem = document.createElement("canvas");
    canvasElem.style.width = IMG_SIZE + "px";
    canvasElem.style.height = IMG_SIZE + "px";
    workingSpaceElem.appendChild(canvasElem);
    var ctx = canvasElem.getContext("2d");
    ctx.drawImage(imgElem,0,0,IMG_SIZE,IMG_SIZE);
    var imgData = ctx.getImageData(0,0,IMG_SIZE,IMG_SIZE);
    workingSpaceElem.removeChild(canvasElem);
    return imgData;
}

window.addEventListener("load", function el(evt) {
    window.removeEventListener("load", el, false);

    workingSpaceElem = document.createElement("div");
    workingSpaceElem.style.height = "1px";
    workingSpaceElem.style.overflow = "hidden";

    var imgElems = <HTMLImageElement[]>Array.prototype.slice.call(document.getElementsByTagName("img"));
    imageDataList = imgElems.map((e) => {
        var d: ImageData;
        try {
            // error will occur if img couldn't be loaded
            d = convertImgElemToImgData(e);
        } catch (err) {}
        return d;
    }).filter((e) => !!e);

    if (imageDataList.length === 0) {
        alert("No image could be loaded...");
        return;
    }

    var startButtonElem = <HTMLButtonElement>document.getElementById("start-button");
    startButtonElem.addEventListener("click", startButtonClickEventHandler, false);
    startButtonElem.textContent = "Start creating animation GIF";
    startButtonElem.disabled = false;
}, false);

function createProgressMessageElem() {
    var e = document.createElement("span");
    e.style.display = "inline-block";
    e.style.border = "solid 1px #666666";
    e.style.verticalAlign = "top";
    e.style.width = (IMG_SIZE - 2) + "px";
    e.style.height = (IMG_SIZE - 2) + "px";
    e.textContent = "please wait...";
    return e;
}
var startButtonClickEventHandler = function(evt: MouseEvent) {
    var paletteSizeInputElem = <HTMLInputElement>document.getElementById("palette-size-input");
    var delayTimeInputElem = <HTMLInputElement>document.getElementById("delay-time-input");

    var resultContElem = document.getElementById("result-container");
    resultContElem.insertBefore(createProgressMessageElem(), resultContElem.firstChild);
    var paletteSize = parseInt(paletteSizeInputElem.value);
    if (!(1 <= paletteSize && paletteSize <= 255)) paletteSize = 255;
    var delayTime = parseInt(delayTimeInputElem.value);
    if (!(0 <= delayTime && delayTime <= 10000)) paletteSize = 200;
    worker.postMessage({
        imageDataList: <any>imageDataList,
        imageSize: IMG_SIZE,
        paletteSize: paletteSize,
        delayTimeInMS: delayTime,
    });
};

worker.onmessage = function (evt) {
    var resultContElem = document.getElementById("result-container");
    var msg = evt.data;
    var imgElem = document.createElement("img");
    var base64Str = btoa(msg.gifDataStr);
    imgElem.src = "data:image/gif;base64," + base64Str;
    var e = resultContElem.firstChild;
    while (e && (<any>e).tagName === "SPAN") {
        e = e.nextSibling;
    }
    resultContElem.insertBefore(imgElem, e);
    if ((<any>resultContElem.firstChild).tagName === "SPAN")
        resultContElem.removeChild(resultContElem.firstChild);
};

worker.onerror = function (err) {
    alert(err);
};
