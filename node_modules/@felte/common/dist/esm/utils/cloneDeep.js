import { _isPlainObject } from './isPlainObject.js';

/** @ignore */
function _cloneDeep(obj) {
    return Object.keys(obj || {}).reduce((res, key) => (Object.assign(Object.assign({}, res), { [key]: _isPlainObject(obj[key])
            ? _cloneDeep(obj[key])
            : Array.isArray(obj[key])
                ? [...obj[key]]
                : obj[key] })), {});
}

export { _cloneDeep };
//# sourceMappingURL=cloneDeep.js.map
