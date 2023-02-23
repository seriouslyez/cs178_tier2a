/**
 * @category Helper
 */
function isInputElement(el) {
    return (el === null || el === void 0 ? void 0 : el.nodeName) === 'INPUT';
}
/**
 * @category Helper
 */
function isTextAreaElement(el) {
    return (el === null || el === void 0 ? void 0 : el.nodeName) === 'TEXTAREA';
}
/**
 * @category Helper
 */
function isSelectElement(el) {
    return (el === null || el === void 0 ? void 0 : el.nodeName) === 'SELECT';
}
/**
 * @category Helper
 */
function isFieldSetElement(el) {
    return (el === null || el === void 0 ? void 0 : el.nodeName) === 'FIELDSET';
}
/**
 * @category Helper
 */
function isFormControl(el) {
    return isInputElement(el) || isTextAreaElement(el) || isSelectElement(el);
}
/**
 * @category Helper
 */
function isElement(el) {
    return el.nodeType === Node.ELEMENT_NODE;
}

export { isElement, isFieldSetElement, isFormControl, isInputElement, isSelectElement, isTextAreaElement };
//# sourceMappingURL=typeGuards.js.map
