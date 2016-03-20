module.exports = {
    entry: {
        "main": "./build/typescript/main.js",
        "web-worker": "./build/typescript/web-worker.js",
    },
    output: {
        path: "build/webpack/",
        filename: "[name].bundle.js",
    },
};
