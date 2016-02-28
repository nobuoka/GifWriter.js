gif-writer
====================

GIF (version 89a) Encoder written in TypeScript.

* [GIF89a spec](http://www.w3.org/Graphics/GIF/spec-gif89a.txt)

This library provides both JavaScript modules and TypeScript declaration files (`.d.ts` files).

## Classes

Two fundamental classes are included.

* `GifWriter`
* `MedianCutColorReducer`

### `GifWriter`

The `GifWriter` class writes an indexed color image data to an output stream.

* An indexed color image data is represented with an object which has `IIndexedColorImage` interface.
  The `IndexedColorImage` implements this interface.
* An output stream is represented with an object which has `IOutputStream` interface.

### `MedianCutColorReducer`

`MedianCutColorReducer` is simple color quantizer.
It uses the median cut algorithm.
If you have a full color image data and you want to write it as GIF by using GifWriter,
you must do color quantization by using this class (or by other way) first.

## Example

The `gif-writer` project provides a subproject to show how to use this module.
Please see it.

* [Example of `gif-writer` module for Node.js application](https://github.com/nobuoka/GifWriter.js/tree/master/demo/node)
