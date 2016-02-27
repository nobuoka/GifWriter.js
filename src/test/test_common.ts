declare var require: (module: string) => any;
declare var test: (desc: string, testFunc?: (done: () => void) => void) => void;
declare var suite: (name: string) => void;

var assert = require("assert");
export default {
    module: suite,
    test: test,
    testAsync: function (description: string, testFunc: (done: () => void) => void) {
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
