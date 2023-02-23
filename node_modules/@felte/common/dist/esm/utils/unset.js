import { _cloneDeep } from './cloneDeep.js';
import { _get } from './get.js';

function _unset(obj, path) {
    if (!obj || Object(obj) !== obj)
        return;
    // When obj is not an object
    else if (typeof obj !== 'undefined')
        obj = _cloneDeep(obj);
    // If not yet an array, get the keys from the string-path
    const newPath = !Array.isArray(path)
        ? path.toString().match(/[^.[\]]+/g) || []
        : path;
    const foundProp = newPath.length === 1 ? obj : _get(obj, newPath.slice(0, -1).join('.'));
    if (Array.isArray(foundProp)) {
        foundProp.splice(Number(newPath[newPath.length - 1]), 1);
    }
    else {
        foundProp === null || foundProp === void 0 ? true : delete foundProp[newPath[newPath.length - 1]];
    }
    return obj;
}

export { _unset };
//# sourceMappingURL=unset.js.map
