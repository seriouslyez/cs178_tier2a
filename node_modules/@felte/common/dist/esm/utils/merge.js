import { _mergeWith } from './mergeWith.js';

/** @ignore */
function _merge(...args) {
    return _mergeWith(...args, () => undefined);
}

export { _merge };
//# sourceMappingURL=merge.js.map
