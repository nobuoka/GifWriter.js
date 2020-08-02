import {selectKthElem} from "./Selection";
import t from "./__test__/test_common";

t.testAsync("Ordered list", (done) => {
    let list = [1,2,3,4,5,6,7,8,9];
    for (let i = 1; i < 10; i++) {
        let selected = selectKthElem(list, i);
        t.strictEqual(selected, i);
    }
    done();
});

t.testAsync("Unordered list", (done) => {
    let list = [4,8,2,9,7,1,5,3,6];
    for (let i = 1; i < 10; i++) {
        let selected = selectKthElem(list, i);
        t.strictEqual(selected, i);
    }
    done();
});
