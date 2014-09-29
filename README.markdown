GifWriter.js
====================

[![Build Status](https://travis-ci.org/nobuoka/GifWriter.js.svg?branch=dev)](https://travis-ci.org/nobuoka/GifWriter.js)

GIF (version 89a) Encoder written in TypeScript

* [GIF89a spec](http://www.w3.org/Graphics/GIF/spec-gif89a.txt)

Requirements
------------------------------

At first, you need to install following tools:

* [npm](https://npmjs.org/doc/README.html).

Then, you can install dependencies:

```
$ npm install
```

Build and Test
------------------------------

To build, execute:

````
$ PATH=`npm bin`:$PATH gulp build:normal
````

To run all tests available on command line interface:

````
$ PATH=`npm bin`:$PATH gulp test:all
````

To see all tasks:

````
$ PATH=`npm bin`:$PATH gulp --tasks
````

License
------------------------------

This software is published under The MIT License.
