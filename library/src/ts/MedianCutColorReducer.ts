import {selectKthElem} from "./Selection";

/** This type expects integer from 0 to 255 inclusive. */
export type RgbComponentIntensity = number;

// This interface corresponds to `ImageData` interface of HTML standard.
// See: https://html.spec.whatwg.org/multipage/scripting.html#imagedata
export interface IImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray | RgbComponentIntensity[];
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
    red: RgbComponentIntensity;
    blue: RgbComponentIntensity;
    green: RgbComponentIntensity;
}
class ColorCube {
    colors: IColor[];
    constructor(colors: IColor[]) {
        this.colors = colors;
    }

    divide(): ColorCube[] {
        return ColorCubes.divide(this.colors);
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

    process(): RgbComponentIntensity[] {
        var imageData = this.__imageData;
        var maxcolor = this.__maxPaletteSize;

        var colors = extractColorsFromImageData(imageData);
        var cubes = MedianCut.medianCut(colors, maxcolor);
        var palette: IColor[] = [];
        var colorReductionMap = Object.create(null);
        cubes.forEach((cube, idx) => {
            palette.push(cube.average());
            cube.colors.forEach(function (c) {
                let rgb = convertRgbTripletToRgbString(c.red, c.green, c.blue);
                colorReductionMap[rgb] = idx;
            });
        });
        this.__palette = palette;
        this.__colorReductionMap = colorReductionMap;

        var paletteData: RgbComponentIntensity[] = [];
        palette.forEach((color) => {
            paletteData.push(color.red);
            paletteData.push(color.green);
            paletteData.push(color.blue);
        });
        return paletteData;
    }

    map(r: RgbComponentIntensity, g: RgbComponentIntensity, b: RgbComponentIntensity) {
        let rgb = convertRgbTripletToRgbString(r, g, b);
        if (!(rgb in this.__colorReductionMap)) {
            this.__colorReductionMap[rgb] =
                searchClosestColorIndex({ red: r, green: g, blue: b }, this.__palette);
        }
        return this.__colorReductionMap[rgb];
    }
}

function extractColorsFromImageData(imageData: IImageData): IColor[] {
    var maxIndex = imageData.width * imageData.height;

    var colorHash: { [rgb: string]: boolean; } = {};
    var colors: IColor[] = [];
    for (var i = 0; i < maxIndex; ++i) {
        var r = imageData.data[i*4+0];
        var g = imageData.data[i*4+1];
        var b = imageData.data[i*4+2];
        let rgb = convertRgbTripletToRgbString(r, g, b);
        if (!colorHash[rgb]) {
            colorHash[rgb] = true;
            colors.push({ red: r, green: g, blue: b });
        }
    }
    return colors;
}

namespace ColorCubes {
    export function divide(colors: IColor[]): ColorCube[] {
        let cut = largestEdge(colors);
        let med = median(colors, cut);
        let r = divideBy(colors, cut, med);
        return r;
    }

    function largestEdge(colors: IColor[]): ColorName {
        var minR = 255;
        var maxR = 0;
        var minG = 255;
        var maxG = 0;
        var minB = 255;
        var maxB = 0;

        colors.forEach((color) => {
            if (color.red < minR) minR = color.red;
            if (color.red > maxR) maxR = color.red;
            if (color.green < minG) minG = color.green;
            if (color.green > maxG) maxG = color.green;
            if (color.blue < minB) minB = color.blue;
            if (color.blue > maxB) maxB = color.blue;
        });

        var diffR = (maxR - minR) * 1.0;
        var diffG = (maxG - minG) * 0.8;
        var diffB = (maxB - minB) * 0.5;

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

    function median(colors: IColor[], cutTargetColor: ColorName): RgbComponentIntensity {
        var cc: RgbComponentIntensity[] = [];
        for (var i = 0, len = colors.length; i < len; ++i) {
            cc.push(colors[i][cutTargetColor]);
        }
        var med2 = selectKthElem(cc, Math.floor(cc.length / 2) + 1);
        return med2;
    }

    function divideBy(colors: IColor[], cutTargetColor: ColorName, median: RgbComponentIntensity) {
        var list0: IColor[] = [];
        var list1: IColor[] = [];
        colors.forEach((c) => {
            if (c[cutTargetColor] < median) {
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
}

namespace MedianCut {
    export function medianCut(colors: IColor[], maxColor: number): ColorCube[] {
        var cube = new ColorCube(colors);
        var divided = divideCubesUntil([cube], maxColor);
        return divided;
    }

    function divideCubesUntil(cubes: ColorCube[], limit: number): ColorCube[] {
        while (true) {
            if (cubes.length >= limit) break;
            var largestCube = getLargestCube(cubes);
            var dcubes = largestCube.divide();
            if (dcubes.length < 2) break;
            cubes = cubes.filter(function (c) { return c !== largestCube }).concat(dcubes);
        }
        return cubes;
    }

    /**
     * @param cubes This must include one or more elements.
     */
    function getLargestCube(cubes: ColorCube[]): ColorCube {
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

function convertRgbTripletToRgbString(red: RgbComponentIntensity, green: RgbComponentIntensity, blue: RgbComponentIntensity): string {
    var rgb = ((red << 16) | (green << 8) | (blue << 0)).toString(16);
    while (6 - rgb.length) rgb = "0" + rgb;
    return rgb;
}
