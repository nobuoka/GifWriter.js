/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	/*
	declare var require: (moduleName: string) => any;
	var MyWorker = require("worker!./web-worker.js");
	var worker = <Worker>new MyWorker();
	*/
	var worker = new Worker("./web-worker.bundle.js");
	var IMG_SIZE = 128;
	var workingSpaceElem;
	var imageDataList;
	function convertImgElemToImgData(imgElem) {
	    var canvasElem = document.createElement("canvas");
	    canvasElem.style.width = IMG_SIZE + "px";
	    canvasElem.style.height = IMG_SIZE + "px";
	    workingSpaceElem.appendChild(canvasElem);
	    var ctx = canvasElem.getContext("2d");
	    ctx.drawImage(imgElem, 0, 0, IMG_SIZE, IMG_SIZE);
	    var imgData = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
	    workingSpaceElem.removeChild(canvasElem);
	    return imgData;
	}
	window.addEventListener("load", function el(evt) {
	    window.removeEventListener("load", el, false);
	    workingSpaceElem = document.createElement("div");
	    workingSpaceElem.style.height = "1px";
	    workingSpaceElem.style.overflow = "hidden";
	    var imgElems = Array.prototype.slice.call(document.getElementsByTagName("img"));
	    imageDataList = imgElems.map(function (e) {
	        var d;
	        try {
	            // error will occur if img couldn't be loaded
	            d = convertImgElemToImgData(e);
	        }
	        catch (err) { }
	        return d;
	    }).filter(function (e) {
	        return !!e;
	    });
	    if (imageDataList.length === 0) {
	        alert("No image could be loaded...");
	        return;
	    }
	    var startButtonElem = document.getElementById("start-button");
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
	var startButtonClickEventHandler = function (evt) {
	    var paletteSizeInputElem = document.getElementById("palette-size-input");
	    var delayTimeInputElem = document.getElementById("delay-time-input");
	    var resultContElem = document.getElementById("result-container");
	    resultContElem.insertBefore(createProgressMessageElem(), resultContElem.firstChild);
	    worker.onmessage = function (evt) {
	        var msg = evt.data;
	        var imgElem = document.createElement("img");
	        var base64Str = btoa(msg.gifDataStr);
	        imgElem.src = "data:image/gif;base64," + base64Str;
	        var e = resultContElem.firstChild;
	        while (e && e.tagName === "SPAN") {
	            e = e.nextSibling;
	        }
	        resultContElem.insertBefore(imgElem, e);
	        if (resultContElem.firstChild.tagName === "SPAN")
	            resultContElem.removeChild(resultContElem.firstChild);
	    };
	    worker.onerror = function (err) {
	        alert(err);
	    };
	    var paletteSize = parseInt(paletteSizeInputElem.value);
	    if (!(1 <= paletteSize && paletteSize <= 255))
	        paletteSize = 255;
	    var delayTime = parseInt(delayTimeInputElem.value);
	    if (!(0 <= delayTime && delayTime <= 10000))
	        paletteSize = 200;
	    worker.postMessage({
	        imageDataList: imageDataList,
	        imageSize: IMG_SIZE,
	        paletteSize: paletteSize,
	        delayTimeInMS: delayTime
	    });
	};


/***/ }
/******/ ]);