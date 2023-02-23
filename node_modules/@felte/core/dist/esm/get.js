function subscribe(store, ...callbacks) {
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get(store) {
    let value = undefined;
    subscribe(store, (_) => (value = _))();
    return value;
}

export { get };
//# sourceMappingURL=get.js.map
