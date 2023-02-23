function debounce(func, timeout, { onInit, onEnd } = {}) {
    let timer;
    return (...args) => {
        if (!timer)
            onInit === null || onInit === void 0 ? void 0 : onInit();
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
            timer = undefined;
            onEnd === null || onEnd === void 0 ? void 0 : onEnd();
        }, timeout);
    };
}

export { debounce };
//# sourceMappingURL=debounce.js.map
