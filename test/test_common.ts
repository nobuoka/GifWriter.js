declare var require;
declare var test;
declare var suite;

var assert = require("assert");
var t = {
    module: suite,
    test: test,
    testAsync: function (description, testFunc) {
        test(description, testFunc);
    },
    equal:    assert.equal,
    notEqual: assert.notEqual,
    deepEqual:    assert.deepEqual,
    notDeepEqual: assert.notDeepEqual,
    strictEqual:    assert.strictEqual,
    notStrictEqual: assert.notStrictEqual,
    ok: assert.ok,
    throws: assert.throws,
};
