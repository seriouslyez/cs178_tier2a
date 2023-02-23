/** @ignore */
function _mapValues(obj, updater) {
    const keys = Object.keys(obj || {});
    return keys.reduce((acc, key) => (Object.assign(Object.assign({}, acc), { [key]: updater(obj[key]) })), {});
}

export { _mapValues };
//# sourceMappingURL=mapValues.js.map
