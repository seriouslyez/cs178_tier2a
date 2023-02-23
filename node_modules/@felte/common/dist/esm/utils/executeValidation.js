import { _mergeWith } from './mergeWith.js';
import { _isPlainObject } from './isPlainObject.js';

function executeCustomizer(objValue, srcValue) {
    if (_isPlainObject(objValue) || _isPlainObject(srcValue))
        return;
    if (objValue === null || objValue === '')
        return srcValue;
    if (srcValue === null || srcValue === '')
        return objValue;
    if (!srcValue)
        return objValue;
    if (!objValue || !srcValue)
        return;
    if (Array.isArray(objValue)) {
        if (!Array.isArray(srcValue))
            return [...objValue, srcValue];
        const newErrors = [];
        const errLength = Math.max(srcValue.length, objValue.length);
        for (let i = 0; i < errLength; i++) {
            let obj = objValue[i];
            let src = srcValue[i];
            if (!_isPlainObject(obj) && !_isPlainObject(src)) {
                if (!Array.isArray(obj))
                    obj = [obj];
                if (!Array.isArray(src))
                    src = [src];
                newErrors.push(...obj, ...src);
            }
            else {
                newErrors.push(mergeErrors([obj !== null && obj !== void 0 ? obj : {}, src !== null && src !== void 0 ? src : {}]));
            }
        }
        return newErrors.filter(Boolean);
    }
    if (!Array.isArray(srcValue))
        srcValue = [srcValue];
    return [objValue, ...srcValue]
        .reduce((acc, value) => acc.concat(value), [])
        .filter(Boolean);
}
function mergeErrors(errors) {
    const merged = _mergeWith(...errors, executeCustomizer);
    return merged;
}
function runValidations(values, validationOrValidations) {
    if (!validationOrValidations)
        return [];
    const validations = Array.isArray(validationOrValidations)
        ? validationOrValidations
        : [validationOrValidations];
    return validations.map((v) => v(values));
}

export { mergeErrors, runValidations };
//# sourceMappingURL=executeValidation.js.map
