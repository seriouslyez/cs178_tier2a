import { _cloneDeep } from './cloneDeep.js';
import { _isPlainObject } from './isPlainObject.js';

/** @ignore */
function _update(obj, path, updater) {
    if (obj)
        obj = _cloneDeep(obj);
    if (!_isPlainObject(obj))
        obj = {};
    const splitPath = !Array.isArray(path) ? path.match(/[^.[\]]+/g) || [] : path;
    const lastSection = splitPath[splitPath.length - 1];
    if (!lastSection)
        return obj;
    let property = obj;
    for (let i = 0; i < splitPath.length - 1; i++) {
        const section = splitPath[i];
        if (!property[section] ||
            (!_isPlainObject(property[section]) && !Array.isArray(property[section]))) {
            const nextSection = splitPath[i + 1];
            if (isNaN(Number(nextSection))) {
                property[section] = {};
            }
            else {
                property[section] = [];
            }
        }
        property = property[section];
    }
    property[lastSection] = updater(property[lastSection]);
    return obj;
}

export { _update };
//# sourceMappingURL=update.js.map
