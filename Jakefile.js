// commands
var CMD = {
    TSC: process.env.TSC || "tsc",
    MOCHA: process.env.MOCHA || "mocha",
}

var path = require("path");

var builtDirectory = "built/";
var builtLocalDirectory = "built/local/";
var builtTestDirectory = "built/localtest/";

desc("default task: build GifWriter.js (build:normal)");
task("default", ["build:normal"]);

namespace("test", function () {
  desc("run all tests");
  task("all", ["test:with_mocha"]);

  desc("run internal tests with mocha");
  task("with_mocha", ["build:tests"], function () {
      var cmd = CMD.MOCHA + " --ui qunit -R tap " + path.join(builtTestDirectory, "tests.js");
      jake.exec(cmd, function () {
          console.log("pass tests with mocha");
          complete();
      }, {printStdout: true, printErrout: true});
  });
});

namespace("build", function () {
  desc("build GifWriter.js");
  task("normal", [path.join(builtLocalDirectory, "GifWriter.js")]);

  desc("build js for internal tests with mocha");
  task("tests", [path.join(builtTestDirectory, "tests.js")]);
});

directory(builtDirectory);
directory(builtLocalDirectory);

function _execCompileCmd(cmd, successMsg) {
    jake.exec(cmd, function () {
        console.log(successMsg);
        complete();
    }, {printStdout: true});
}

var SRC = {
    MAIN: "src/GifWriter.ts",
};

(function () {
var targetFilePath = path.join(builtLocalDirectory, "GifWriter.js");
file(targetFilePath, [builtDirectory, builtLocalDirectory, SRC.MAIN], function () {
    var cmd =
        [ CMD.TSC,
          SRC.MAIN,
          "--out " + targetFilePath,
        ].join(" ");
    _execCompileCmd(cmd, targetFilePath + " built!");
}, {async: true});
}).call(this);


var SRC_TEST = {
    TESTS: [
        "test/test_common.ts",
        "test/GifWriterTest.ts",
    ]
};

directory(builtTestDirectory);

(function () {
var targetFilePath = path.join(builtTestDirectory, "tests.js");
var srcFilePaths = [ SRC.MAIN ].concat(SRC_TEST.TESTS);
file(targetFilePath, [builtDirectory, builtTestDirectory].concat(srcFilePaths), function () {
    var cmd = [].
        concat([ CMD.TSC ]).
        concat(  srcFilePaths ).
        concat([ "--out " + targetFilePath ]).
        join(" ");
    _execCompileCmd(cmd, targetFilePath + " built!");
}, {async: true});
}).call(this);
