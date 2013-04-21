GifWriter.js
====================

GIF (version 89a) Encoder written in TypeScript

* [GIF89a spec](http://www.w3.org/Graphics/GIF/spec-gif89a.txt)

Requirements
------------------------------

To build GifWriter.js, following tools are needed:

* Build tool: [jake](https://npmjs.org/package/jake)
* TypeScript Compiler: [tsc](http://www.typescriptlang.org/#Download)

To run tests, following libraries are needed:

* Mocha: [mocha](http://visionmedia.github.com/mocha/)

These dependencies managed by [npm](https://npmjs.org/doc/README.html). (see: package.json)

Build and Test
------------------------------

Jake, the build tool for Node.js is used.

To build, execute:

````
$ jake
````

To run all tests available on command line interface:

````
$ jake test:all
````

To see all tasks:

````
$ jake --tasks
````

License
------------------------------

This software is published under The MIT License.
