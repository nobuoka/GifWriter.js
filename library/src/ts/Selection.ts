/**
 * Find the k-th smallest number in a list.
 * @param list Target list.
 * @param k Number of Target element.
 */
export function selectKthElem(list: number[], k: number): number {
    return selectKthElemWithRange(list, 0, list.length - 1, k);
}

/**
 * @see https://en.wikipedia.org/wiki/Selection_algorithm
 */
function selectKthElemWithRange(list: number[], left: number, right: number, k: number): number {
    while (true) {
        // select pivotIndex between left and right
        var pivotIndex = Math.floor((right + left) / 2);
        var pivotNewIndex = partition(list, left, right, pivotIndex);
        var pivotDist = pivotNewIndex - left + 1;
        if (k === pivotDist) {
            return list[pivotNewIndex];
        } else if (k < pivotDist) {
            right = pivotNewIndex - 1;
        } else {
            k = k - pivotDist;
            left = pivotNewIndex + 1;
        }
    }
}

function swap(array: number[], idx1: number, idx2: number) {
    var tmp = array[idx1];
    array[idx1] = array[idx2];
    array[idx2] = tmp;
}

function partition(a: number[], left: number, right: number, pivotIndex: number) {
    var pivotValue = a[pivotIndex];
    swap(a, pivotIndex, right);
    var storeIndex = left;
    for (var i = left; i < right; ++i) {
        if (a[i] <= pivotValue) {
            swap(a, storeIndex, i);
            storeIndex = storeIndex + 1;
        }
    }
    swap(a, right, storeIndex);
    return storeIndex
}
