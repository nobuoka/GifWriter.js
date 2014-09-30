var gulp = require('gulp');
var newer = require('gulp-newer');
var typescript = require('gulp-tsc');
var mocha = require('gulp-mocha');

var path = require("path");

var builtDirectory = "built";
var builtLocalDirectory = path.join(builtDirectory, "local");
var builtTestDirectory = path.join(builtDirectory, "localtest");

// default task: build GifWriter.js (build:normal)
gulp.task('default', ['build:normal']);

// build GifWriter.js
gulp.task('build:normal', function (){
  var outFileName = "GifWriter.js";
  return gulp.src(['src/**/*.ts'])
      .pipe(newer(path.join(builtLocalDirectory, outFileName)))
      .pipe(typescript({ out: outFileName, noImplicitAny: true, removeComments: true }))
      .pipe(gulp.dest(builtLocalDirectory));
});

// build js for internal tests with mocha
gulp.task('build:tests', function (){
  var outFileName = "tests.js";
  return gulp.src(['src/**/*.ts', 'test/**/*.ts'])
      .pipe(newer(path.join(builtTestDirectory, outFileName)))
      .pipe(typescript({ out: outFileName, noImplicitAny: true, removeComments: true }))
      .pipe(gulp.dest(builtTestDirectory));
});

// run all tests
gulp.task('test:all', ['test:with_mocha']);

// run internal tests with mocha
gulp.task('test:with_mocha', ['build:tests'], function () {
  return gulp.src(path.join(builtTestDirectory, "tests.js"), { read: false })
      .pipe(mocha({ ui: 'qunit', reporter: 'tap' }));
});
