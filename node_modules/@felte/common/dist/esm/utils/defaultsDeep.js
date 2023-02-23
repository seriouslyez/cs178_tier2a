import { _isPlainObject } from './isPlainObject.js';
import { _mergeWith } from './mergeWith.js';

function defaultsCustomizer(objValue, srcValue) {
    if (_isPlainObject(objValue) && _isPlainObject(srcValue))
        return;
    if (Array.isArray(srcValue)) {
        if (srcValue.some(_isPlainObject))
            return;
        const objArray = Array.isArray(objValue) ? objValue : [];
        return srcValue.map((value, index) => { var _a; return (_a = objArray[index]) !== null && _a !== void 0 ? _a : value; });
    }
    if (typeof objValue !== 'undefined')
        return objValue;
}
/** @ignore */
function _defaultsDeep(...args) {
    return _mergeWith(...args, defaultsCustomizer);
}

export { _defaultsDeep };
//# sourceMappingURL=defaultsDeep.js.map
