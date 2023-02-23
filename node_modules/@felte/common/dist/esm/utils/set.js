import { _update } from './update.js';

/** @ignore */
function _set(obj, path, value) {
    return _update(obj, path, () => value);
}

export { _set };
//# sourceMappingURL=set.js.map
