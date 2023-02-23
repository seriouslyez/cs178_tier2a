import { _some } from './some.js';
import { _isPlainObject } from './isPlainObject.js';

/**
 * @category Helper
 */
function deepSome(obj, pred) {
    return _some(obj, (value) => _isPlainObject(value)
        ? deepSome(value, pred)
        : Array.isArray(value)
            ? value.length === 0 || value.every((v) => typeof v === 'string')
                ? pred(value)
                : value.some((v) => _isPlainObject(v) ? deepSome(v, pred) : pred(v))
            : pred(value));
}

export { deepSome };
//# sourceMappingURL=deepSome.js.map
