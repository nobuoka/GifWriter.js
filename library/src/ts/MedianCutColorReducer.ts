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

type RgbComponentName = keyof IColor;
export interface IColor {
    red: RgbComponentIntensity;
    blue: RgbComponentIntensity;
    green: RgbComponentIntensity;
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
    private __palette: ReducedColorPalette = new ReducedColorPaletteImpl([], {});

    constructor(imageData: IImageData, maxPaletteSize: number) {
        this.__imageData = imageData;
        this.__maxPaletteSize = maxPaletteSize || 0xFF;
    }

    process(): RgbComponentIntensity[] {
        var colors = extractColorsFromImageData(this.__imageData);
        this.__palette = reduceColors(colors, this.__maxPaletteSize);

        var paletteData: RgbComponentIntensity[] = [];
        this.__palette.colors.forEach((color) => {
            paletteData.push(color.red);
            paletteData.push(color.green);
            paletteData.push(color.blue);
        });
        return paletteData;
    }

    map(r: RgbComponentIntensity, g: RgbComponentIntensity, b: RgbComponentIntensity) {
        return this.__palette.indexOfClosestColor({ red: r, green: g, blue: b });
    }
}

interface ReducedColorPalette {
    readonly colors: IColor[];
    indexOfClosestColor(color: IColor): number;
}

class ReducedColorPaletteImpl implements ReducedColorPalette {
    readonly colors: IColor[];
    private _colorReductionMap: { [colorRgbString: string]: number };

    constructor(colors: IColor[], colorReductionMap: { [colorRgbString: string]: number }) {
        this.colors = colors;
        this._colorReductionMap = colorReductionMap;
    }

    indexOfClosestColor(color: IColor) {
        let rgb = convertRgbTripletToRgbString(color.red, color.green, color.blue);
        if (!(rgb in this._colorReductionMap)) {
            this._colorReductionMap[rgb] = searchClosestColorIndex(color, this.colors);
        }
        return this._colorReductionMap[rgb];
    }
}

function reduceColors(colors: IColor[], maxPaletteSize: number): ReducedColorPalette {
    var cubes = MedianCut.medianCut(colors, maxPaletteSize);
    var palette: IColor[] = [];
    var colorReductionMap = Object.create(null);
    cubes.forEach((cube, idx) => {
        palette.push(ColorCubes.average(cube));
        cube.forEach(function (c) {
            let rgb = convertRgbTripletToRgbString(c.red, c.green, c.blue);
            colorReductionMap[rgb] = idx;
        });
    });

    return new ReducedColorPaletteImpl(palette, colorReductionMap);
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
    export function divide(colors: IColor[]): [] | [IColor[], IColor[]] {
        let cut = largestEdge(colors);
        let med = median(colors, cut);
        let r = divideBy(colors, cut, med);
        return r;
    }

    export function average(colors: IColor[]) {
        var sumR = 0
        var sumG = 0
        var sumB = 0
        colors.forEach((c) => {
            sumR += c.red;
            sumG += c.green;
            sumB += c.blue;
        });
        var size = colors.length;
        return {
            red: Math.floor(sumR/size),
            green: Math.floor(sumG/size),
            blue: Math.floor(sumB/size),
        };
    }

    function largestEdge(colors: IColor[]): RgbComponentName {
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

    function median(colors: IColor[], cutTargetColor: RgbComponentName): RgbComponentIntensity {
        var cc: RgbComponentIntensity[] = [];
        for (var i = 0, len = colors.length; i < len; ++i) {
            cc.push(colors[i][cutTargetColor]);
        }
        var med2 = selectKthElem(cc, Math.floor(cc.length / 2) + 1);
        return med2;
    }

    function divideBy(colors: IColor[], cutTargetColor: RgbComponentName, median: RgbComponentIntensity): [] | [IColor[], IColor[]] {
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
            return [list0, list1];
        } else {
            return [];
        }
    }
}

namespace MedianCut {
    export function medianCut(colors: IColor[], maxColor: number): IColor[][] {
        var divided = divideCubesUntil([colors], maxColor);
        return divided;
    }

    function divideCubesUntil(cubes: IColor[][], limit: number): IColor[][] {
        while (true) {
            if (cubes.length >= limit) break;
            var largestCube = getLargestCube(cubes);
            var dcubes = ColorCubes.divide(largestCube);
            if (dcubes.length < 2) break;
            cubes = cubes.filter(function (c) { return c !== largestCube }).concat(dcubes);
        }
        return cubes;
    }

    /**
     * @param cubes This must include one or more elements.
     */
    function getLargestCube(cubes: IColor[][]): IColor[] {
        var max: IColor[] | undefined;
        var maxCount = 0
        cubes.forEach((x) => {
            var cc = x.length;
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
