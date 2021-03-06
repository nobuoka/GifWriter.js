import {MedianCutColorReducer} from "./MedianCutColorReducer";
import t from "./__test__/test_common";

function indexToColorArray(paletteData: number[], index: number): [number, number, number] {
    return [paletteData[index*3+0],paletteData[index*3+1],paletteData[index*3+2]];
}

t.testAsync("2 colors to 2 colors", (done) => {
    var imageData = {
        width: 2,
        height: 2,
        data: [
            0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,
            0xFF,0xFF,0xFF,0x00, 0xFF,0xFF,0xFF,0x00,
        ],
    };
    var reducer = new MedianCutColorReducer(imageData, 2);
    var paletteData = reducer.process();
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0x00,0x00,0x00)), [0x00,0x00,0x00],
        "Black is mapped to black");
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0xFF,0xFF,0xFF)), [0xFF,0xFF,0xFF],
        "White is mapped to white");
    done();
});

t.testAsync("`Uint8CrampedArray` object can be used as image data.", (done) => {
    var imageData: ImageData = {
        width: 2,
        height: 2,
        data: Uint8ClampedArray.from([
            0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,
            0xFF,0xFF,0xFF,0x00, 0xFF,0xFF,0xFF,0x00,
        ]),
    };
    var reducer = new MedianCutColorReducer(imageData, 2);
    var paletteData = reducer.process();
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0x00,0x00,0x00)), [0x00,0x00,0x00],
        "Black is mapped to black");
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0xFF,0xFF,0xFF)), [0xFF,0xFF,0xFF],
        "White is mapped to white");
    done();
});

t.testAsync("2 colors to 2 colors (4 colors max)", (done) => {
    var imageData = {
        width: 2,
        height: 2,
        data: [
            0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,
            0xFF,0xFF,0xFF,0x00, 0xFF,0xFF,0xFF,0x00,
        ],
    };
    var reducer = new MedianCutColorReducer(imageData, 4);
    var paletteData = reducer.process();
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0x00,0x00,0x00)), [0x00,0x00,0x00],
        "Black is mapped to black");
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0xFF,0xFF,0xFF)), [0xFF,0xFF,0xFF],
        "White is mapped to white");
    done();
});

t.testAsync("3 colors to 2 colors", (done) => {
    var imageData = {
        width: 2,
        height: 2,
        data: [
            0x00,0x00,0x00,0x00, 0x20,0x00,0x00,0x00,
            0x10,0x00,0x00,0x00, 0xFF,0x00,0x00,0x00,
        ],
    };
    var reducer = new MedianCutColorReducer(imageData, 2);
    var paletteData = reducer.process();
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0x00,0x00,0x00)), [0x08,0x00,0x00],
        "Black is mapped to #080000");
    t.deepEqual(indexToColorArray(paletteData, reducer.map(0xFF,0x00,0x00)), [0x8F,0x00,0x00],
        "Red is mapped to #8F0000");
    done();
});

t.testAsync("The `map` method returns -1 when `process` method was not called", (done) => {
    var imageData = {
        width: 2,
        height: 2,
        data: [
            0x00,0x00,0x00,0x00, 0x20,0x00,0x00,0x00,
            0x10,0x00,0x00,0x00, 0xFF,0x00,0x00,0x00,
        ],
    };
    var reducer = new MedianCutColorReducer(imageData, 2);
    let value = reducer.map(0x00,0x00,0x00);
    t.strictEqual(value, -1);
    done();
});
