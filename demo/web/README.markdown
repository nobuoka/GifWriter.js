Example of `gif-writer` module for web browser
============================================================

## Example to create a Animation Gif on Web Browser

This project shows how to use `GifWriter` class and `MedianCutColorReducer` class
in a [Web Worker](https://html.spec.whatwg.org/multipage/workers.html).

* Worker script : [web-worker.ts](./src/ts/web-worker.ts)
* Script using worker : [main.ts](./src/ts/main.ts)

### Example page

* [gif-writer — GIF Encoder](https://nobuoka.github.io/GifWriter.js/)

## How to build

To build web pages, use following command:

```
../../gradlew assemble
```

Then, the built files are output to the `./build/gh-pages` directory.

To commit the built files to `gh-pages` branch, use following command:

```
../../gradlew commitToGhPagesBranch
```
