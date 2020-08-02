GifWriter.js
====================

[![Build Status](https://travis-ci.org/nobuoka/GifWriter.js.svg?branch=dev)](https://travis-ci.org/nobuoka/GifWriter.js)
[![CircleCI](https://circleci.com/gh/nobuoka/GifWriter.js.svg?style=svg)](https://circleci.com/gh/nobuoka/GifWriter.js)
[![codecov](https://codecov.io/gh/nobuoka/GifWriter.js/branch/dev/graph/badge.svg)](https://codecov.io/gh/nobuoka/GifWriter.js)

GIF (version 89a) Encoder written in TypeScript.

* [GIF89a spec](http://www.w3.org/Graphics/GIF/spec-gif89a.txt)

## For npm users

This library is published to npm repository as `gif-writer`.
Please see following page:

* [gif-writer](https://www.npmjs.com/package/gif-writer)

## For library developers

### Build system requirements

At first, you need to install Java Runtime Environment:

* [JRE](http://www.oracle.com/technetwork/java/javase/downloads/index.html).

### Build and Test

To build, execute:

````
$ ./gradlew assemble
````

To run all tests available on command line interface:

````
$ ./gradlew check
````

To see all tasks:

````
$ ./gradlew tasks
````

## License

This software is published under The MIT License.
