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
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var gw = __webpack_require__(1);
	var GifWriter = gw.GifWriter;
	var IndexedColorImage = gw.IndexedColorImage;
	var MedianCutColorReducer = gw.MedianCutColorReducer;
	var OutputStream = (function () {
	    function OutputStream() {
	        this.buffer = [];
	    }
	    OutputStream.prototype.writeByte = function (b) { this.buffer.push(b); };
	    OutputStream.prototype.writeBytes = function (bb) { Array.prototype.push.apply(this.buffer, bb); };
	    return OutputStream;
	}());
	self.onmessage = function (evt) {
	    var msg = evt.data;
	    var imageDataList = msg.imageDataList;
	    var paletteSize = msg.paletteSize;
	    var delayTimeInMS = msg.delayTimeInMS;
	    var IMG_SIZE = msg.imageSize;
	    var indexedColorImages = imageDataList.map(function (e) {
	        return convertImgDataToIndexedColorImage(e, paletteSize);
	    });
	    var os = new OutputStream();
	    var gifWriter = new GifWriter(os);
	    gifWriter.writeHeader();
	    gifWriter.writeLogicalScreenInfo({ width: IMG_SIZE, height: IMG_SIZE });
	    gifWriter.writeLoopControlInfo(0);
	    indexedColorImages.forEach(function (img) {
	        gifWriter.writeTableBasedImageWithGraphicControl(img, { delayTimeInMS: delayTimeInMS });
	    });
	    gifWriter.writeTrailer();
	    var gifDataStr = os.buffer.map(function (b) { return String.fromCharCode(b); }).join("");
	    self.postMessage({ gifDataStr: gifDataStr });
	};
	function convertImgDataToIndexedColorImage(imgData, paletteSize) {
	    var reducer = new MedianCutColorReducer(imgData, paletteSize);
	    var paletteData = reducer.process();
	    var dat = Array.prototype.slice.call(imgData.data);
	    var indexedColorImageData = [];
	    for (var idx = 0, len = dat.length; idx < len; idx += 4) {
	        var d = dat.slice(idx, idx + 4); // r,g,b,a
	        indexedColorImageData.push(reducer.map(d[0], d[1], d[2]));
	    }
	    return new IndexedColorImage({ width: imgData.width, height: imgData.height }, indexedColorImageData, paletteData);
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(2));
	__export(__webpack_require__(3));


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	var IndexedColorImage = (function () {
	    function IndexedColorImage(size, data, paletteData) {
	        this.width = size.width;
	        this.height = size.height;
	        this.data = data;
	        this.paletteData = paletteData;
	    }
	    return IndexedColorImage;
	}());
	exports.IndexedColorImage = IndexedColorImage;
	var GifCompressedCodesToByteArrayConverter = (function () {
	    function GifCompressedCodesToByteArrayConverter() {
	        this.__out = [];
	        this.__remNumBits = 0;
	        this.__remVal = 0;
	    }
	    GifCompressedCodesToByteArrayConverter.prototype.push = function (code, numBits) {
	        while (numBits > 0) {
	            this.__remVal = ((code << this.__remNumBits) & 0xFF) + this.__remVal;
	            if (numBits + this.__remNumBits >= 8) {
	                this.__out.push(this.__remVal);
	                numBits = numBits - (8 - this.__remNumBits);
	                code = (code >> (8 - this.__remNumBits));
	                this.__remVal = 0;
	                this.__remNumBits = 0;
	            }
	            else {
	                this.__remNumBits = numBits + this.__remNumBits;
	                numBits = 0;
	            }
	        }
	    };
	    GifCompressedCodesToByteArrayConverter.prototype.flush = function () {
	        this.push(0, 8);
	        this.__remNumBits = 0;
	        this.__remVal = 0;
	        var out = this.__out;
	        this.__out = [];
	        return out;
	    };
	    return GifCompressedCodesToByteArrayConverter;
	}());
	function compressWithLZW(actualCodes, numBits) {
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
	        if (!(dictKey in dict))
	            dict[dictKey] = code;
	        var oldKey = concatedCodesKey;
	        concatedCodesKey += dictKey;
	        if (!(concatedCodesKey in dict)) {
	            bb.push(dict[oldKey], curNumCodeBits);
	            // GIF spec defines a maximum code value of 4095 (0xFFF)
	            if (nextCode <= 0xFFF) {
	                dict[concatedCodesKey] = nextCode;
	                if (nextCode === (1 << curNumCodeBits))
	                    curNumCodeBits++;
	                nextCode++;
	            }
	            else {
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
	var GifWriter = (function () {
	    function GifWriter(outputStream) {
	        this.__os = outputStream;
	    }
	    GifWriter.prototype.__writeInt2 = function (v) {
	        this.__os.writeBytes([v & 0xFF, (v >> 8) & 0xFF]);
	    };
	    GifWriter.prototype.__writeDataSubBlocks = function (data) {
	        var os = this.__os;
	        var curIdx = 0;
	        var blockLastIdx;
	        while (curIdx < (blockLastIdx = Math.min(data.length, curIdx + 254))) {
	            var subarray = data.slice(curIdx, blockLastIdx);
	            os.writeByte(subarray.length);
	            os.writeBytes(subarray);
	            curIdx = blockLastIdx;
	        }
	    };
	    GifWriter.prototype.__writeBlockTerminator = function () {
	        this.__os.writeByte(0);
	    };
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
	    GifWriter.prototype.writeHeader = function () {
	        var os = this.__os;
	        // Signature
	        os.writeBytes([0x47, 0x49, 0x46]); // "GIF"
	        // Version
	        os.writeBytes([0x38, 0x39, 0x61]); // "89a"
	    };
	    GifWriter.prototype.writeTrailer = function () {
	        this.__os.writeByte(0x3B);
	    };
	    // write <Logical Screen>
	    GifWriter.prototype.writeLogicalScreenInfo = function (imageSize, options) {
	        if (!options)
	            options = {};
	        var sizeOfColorTable = "sizeOfColorTable" in options ? options.sizeOfColorTable :
	            options.colorTableData ? this.__calcSizeOfColorTable(options.colorTableData) :
	                7; // 256 colors
	        var bgColorIndex = ("bgColorIndex" in options ? options.bgColorIndex : 0);
	        var pxAspectRatio = ("pxAspectRatio" in options ? options.pxAspectRatio : 0);
	        this.__writeLogicalScreenDescriptor(imageSize, !!options.colorTableData, !!options.colorTableSortFlag, sizeOfColorTable, bgColorIndex, pxAspectRatio);
	        if (!!options.colorTableData)
	            this.__writeColorTable(options.colorTableData, sizeOfColorTable);
	    };
	    GifWriter.prototype.__calcSizeOfColorTable = function (colorTableData) {
	        var numColors = colorTableData.length / 3;
	        var sct = 0;
	        var v = 2;
	        while (v < numColors) {
	            sct++;
	            v = v << 1;
	        }
	        return sct;
	    };
	    GifWriter.prototype.__writeLogicalScreenDescriptor = function (imageSize, useGlobalColorTable, colorTableSortFlag, sizeOfColorTable, bgColorIndex, pxAspectRatio) {
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
	            sizeOfColorTable);
	        // Background Color Index
	        os.writeByte(bgColorIndex);
	        // Pixel Aspect Ratio
	        os.writeByte(pxAspectRatio);
	    };
	    // write <Table-Based Image> (::= Image Descriptor [Local Color Table] Image Data)
	    GifWriter.prototype.writeTableBasedImage = function (indexedColorImage, options) {
	        if (!options)
	            options = {};
	        var useLocalColorTable = true; // currently use local color table always
	        var sizeOfLocalColorTable = this.__calcSizeOfColorTable(indexedColorImage.paletteData);
	        this.__writeImageDescriptor(indexedColorImage, useLocalColorTable, sizeOfLocalColorTable, options);
	        if (useLocalColorTable) {
	            this.__writeColorTable(indexedColorImage.paletteData, (useLocalColorTable ? sizeOfLocalColorTable : 0));
	        }
	        this.__writeImageData(indexedColorImage.data, sizeOfLocalColorTable + 1);
	    };
	    GifWriter.prototype.writeTableBasedImageWithGraphicControl = function (indexedColorImage, gcOpts) {
	        this.__writeGraphicControlExtension(gcOpts);
	        this.writeTableBasedImage(indexedColorImage, gcOpts);
	    };
	    GifWriter.prototype.__writeImageDescriptor = function (indexedColorImage, useLocalColorTable, sizeOfLocalColorTable, opts) {
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
	            sizeOfLocalColorTable);
	    };
	    GifWriter.prototype.__writeImageData = function (data, numBitsForCode) {
	        var os = this.__os;
	        // Because of some algorithmic constraints, minimum value of `numBitsForCode` is 2
	        if (numBitsForCode === 1)
	            numBitsForCode = 2;
	        var compressedBytes = compressWithLZW(data, numBitsForCode);
	        os.writeByte(numBitsForCode);
	        // PACKAGE THE BYTES
	        this.__writeDataSubBlocks(compressedBytes);
	        // GIF spec says : A block with a zero byte count terminates the
	        // Raster Data stream for a given image.
	        this.__writeBlockTerminator();
	    };
	    GifWriter.prototype.__writeColorTable = function (colorTableData, sizeOfColorTable) {
	        var os = this.__os;
	        os.writeBytes(colorTableData);
	        var rem = (3 * Math.pow(2, sizeOfColorTable + 1)) - colorTableData.length;
	        var remBytes = [];
	        while (--rem >= 0)
	            remBytes.push(0);
	        os.writeBytes(remBytes);
	    };
	    GifWriter.prototype.__writeGraphicControlExtension = function (options) {
	        if (!options)
	            options = {};
	        var os = this.__os;
	        var delay = Math.round((options.delayTimeInMS || 0) / 10);
	        var disposalMethod = ("disposalMethod" in options ? options.disposalMethod : 2);
	        var transparentColorIndex;
	        var transparentColorFlag;
	        if (options.transparentColorIndex >= 0) {
	            transparentColorIndex = options.transparentColorIndex & 0xFF;
	            transparentColorFlag = 1;
	        }
	        else {
	            transparentColorIndex = 0;
	            transparentColorFlag = 0;
	        }
	        // Extension Introducer: 0x21
	        // Graphic Control Label: 0xF9
	        // Block Size: always this block containes 4 bytes
	        os.writeBytes([0x21, 0xF9, 0x04]);
	        // <Packed Field>
	        os.writeByte(0 |
	            (disposalMethod << 2) |
	            0 |
	            transparentColorFlag // Transparent Color Flag (1 bit)
	        );
	        // Delay Time : 1/100 sec
	        this.__writeInt2(delay);
	        // Transparent Color Index
	        os.writeByte(transparentColorIndex);
	        // Block Terminator
	        os.writeByte(0);
	    };
	    // One of Application Extension
	    GifWriter.prototype.writeLoopControlInfo = function (repeatCount) {
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
	            3,
	            0x01,
	            (repeatCount & 0xFF), ((repeatCount >> 8) & 0xFF),
	            // Block Terminator
	            0x00,
	        ]);
	    };
	    return GifWriter;
	}());
	exports.GifWriter = GifWriter;


