import {selectKthElem} from "./Selection";

// This interface corresponds to `ImageData` interface of HTML standard.
// See: https://html.spec.whatwg.org/multipage/scripting.html#imagedata
export interface IImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray | number[];
}

function searchClosestColorIndex(color: IColor, palette: IColor[]) {
    var min = 0;
    var found = false;
    var foundIndex = -1;
    var closestIndex = -1;
    var index = 0;
    palette.forEach((p, idx) => {
        var d = Math.floor(
            Math.pow(color.red - p.red, 2) +
            Math.pow(color.green - p.green, 2) +
            Math.pow(color.blue - p.blue, 2)
        );
        if (d == 0) {
            found = true;
            foundIndex = idx;
            closestIndex = idx;
        } else if (min == 0 || d < min) {
            closestIndex = idx;
            min = d
        }
    });
    return (found ? foundIndex : closestIndex);
}

type ColorName = "red" | "blue" | "green";
export interface IColor {
    red: number;
    blue: number;
    green: number;
}
class ColorCube {
    colors: IColor[];
    __minR: number;
    __maxR: number;
    __minB: number;
    __maxB: number;
    __minG: number;
    __maxG: number;
    constructor(colors: IColor[]) {
        this.colors = colors;
        var minR = 255
        var maxR = 0
        var minG = 255
        var maxG = 0
        var minB = 255
        var maxB = 0

        colors.forEach((color) => {
            if (color.red < minR) minR = color.red;
            if (color.red > maxR) maxR = color.red;
            if (color.green < minG) minG = color.green;
            if (color.green > maxG) maxG = color.green;
            if (color.blue < minB) minB = color.blue;
            if (color.blue > maxB) maxB = color.blue;
        });

        this.__minR = minR;
        this.__maxR = maxR;
        this.__minG = minG;
        this.__maxG = maxG;
        this.__minB = minB;
        this.__maxB = maxB;
    }

    divide(): ColorCube[] {
        var cut = this.largestEdge()
        var med = this.median(cut)
        var r = this.divideBy(cut, med)
        return r;
    }

    divideBy(cutTargetColor: ColorName, median: number) {
        var list0: IColor[] = [];
        var list1: IColor[] = [];
        this.colors.forEach((c) => {
            if ((<any>c)[cutTargetColor] < median) {
                list0.push(c);
            } else {
                list1.push(c);
            }
        });
        if (list0.length > 0 && list1.length > 0) {
            return [new ColorCube(list0), new ColorCube(list1)];
        } else {
            return [];
        }
    }

    median(cutTargetColor: ColorName): number {
        var cc: number[] = [];
        var colors = this.colors;
        for (var i = 0, len = colors.length; i < len; ++i) {
            cc.push((<any>(colors[i]))[cutTargetColor]);
        }
        var med2 = selectKthElem(cc, Math.floor(cc.length / 2) + 1);
        return med2;
    }

    largestEdge(): ColorName {
        var diffR = (this.__maxR - this.__minR) * 1.0;
        var diffG = (this.__maxG - this.__minG) * 0.8;
        var diffB = (this.__maxB - this.__minB) * 0.5;

        if (diffG >= diffB) {
            if (diffR >= diffG) {
                return "red";
            } else {
                return "green";
            }
        } else {
            if (diffR >=diffB) {
                return "red";
            } else {
                return "blue";
            }
        }
    }

    getNumberOfColors() {
        return this.colors.length;
    }

    average() {
        var sumR = 0
        var sumG = 0
        var sumB = 0
        this.colors.forEach((c) => {
            sumR += c.red;
            sumG += c.green;
            sumB += c.blue;
        });
        var size = this.colors.length;
        return {
            red: Math.floor(sumR/size),
            green: Math.floor(sumG/size),
            blue: Math.floor(sumB/size),
        };
    }
}

/**
 * Simple color quantizer.
 *
 * It uses the median cut algorithm.
 * If you have a full color image data and you want to write it as GIF by using GifWriter,
 * you must do color quantization by using this class (or by other way) first.
 */
export class MedianCutColorReducer {
    private __imageData: IImageData;
    private __maxPaletteSize: number;
    private __palette: IColor[] = [];
    private __colorReductionMap: { [colorRGBStr: string]: number; } = {};

    constructor(imageData: IImageData, maxPaletteSize: number) {
        this.__imageData = imageData;
        this.__maxPaletteSize = maxPaletteSize || 0xFF;
    }

    process() {
        var imageData = this.__imageData;
        var maxcolor = this.__maxPaletteSize;

        var colors = this.__extractColors(imageData);
        var cubes = this.__medianCut(colors, maxcolor);
        var palette: IColor[] = [];
        var colorReductionMap = Object.create(null);
        cubes.forEach((cube, idx) => {
            palette.push(cube.average());
            cube.colors.forEach(function (c) {
                var rgb = ((c.red << 16) | (c.green << 8) | (c.blue << 0)).toString(16);
                while (6 - rgb.length) rgb = "0" + rgb;
                colorReductionMap[rgb] = idx;
            });
        });
        this.__palette = palette;
        this.__colorReductionMap = colorReductionMap;

        var paletteData: number[] = [];
        palette.forEach((color) => {
            paletteData.push(color.red);
            paletteData.push(color.green);
            paletteData.push(color.blue);
        });
        return paletteData;
    }

    map(r: number, g: number, b: number) {
        var rgb = ((r << 16) | (g << 8) | (b << 0)).toString(16);
        while (6 - rgb.length) rgb = "0" + rgb;
        if (!(rgb in this.__colorReductionMap)) {
            this.__colorReductionMap[rgb] =
                searchClosestColorIndex({ red: r, green: g, blue: b }, this.__palette);
        }
        return this.__colorReductionMap[rgb];
    }

    private __extractColors(imageData: IImageData) {
        var maxIndex = imageData.width * imageData.height;

        var colorHash: { [rgb: string]: boolean; } = {};
        var colors: IColor[] = [];
        for (var i = 0; i < maxIndex; ++i) {
            var r = imageData.data[i*4+0];
            var g = imageData.data[i*4+1];
            var b = imageData.data[i*4+2];
            var rgb = ((r << 16) | (g << 8) | (b << 0)).toString(16);
            while (6 - rgb.length) rgb = "0" + rgb;
            if (!colorHash[rgb]) {
                colorHash[rgb] = true;
                colors.push({ red: r, green: g, blue: b });
            }
        }
        return colors;
    }

    private __medianCut(colors: IColor[], maxColor: number) {
        var cube = new ColorCube(colors);
        var divided = this.__divideUntil([cube], maxColor);
        return divided;
    }

    private __divideUntil(cubes: ColorCube[], limit: number) {
        while (true) {
            if (cubes.length >= limit) break;
            var largestCube = this.__getLargestCube(cubes);
            var dcubes = largestCube.divide();
            if (dcubes.length < 2) break;
            cubes = cubes.filter(function (c) { return c !== largestCube }).concat(dcubes);
        }
        return cubes;
    }

    /**
     * @param cubes This must include one or more elements.
     */
    private __getLargestCube(cubes: ColorCube[]): ColorCube {
        var max: ColorCube | undefined;
        var maxCount = 0
        cubes.forEach((x) => {
            var cc = x.getNumberOfColors();
            if (cc > maxCount) {
                max = x;
                maxCount = cc;
            }
        });
        if (max === undefined) throw Error("`cubes` must have one or more elements.");
        return max;
    }
}
