/** @ignore */
function _some(obj, pred) {
    const keys = Object.keys(obj);
    return keys.some((key) => pred(obj[key]));
}

export { _some };
//# sourceMappingURL=some.js.map
