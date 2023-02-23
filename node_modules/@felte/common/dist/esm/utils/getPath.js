import { isFormControl } from './typeGuards.js';

/**
 * @category Helper
 */
function getPath(el, name) {
    return name !== null && name !== void 0 ? name : (isFormControl(el) ? el.name : '');
}

export { getPath };
//# sourceMappingURL=getPath.js.map
