import { _isPlainObject } from './isPlainObject.js';
import { _get } from './get.js';

function getValue(storeValue, selectorOrPath) {
    if (!_isPlainObject(storeValue) || !selectorOrPath)
        return storeValue;
    if (typeof selectorOrPath === 'string') {
        return _get(storeValue, selectorOrPath);
    }
    return selectorOrPath(storeValue);
}

export { getValue };
//# sourceMappingURL=getValue.js.map