/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	// Partition-based general selection algorithm
	// see : http://en.wikipedia.org/wiki/Selection_algorithm
	function swap(array, idx1, idx2) {
	    var tmp = array[idx1];
	    array[idx1] = array[idx2];
	    array[idx2] = tmp;
	}
	function partition(a, left, right, pivotIndex) {
	    var pivotValue = a[pivotIndex];
	    swap(a, pivotIndex, right);
	    var storeIndex = left;
	    for (var i = left; i < right; ++i) {
	        if (a[i] <= pivotValue) {
	            swap(a, storeIndex, i);
	            storeIndex = storeIndex + 1;
	        }
	    }
	    swap(a, right, storeIndex);
	    return storeIndex;
	}
	function selectKthElem(list, left, right, k) {
	    while (true) {
	        // select pivotIndex between left and right
	        var pivotIndex = Math.floor((right + left) / 2);
	        var pivotNewIndex = partition(list, left, right, pivotIndex);
	        var pivotDist = pivotNewIndex - left + 1;
	        if (k === pivotDist) {
	            return list[pivotNewIndex];
	        }
	        else if (k < pivotDist) {
	            right = pivotNewIndex - 1;
	        }
	        else {
	            k = k - pivotDist;
	            left = pivotNewIndex + 1;
	        }
	    }
	}
	function searchClosestColor(color, palette) {
	    var idx = searchClosestColorIndex(color, palette);
	    return palette[idx];
	}
	function searchClosestColorIndex(color, palette) {
	    var min = 0;
	    var found = false;
	    var foundIndex = -1;
	    var closestIndex = -1;
	    var index = 0;
	    palette.forEach(function (p, idx) {
	        var d = Math.floor(Math.pow(color.red - p.red, 2) +
	            Math.pow(color.green - p.green, 2) +
	            Math.pow(color.blue - p.blue, 2));
	        if (d == 0) {
	            found = true;
	            foundIndex = idx;
	            closestIndex = idx;
	        }
	        else if (min == 0 || d < min) {
	            closestIndex = idx;
	            min = d;
	        }
	    });
	    return (found ? foundIndex : closestIndex);
	}
	var ColorCube = (function () {
	    function ColorCube(colors) {
	        this.colors = colors;
	        var minR = 255;
	        var maxR = 0;
	        var minG = 255;
	        var maxG = 0;
	        var minB = 255;
	        var maxB = 0;
	        colors.forEach(function (color) {
	            if (color.red < minR)
	                minR = color.red;
	            if (color.red > maxR)
	                maxR = color.red;
	            if (color.green < minG)
	                minG = color.green;
	            if (color.green > maxG)
	                maxG = color.green;
	            if (color.blue < minB)
	                minB = color.blue;
	            if (color.blue > maxB)
	                maxB = color.blue;
	        });
	        this.__minR = minR;
	        this.__maxR = maxR;
	        this.__minG = minG;
	        this.__maxG = maxG;
	        this.__minB = minB;
	        this.__maxB = maxB;
	    }
	    ColorCube.prototype.divide = function () {
	        var cut = this.largestEdge();
	        var med = this.median(cut);
	        var r = this.divideBy(cut, med);
	        return r;
	    };
	    ColorCube.prototype.divideBy = function (cutTargetColor, median) {
	        var list0 = [];
	        var list1 = [];
	        this.colors.forEach(function (c) {
	            if (c[cutTargetColor] < median) {
	                list0.push(c);
	            }
	            else {
	                list1.push(c);
	            }
	        });
	        if (list0.length > 0 && list1.length > 0) {
	            return [new ColorCube(list0), new ColorCube(list1)];
	        }
	        else {
	            return [];
	        }
	    };
	    ColorCube.prototype.median = function (cutTargetColor) {
	        var cc = [];
	        var colors = this.colors;
	        for (var i = 0, len = colors.length; i < len; ++i) {
	            cc.push((colors[i])[cutTargetColor]);
	        }
	        var med2 = selectKthElem(cc, 0, cc.length - 1, Math.floor(cc.length / 2) + 1);
	        return med2;
	    };
	    ColorCube.prototype.largestEdge = function () {
	        var diffR = (this.__maxR - this.__minR) * 1.0;
	        var diffG = (this.__maxG - this.__minG) * 0.8;
	        var diffB = (this.__maxB - this.__minB) * 0.5;
	        if (diffG >= diffB) {
	            if (diffR >= diffG) {
	                return "red";
	            }
	            else {
	                return "green";
	            }
	        }
	        else {
	            if (diffR >= diffB) {
	                return "red";
	            }
	            else {
	                return "blue";
	            }
	        }
	    };
	    ColorCube.prototype.getNumberOfColors = function () {
	        return this.colors.length;
	    };
	    ColorCube.prototype.average = function () {
	        var sumR = 0;
	        var sumG = 0;
	        var sumB = 0;
	        this.colors.forEach(function (c) {
	            sumR += c.red;
	            sumG += c.green;
	            sumB += c.blue;
	        });
	        var size = this.colors.length;
	        return {
	            red: Math.floor(sumR / size),
	            green: Math.floor(sumG / size),
	            blue: Math.floor(sumB / size)
	        };
	    };
	    return ColorCube;
	}());
	var MedianCutColorReducer = (function () {
	    function MedianCutColorReducer(imageData, maxPaletteSize) {
	        this.__imageData = imageData;
	        this.__maxPaletteSize = maxPaletteSize || 0xFF;
	    }
	    MedianCutColorReducer.prototype.process = function () {
	        var imageData = this.__imageData;
	        var maxcolor = this.__maxPaletteSize;
	        var colors = this.__extractColors(imageData);
	        var cubes = this.__medianCut(colors, maxcolor);
	        var palette = [];
	        var colorReductionMap = Object.create(null);
	        cubes.forEach(function (cube, idx) {
	            palette.push(cube.average());
	            cube.colors.forEach(function (c) {
	                var rgb = ((c.red << 16) | (c.green << 8) | (c.blue << 0)).toString(16);
	                while (6 - rgb.length)
	                    rgb = "0" + rgb;
	                colorReductionMap[rgb] = idx;
	            });
	        });
	        this.__palette = palette;
	        this.__colorReductionMap = colorReductionMap;
	        var paletteData = [];
	        palette.forEach(function (color) {
	            paletteData.push(color.red);
	            paletteData.push(color.green);
	            paletteData.push(color.blue);
	        });
	        return paletteData;
	    };
	    MedianCutColorReducer.prototype.map = function (r, g, b) {
	        var rgb = ((r << 16) | (g << 8) | (b << 0)).toString(16);
	        while (6 - rgb.length)
	            rgb = "0" + rgb;
	        if (!(rgb in this.__colorReductionMap)) {
	            this.__colorReductionMap[rgb] =
	                searchClosestColorIndex({ red: r, green: g, blue: b }, this.__palette);
	        }
	        return this.__colorReductionMap[rgb];
	    };
	    MedianCutColorReducer.prototype.__extractColors = function (imageData) {
	        var maxIndex = imageData.width * imageData.height;
	        var colorHash = {};
	        var colors = [];
	        for (var i = 0; i < maxIndex; ++i) {
	            var r = imageData.data[i * 4 + 0];
	            var g = imageData.data[i * 4 + 1];
	            var b = imageData.data[i * 4 + 2];
	            var rgb = ((r << 16) | (g << 8) | (b << 0)).toString(16);
	            while (6 - rgb.length)
	                rgb = "0" + rgb;
	            if (!colorHash[rgb]) {
	                colorHash[rgb] = true;
	                colors.push({ red: r, green: g, blue: b });
	            }
	        }
	        return colors;
	    };
	    MedianCutColorReducer.prototype.__medianCut = function (colors, maxColor) {
	        var cube = new ColorCube(colors);
	        var divided = this.__divideUntil([cube], maxColor);
	        return divided;
	    };
	    MedianCutColorReducer.prototype.__divideUntil = function (cubes, limit) {
	        while (true) {
	            if (cubes.length >= limit)
	                break;
	            var largestCube = this.__getLargestCube(cubes);
	            var dcubes = largestCube.divide();
	            if (dcubes.length < 2)
	                break;
	            cubes = cubes.filter(function (c) { return c !== largestCube; }).concat(dcubes);
	        }
	        return cubes;
	    };
	    MedianCutColorReducer.prototype.__getLargestCube = function (cubes) {
	        var max = null;
	        var maxCount = 0;
	        cubes.forEach(function (x) {
	            var cc = x.getNumberOfColors();
	            if (cc > maxCount) {
	                max = x;
	                maxCount = cc;
	            }
	        });
	        return max;
	    };
	    return MedianCutColorReducer;
	}());
	exports.MedianCutColorReducer = MedianCutColorReducer;


/***/ }
/******/ ]);