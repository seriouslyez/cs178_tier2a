/**
 * @category Helper
 */
function shouldIgnore(el) {
    let parent = el;
    while (parent && parent.nodeName !== 'FORM') {
        if (parent.hasAttribute('data-felte-ignore'))
            return true;
        parent = parent.parentElement;
    }
    return false;
}

export { shouldIgnore };
//# sourceMappingURL=shouldIgnore.js.map
