
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function subscribe$1(store, ...callbacks) {
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get(store) {
        let value = undefined;
        subscribe$1(store, (_) => (value = _))();
        return value;
    }

    class FelteSubmitError extends Error {
        constructor(message, response) {
            super(message);
            this.name = 'FelteSubmitError';
            this.response = response;
        }
    }

    /** @ignore */
    function _some(obj, pred) {
        const keys = Object.keys(obj);
        return keys.some((key) => pred(obj[key]));
    }

    /** @ignore */
    function _mapValues(obj, updater) {
        const keys = Object.keys(obj || {});
        return keys.reduce((acc, key) => (Object.assign(Object.assign({}, acc), { [key]: updater(obj[key]) })), {});
    }

    /** @ignore */
    function _isPlainObject(value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    /** @ignore */
    function _cloneDeep(obj) {
        return Object.keys(obj || {}).reduce((res, key) => (Object.assign(Object.assign({}, res), { [key]: _isPlainObject(obj[key])
                ? _cloneDeep(obj[key])
                : Array.isArray(obj[key])
                    ? [...obj[key]]
                    : obj[key] })), {});
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function handleArray(value) {
        return function (propVal) {
            if (_isPlainObject(propVal)) {
                const _a = deepSet(propVal, value), field = __rest(_a, ["key"]);
                return field;
            }
            return value;
        };
    }
    /**
     * @category Helper
     */
    function deepSet(obj, value) {
        return _mapValues(obj, (prop) => _isPlainObject(prop)
            ? deepSet(prop, value)
            : Array.isArray(prop)
                ? prop.map(handleArray(value))
                : value);
    }

    /** @ignore */
    function _mergeWith(...args) {
        const customizer = args.pop();
        const _obj = args.shift();
        if (typeof _obj === "string")
            return _obj;
        const obj = _cloneDeep(_obj);
        if (args.length === 0)
            return obj;
        for (const source of args) {
            if (!source)
                continue;
            if (typeof source === "string")
                return source;
            let rsValue = customizer(obj, source);
            if (typeof rsValue !== 'undefined')
                return rsValue;
            const keys = Array.from(new Set(Object.keys(obj).concat(Object.keys(source))));
            for (const key of keys) {
                rsValue = customizer(obj[key], source[key]);
                if (typeof rsValue !== 'undefined') {
                    obj[key] = rsValue;
                }
                else if (_isPlainObject(source[key]) && _isPlainObject(obj[key])) {
                    obj[key] = _mergeWith(obj[key], source[key], customizer);
                }
                else if (Array.isArray(source[key])) {
                    obj[key] = source[key].map((val, i) => {
                        if (!_isPlainObject(val))
                            return val;
                        const newObj = Array.isArray(obj[key]) ? obj[key][i] : obj[key];
                        return _mergeWith(newObj, val, customizer);
                    });
                }
                else if (_isPlainObject(source[key])) {
                    const defaultObj = deepSet(_cloneDeep(source[key]), undefined);
                    obj[key] = _mergeWith(defaultObj, source[key], customizer);
                }
                else if (typeof source[key] !== 'undefined') {
                    obj[key] = source[key];
                }
            }
        }
        return obj;
    }

    function defaultsCustomizer(objValue, srcValue) {
        if (_isPlainObject(objValue) && _isPlainObject(srcValue))
            return;
        if (Array.isArray(srcValue)) {
            if (srcValue.some(_isPlainObject))
                return;
            const objArray = Array.isArray(objValue) ? objValue : [];
            return srcValue.map((value, index) => { var _a; return (_a = objArray[index]) !== null && _a !== void 0 ? _a : value; });
        }
        if (typeof objValue !== 'undefined')
            return objValue;
    }
    /** @ignore */
    function _defaultsDeep(...args) {
        return _mergeWith(...args, defaultsCustomizer);
    }

    /** @ignore */
    function _merge(...args) {
        return _mergeWith(...args, () => undefined);
    }

    /* From: https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_get */
    /** @ignore */
    function _get(obj, path, defaultValue) {
        const travel = (regexp) => String.prototype.split
            .call(path, regexp)
            .filter(Boolean)
            .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
        const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
        return result === undefined || result === obj ? defaultValue : result;
    }

    /** @ignore */
    function _update(obj, path, updater) {
        if (obj)
            obj = _cloneDeep(obj);
        if (!_isPlainObject(obj))
            obj = {};
        const splitPath = !Array.isArray(path) ? path.match(/[^.[\]]+/g) || [] : path;
        const lastSection = splitPath[splitPath.length - 1];
        if (!lastSection)
            return obj;
        let property = obj;
        for (let i = 0; i < splitPath.length - 1; i++) {
            const section = splitPath[i];
            if (!property[section] ||
                (!_isPlainObject(property[section]) && !Array.isArray(property[section]))) {
                const nextSection = splitPath[i + 1];
                if (isNaN(Number(nextSection))) {
                    property[section] = {};
                }
                else {
                    property[section] = [];
                }
            }
            property = property[section];
        }
        property[lastSection] = updater(property[lastSection]);
        return obj;
    }

    /** @ignore */
    function _set(obj, path, value) {
        return _update(obj, path, () => value);
    }

    function _unset(obj, path) {
        if (!obj || Object(obj) !== obj)
            return;
        // When obj is not an object
        else if (typeof obj !== 'undefined')
            obj = _cloneDeep(obj);
        // If not yet an array, get the keys from the string-path
        const newPath = !Array.isArray(path)
            ? path.toString().match(/[^.[\]]+/g) || []
            : path;
        const foundProp = newPath.length === 1 ? obj : _get(obj, newPath.slice(0, -1).join('.'));
        if (Array.isArray(foundProp)) {
            foundProp.splice(Number(newPath[newPath.length - 1]), 1);
        }
        else {
            foundProp === null || foundProp === void 0 ? true : delete foundProp[newPath[newPath.length - 1]];
        }
        return obj;
    }

    /**
     * @category Helper
     */
    function deepSome(obj, pred) {
        return _some(obj, (value) => _isPlainObject(value)
            ? deepSome(value, pred)
            : Array.isArray(value)
                ? value.length === 0 || value.every((v) => typeof v === 'string')
                    ? pred(value)
                    : value.some((v) => _isPlainObject(v) ? deepSome(v, pred) : pred(v))
                : pred(value));
    }

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

    /**
     * @category Helper
     */
    function getPath(el, name) {
        return name !== null && name !== void 0 ? name : (isFormControl(el) ? el.name : '');
    }

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

    function executeTransforms(values, transforms) {
        if (!transforms)
            return values;
        if (!Array.isArray(transforms))
            return transforms(values);
        return transforms.reduce((res, t) => t(res), values);
    }

    function createId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for (let i = 0; i < length; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    }

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

    /**
     * @ignore
     */
    function getFormControls(el) {
        if (isFormControl(el))
            return [el];
        if (el.childElementCount === 0)
            return [];
        const foundControls = new Set();
        for (const child of el.children) {
            if (isFormControl(child))
                foundControls.add(child);
            if (isFieldSetElement(child)) {
                for (const fieldsetChild of child.elements) {
                    if (isFormControl(fieldsetChild))
                        foundControls.add(fieldsetChild);
                }
            }
            if (child.childElementCount > 0)
                getFormControls(child).forEach((value) => foundControls.add(value));
        }
        return Array.from(foundControls);
    }
    /**
     * @ignore
     */
    function addAttrsFromFieldset(fieldSet) {
        for (const element of fieldSet.elements) {
            if (!isFormControl(element) && !isFieldSetElement(element))
                continue;
            if (fieldSet.hasAttribute('data-felte-keep-on-remove') &&
                !element.hasAttribute('data-felte-keep-on-remove')) {
                element.dataset.felteKeepOnRemove = fieldSet.dataset.felteKeepOnRemove;
            }
        }
    }
    /** @ignore */
    function getInputTextOrNumber(el) {
        if (el.type.match(/^(number|range)$/)) {
            return !el.value ? undefined : +el.value;
        }
        else {
            return el.value;
        }
    }
    /**
     * @ignore
     */
    function getFormDefaultValues(node) {
        var _a;
        let defaultData = {};
        let defaultTouched = {};
        for (const el of node.elements) {
            if (isFieldSetElement(el))
                addAttrsFromFieldset(el);
            if (!isFormControl(el) || !el.name)
                continue;
            const elName = getPath(el);
            if (isInputElement(el)) {
                if (el.type === 'checkbox') {
                    if (typeof _get(defaultData, elName) === 'undefined') {
                        const checkboxes = Array.from(node.querySelectorAll(`[name="${el.name}"]`)).filter((checkbox) => {
                            if (!isFormControl(checkbox))
                                return false;
                            return elName === getPath(checkbox);
                        });
                        if (checkboxes.length === 1) {
                            defaultData = _set(defaultData, elName, el.checked);
                            defaultTouched = _set(defaultTouched, elName, false);
                            continue;
                        }
                        defaultData = _set(defaultData, elName, el.checked ? [el.value] : []);
                        defaultTouched = _set(defaultTouched, elName, false);
                        continue;
                    }
                    if (Array.isArray(_get(defaultData, elName)) && el.checked) {
                        defaultData = _update(defaultData, elName, (value) => [
                            ...value,
                            el.value,
                        ]);
                    }
                    continue;
                }
                if (el.type === 'radio') {
                    if (_get(defaultData, elName))
                        continue;
                    defaultData = _set(defaultData, elName, el.checked ? el.value : undefined);
                    defaultTouched = _set(defaultTouched, elName, false);
                    continue;
                }
                if (el.type === 'file') {
                    defaultData = _set(defaultData, elName, el.multiple ? Array.from(el.files || []) : (_a = el.files) === null || _a === void 0 ? void 0 : _a[0]);
                    defaultTouched = _set(defaultTouched, elName, false);
                    continue;
                }
            }
            else if (isSelectElement(el)) {
                const multiple = el.multiple;
                if (!multiple) {
                    defaultData = _set(defaultData, elName, el.value);
                }
                else {
                    const selectedOptions = Array.from(el.options)
                        .filter((opt) => opt.selected)
                        .map((opt) => opt.value);
                    defaultData = _set(defaultData, elName, selectedOptions);
                }
                defaultTouched = _set(defaultTouched, elName, false);
                continue;
            }
            const inputValue = getInputTextOrNumber(el);
            defaultData = _set(defaultData, elName, inputValue);
            defaultTouched = _set(defaultTouched, elName, false);
        }
        return { defaultData, defaultTouched };
    }
    function setControlValue(el, value) {
        var _a;
        if (!isFormControl(el))
            return;
        const fieldValue = value;
        if (isInputElement(el)) {
            if (el.type === 'checkbox') {
                const checkboxesDefaultData = fieldValue;
                if (typeof checkboxesDefaultData === 'undefined' ||
                    typeof checkboxesDefaultData === 'boolean') {
                    el.checked = !!checkboxesDefaultData;
                    return;
                }
                if (Array.isArray(checkboxesDefaultData)) {
                    if (checkboxesDefaultData.includes(el.value)) {
                        el.checked = true;
                    }
                    else {
                        el.checked = false;
                    }
                }
                return;
            }
            if (el.type === 'radio') {
                const radioValue = fieldValue;
                if (el.value === radioValue)
                    el.checked = true;
                else
                    el.checked = false;
                return;
            }
            if (el.type === 'file') {
                el.files = null;
                el.value = '';
                return;
            }
        }
        else if (isSelectElement(el)) {
            const multiple = el.multiple;
            if (!multiple) {
                el.value = String(fieldValue !== null && fieldValue !== void 0 ? fieldValue : '');
                for (const option of el.options) {
                    if (option.value === String(fieldValue)) {
                        option.selected = true;
                    }
                    else {
                        option.selected = false;
                    }
                }
            }
            else if (Array.isArray(fieldValue)) {
                el.value = String((_a = fieldValue[0]) !== null && _a !== void 0 ? _a : '');
                const stringValues = fieldValue.map((v) => String(v));
                for (const option of el.options) {
                    if (stringValues.includes(option.value)) {
                        option.selected = true;
                    }
                    else {
                        option.selected = false;
                    }
                }
            }
            return;
        }
        el.value = String(fieldValue !== null && fieldValue !== void 0 ? fieldValue : '');
    }
    /** Sets the form inputs value to match the data object provided. */
    function setForm(node, data) {
        for (const el of node.elements) {
            if (isFieldSetElement(el))
                addAttrsFromFieldset(el);
            if (!isFormControl(el) || !el.name)
                continue;
            const elName = getPath(el);
            setControlValue(el, _get(data, elName));
        }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest$1(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function deepSetTouched(obj, value) {
        return _mapValues(obj, (prop) => {
            if (_isPlainObject(prop))
                return deepSetTouched(prop, value);
            if (Array.isArray(prop)) {
                if (prop.length === 0 || prop.every((p) => typeof p === 'string'))
                    return value;
                return prop.map((p) => {
                    const _a = deepSetTouched(p, value), field = __rest$1(_a, ["key"]);
                    return field;
                });
            }
            return value;
        });
    }

    function deepSetKey(obj) {
        if (!obj)
            return {};
        return _mapValues(obj, (prop) => {
            if (_isPlainObject(prop))
                return deepSetKey(prop);
            if (Array.isArray(prop)) {
                if (prop.length === 0 || prop.every((p) => typeof p === 'string'))
                    return prop;
                return prop.map((p) => {
                    if (!_isPlainObject(p))
                        return p;
                    const field = deepSetKey(p);
                    if (!field.key)
                        field.key = createId();
                    return field;
                });
            }
            return prop;
        });
    }
    function deepRemoveKey(obj) {
        if (!obj)
            return {};
        return _mapValues(obj, (prop) => {
            if (_isPlainObject(prop))
                return deepSetKey(prop);
            if (Array.isArray(prop)) {
                if (prop.length === 0 || prop.every((p) => typeof p === 'string'))
                    return prop;
                return prop.map((p) => {
                    if (!_isPlainObject(p))
                        return p;
                    const _a = deepSetKey(p), field = __rest$1(_a, ["key"]);
                    return field;
                });
            }
            return prop;
        });
    }

    function createEventConstructors() {
        class SuccessEvent extends CustomEvent {
            constructor(detail) {
                super('feltesuccess', { detail });
            }
        }
        class ErrorEvent extends CustomEvent {
            constructor(detail) {
                super('felteerror', { detail, cancelable: true });
            }
            setErrors(errors) {
                this.preventDefault();
                this.errors = errors;
            }
        }
        class SubmitEvent extends Event {
            constructor() {
                super('feltesubmit', { cancelable: true });
            }
            handleSubmit(onSubmit) {
                this.onSubmit = onSubmit;
            }
            handleError(onError) {
                this.onError = onError;
            }
            handleSuccess(onSuccess) {
                this.onSuccess = onSuccess;
            }
        }
        return {
            createErrorEvent: (detail) => new ErrorEvent(detail),
            createSubmitEvent: () => new SubmitEvent(),
            createSuccessEvent: (detail) => new SuccessEvent(detail),
        };
    }

    function createDefaultSubmitHandler(form) {
        if (!form)
            return;
        return async function onSubmit() {
            let body = new FormData(form);
            const action = new URL(form.action);
            const method = form.method.toLowerCase() === 'get'
                ? 'get'
                : action.searchParams.get('_method') || form.method;
            let enctype = form.enctype;
            if (form.querySelector('input[type="file"]')) {
                enctype = 'multipart/form-data';
            }
            if (method === 'get' || enctype === 'application/x-www-form-urlencoded') {
                body = new URLSearchParams(body);
            }
            let fetchOptions;
            if (method === 'get') {
                body.forEach((value, key) => {
                    action.searchParams.append(key, value);
                });
                fetchOptions = { method, headers: { Accept: 'application/json' } };
            }
            else {
                fetchOptions = {
                    method,
                    body,
                    headers: Object.assign(Object.assign({}, (enctype !== 'multipart/form-data' && {
                        'Content-Type': enctype,
                    })), { Accept: 'application/json' }),
                };
            }
            const response = await window.fetch(action.toString(), fetchOptions);
            if (response.ok)
                return response;
            throw new FelteSubmitError('An error occurred while submitting the form', response);
        };
    }

    function addAtIndex(storeValue, path, value, index) {
        return _update(storeValue, path, (oldValue) => {
            if (typeof oldValue !== 'undefined' && !Array.isArray(oldValue))
                return oldValue;
            if (!oldValue)
                oldValue = [];
            if (typeof index === 'undefined') {
                oldValue.push(value);
            }
            else {
                oldValue.splice(index, 0, value);
            }
            return oldValue;
        });
    }
    function swapInArray(storeValue, path, from, to) {
        return _update(storeValue, path, (oldValue) => {
            if (!oldValue || !Array.isArray(oldValue))
                return oldValue;
            [oldValue[from], oldValue[to]] = [oldValue[to], oldValue[from]];
            return oldValue;
        });
    }
    function moveInArray(storeValue, path, from, to) {
        return _update(storeValue, path, (oldValue) => {
            if (!oldValue || !Array.isArray(oldValue))
                return oldValue;
            oldValue.splice(to, 0, oldValue.splice(from, 1)[0]);
            return oldValue;
        });
    }
    function isUpdater(value) {
        return typeof value === 'function';
    }
    function createSetHelper(storeSetter) {
        const setHelper = (pathOrValue, valueOrUpdater) => {
            if (typeof pathOrValue === 'string') {
                const path = pathOrValue;
                storeSetter((oldValue) => {
                    const newValue = isUpdater(valueOrUpdater)
                        ? valueOrUpdater(_get(oldValue, path))
                        : valueOrUpdater;
                    return _set(oldValue, path, newValue);
                });
            }
            else {
                storeSetter((oldValue) => isUpdater(pathOrValue) ? pathOrValue(oldValue) : pathOrValue);
            }
        };
        return setHelper;
    }
    function createHelpers({ stores, config, validateErrors, validateWarnings, _getCurrentExtenders, }) {
        var _a;
        let formNode;
        let initialValues = deepSetKey(((_a = config.initialValues) !== null && _a !== void 0 ? _a : {}));
        const { data, touched, errors, warnings, isDirty, isSubmitting, interacted, } = stores;
        const setData = createSetHelper(data.update);
        const setTouched = createSetHelper(touched.update);
        const setErrors = createSetHelper(errors.update);
        const setWarnings = createSetHelper(warnings.update);
        function updateFields(updater) {
            setData((oldData) => {
                const newData = updater(oldData);
                if (formNode)
                    setForm(formNode, newData);
                return newData;
            });
        }
        const setFields = (pathOrValue, valueOrUpdater, shouldTouch) => {
            const fieldsSetter = createSetHelper(updateFields);
            fieldsSetter(pathOrValue, valueOrUpdater);
            if (typeof pathOrValue === 'string' && shouldTouch) {
                setTouched(pathOrValue, true);
            }
        };
        function addField(path, value, index) {
            const touchedValue = _isPlainObject(value)
                ? deepSetTouched(value, false)
                : false;
            const errValue = _isPlainObject(touchedValue)
                ? deepSet(touchedValue, [])
                : [];
            value = _isPlainObject(value) ? Object.assign(Object.assign({}, value), { key: createId() }) : value;
            errors.update(($errors) => {
                return addAtIndex($errors, path, errValue, index);
            });
            warnings.update(($warnings) => {
                return addAtIndex($warnings, path, errValue, index);
            });
            touched.update(($touched) => {
                return addAtIndex($touched, path, touchedValue, index);
            });
            data.update(($data) => {
                const newData = addAtIndex($data, path, value, index);
                setTimeout(() => formNode && setForm(formNode, newData));
                return newData;
            });
        }
        function updateAll(updater) {
            errors.update(updater);
            warnings.update(updater);
            touched.update(updater);
            data.update(($data) => {
                const newData = updater($data);
                setTimeout(() => formNode && setForm(formNode, newData));
                return newData;
            });
        }
        function unsetField(path) {
            updateAll((storeValue) => _unset(storeValue, path));
        }
        function swapFields(path, from, to) {
            updateAll((storeValue) => swapInArray(storeValue, path, from, to));
        }
        function moveField(path, from, to) {
            updateAll((storeValue) => moveInArray(storeValue, path, from, to));
        }
        function resetField(path) {
            const initialValue = _get(initialValues, path);
            const touchedValue = _isPlainObject(initialValue)
                ? deepSetTouched(initialValue, false)
                : false;
            const errValue = _isPlainObject(touchedValue)
                ? deepSet(touchedValue, [])
                : [];
            data.update(($data) => {
                const newData = _set($data, path, initialValue);
                if (formNode)
                    setForm(formNode, newData);
                return newData;
            });
            touched.update(($touched) => {
                return _set($touched, path, touchedValue);
            });
            errors.update(($errors) => {
                return _set($errors, path, errValue);
            });
            warnings.update(($warnings) => {
                return _set($warnings, path, errValue);
            });
        }
        const setIsSubmitting = createSetHelper(isSubmitting.update);
        const setIsDirty = createSetHelper(isDirty.update);
        const setInteracted = createSetHelper(interacted.update);
        async function validate() {
            const currentData = get(data);
            touched.set(deepSetTouched(currentData, true));
            interacted.set(null);
            const currentErrors = await validateErrors(currentData);
            await validateWarnings(currentData);
            return currentErrors;
        }
        function reset() {
            setFields(_cloneDeep(initialValues));
            setTouched(($touched) => deepSet($touched, false));
            interacted.set(null);
            isDirty.set(false);
        }
        function createSubmitHandler(altConfig) {
            return async function handleSubmit(event) {
                var _a, _b, _c, _d, _e, _f, _g;
                const { createErrorEvent, createSubmitEvent, createSuccessEvent, } = createEventConstructors();
                const submitEvent = createSubmitEvent();
                formNode === null || formNode === void 0 ? void 0 : formNode.dispatchEvent(submitEvent);
                const onError = (_b = (_a = submitEvent.onError) !== null && _a !== void 0 ? _a : altConfig === null || altConfig === void 0 ? void 0 : altConfig.onError) !== null && _b !== void 0 ? _b : config.onError;
                const onSuccess = (_d = (_c = submitEvent.onSuccess) !== null && _c !== void 0 ? _c : altConfig === null || altConfig === void 0 ? void 0 : altConfig.onSuccess) !== null && _d !== void 0 ? _d : config.onSuccess;
                const onSubmit = (_g = (_f = (_e = submitEvent.onSubmit) !== null && _e !== void 0 ? _e : altConfig === null || altConfig === void 0 ? void 0 : altConfig.onSubmit) !== null && _f !== void 0 ? _f : config.onSubmit) !== null && _g !== void 0 ? _g : createDefaultSubmitHandler(formNode);
                if (!onSubmit)
                    return;
                event === null || event === void 0 ? void 0 : event.preventDefault();
                if (submitEvent.defaultPrevented)
                    return;
                isSubmitting.set(true);
                interacted.set(null);
                const currentData = deepRemoveKey(get(data));
                const currentErrors = await validateErrors(currentData, altConfig === null || altConfig === void 0 ? void 0 : altConfig.validate);
                const currentWarnings = await validateWarnings(currentData, altConfig === null || altConfig === void 0 ? void 0 : altConfig.warn);
                if (currentWarnings)
                    warnings.set(_merge(deepSet(currentData, []), currentWarnings));
                touched.set(deepSetTouched(currentData, true));
                if (currentErrors) {
                    touched.set(deepSetTouched(currentErrors, true));
                    const hasErrors = deepSome(currentErrors, (error) => Array.isArray(error) ? error.length >= 1 : !!error);
                    if (hasErrors) {
                        await new Promise((r) => setTimeout(r));
                        _getCurrentExtenders().forEach((extender) => {
                            var _a;
                            return (_a = extender.onSubmitError) === null || _a === void 0 ? void 0 : _a.call(extender, {
                                data: currentData,
                                errors: currentErrors,
                            });
                        });
                        isSubmitting.set(false);
                        return;
                    }
                }
                const context = {
                    setFields,
                    setData,
                    setTouched,
                    setErrors,
                    setWarnings,
                    unsetField,
                    addField,
                    resetField,
                    reset,
                    setInitialValues: publicHelpers.setInitialValues,
                    moveField,
                    swapFields,
                    form: formNode,
                    controls: formNode && Array.from(formNode.elements).filter(isFormControl),
                    config: Object.assign(Object.assign({}, config), altConfig),
                };
                try {
                    const response = await onSubmit(currentData, context);
                    formNode === null || formNode === void 0 ? void 0 : formNode.dispatchEvent(createSuccessEvent(Object.assign({ response }, context)));
                    await (onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(response, context));
                }
                catch (e) {
                    const errorEvent = createErrorEvent(Object.assign({ error: e }, context));
                    formNode === null || formNode === void 0 ? void 0 : formNode.dispatchEvent(errorEvent);
                    if (!onError && !errorEvent.defaultPrevented) {
                        throw e;
                    }
                    if (!onError && !errorEvent.errors)
                        return;
                    const serverErrors = errorEvent.errors || (await (onError === null || onError === void 0 ? void 0 : onError(e, context)));
                    if (serverErrors) {
                        touched.set(deepSetTouched(serverErrors, true));
                        errors.set(serverErrors);
                        await new Promise((r) => setTimeout(r));
                        _getCurrentExtenders().forEach((extender) => {
                            var _a;
                            return (_a = extender.onSubmitError) === null || _a === void 0 ? void 0 : _a.call(extender, {
                                data: currentData,
                                errors: get(errors),
                            });
                        });
                    }
                }
                finally {
                    isSubmitting.set(false);
                }
            };
        }
        const publicHelpers = {
            setData,
            setFields,
            setTouched,
            setErrors,
            setWarnings,
            setIsSubmitting,
            setIsDirty,
            setInteracted,
            validate,
            reset,
            unsetField,
            resetField,
            addField,
            swapFields,
            moveField,
            createSubmitHandler,
            handleSubmit: createSubmitHandler(),
            setInitialValues: (values) => {
                initialValues = deepSetKey(values);
            },
        };
        const privateHelpers = {
            _setFormNode(node) {
                formNode = node;
            },
            _getInitialValues: () => initialValues,
        };
        return {
            public: publicHelpers,
            private: privateHelpers,
        };
    }

    function createFormAction({ helpers, stores, config, extender, createSubmitHandler, handleSubmit, _setFormNode, _getInitialValues, _setCurrentExtenders, _getCurrentExtenders, }) {
        const { setFields, setTouched, reset, setInitialValues } = helpers;
        const { addValidator, addTransformer, validate } = helpers;
        const { data, errors, warnings, touched, isSubmitting, isDirty, interacted, isValid, isValidating, } = stores;
        function form(node) {
            if (!node.requestSubmit)
                node.requestSubmit = handleSubmit;
            function callExtender(stage) {
                return function (extender) {
                    return extender({
                        form: node,
                        stage,
                        controls: Array.from(node.elements).filter(isFormControl),
                        data,
                        errors,
                        warnings,
                        touched,
                        isValid,
                        isValidating,
                        isSubmitting,
                        isDirty,
                        interacted,
                        config,
                        addValidator,
                        addTransformer,
                        setFields,
                        validate,
                        reset,
                        createSubmitHandler,
                        handleSubmit,
                    });
                };
            }
            _setCurrentExtenders(extender.map(callExtender('MOUNT')));
            node.noValidate = !!config.validate;
            const { defaultData, defaultTouched } = getFormDefaultValues(node);
            _setFormNode(node);
            setInitialValues(_merge(_cloneDeep(defaultData), _getInitialValues()));
            setFields(_getInitialValues());
            touched.set(defaultTouched);
            function setCheckboxValues(target) {
                const elPath = getPath(target);
                const checkboxes = Array.from(node.querySelectorAll(`[name="${target.name}"]`)).filter((checkbox) => {
                    if (!isFormControl(checkbox))
                        return false;
                    return elPath === getPath(checkbox);
                });
                if (checkboxes.length === 0)
                    return;
                if (checkboxes.length === 1) {
                    return data.update(($data) => _set($data, getPath(target), target.checked));
                }
                return data.update(($data) => {
                    return _set($data, getPath(target), checkboxes
                        .filter(isInputElement)
                        .filter((el) => el.checked)
                        .map((el) => el.value));
                });
            }
            function setRadioValues(target) {
                const radios = node.querySelectorAll(`[name="${target.name}"]`);
                const checkedRadio = Array.from(radios).find((el) => isInputElement(el) && el.checked);
                data.update(($data) => _set($data, getPath(target), checkedRadio === null || checkedRadio === void 0 ? void 0 : checkedRadio.value));
            }
            function setFileValue(target) {
                var _a;
                const files = Array.from((_a = target.files) !== null && _a !== void 0 ? _a : []);
                data.update(($data) => {
                    return _set($data, getPath(target), target.multiple ? files : files[0]);
                });
            }
            function setSelectValue(target) {
                if (!target.multiple) {
                    data.update(($data) => {
                        return _set($data, getPath(target), target.value);
                    });
                }
                else {
                    const selectedOptions = Array.from(target.options)
                        .filter((opt) => opt.selected)
                        .map((opt) => opt.value);
                    data.update(($data) => {
                        return _set($data, getPath(target), selectedOptions);
                    });
                }
            }
            function handleInput(e) {
                const target = e.target;
                if (!target ||
                    !isFormControl(target) ||
                    isSelectElement(target) ||
                    shouldIgnore(target))
                    return;
                if (['checkbox', 'radio', 'file'].includes(target.type))
                    return;
                if (!target.name)
                    return;
                isDirty.set(true);
                const inputValue = getInputTextOrNumber(target);
                interacted.set(target.name);
                data.update(($data) => {
                    return _set($data, getPath(target), inputValue);
                });
            }
            function handleChange(e) {
                const target = e.target;
                if (!target || !isFormControl(target) || shouldIgnore(target))
                    return;
                if (!target.name)
                    return;
                setTouched(getPath(target), true);
                interacted.set(target.name);
                if (isSelectElement(target) ||
                    ['checkbox', 'radio', 'file', 'hidden'].includes(target.type)) {
                    isDirty.set(true);
                }
                if (target.type === 'hidden') {
                    data.update(($data) => {
                        return _set($data, getPath(target), target.value);
                    });
                }
                if (isSelectElement(target))
                    setSelectValue(target);
                else if (!isInputElement(target))
                    return;
                else if (target.type === 'checkbox')
                    setCheckboxValues(target);
                else if (target.type === 'radio')
                    setRadioValues(target);
                else if (target.type === 'file')
                    setFileValue(target);
            }
            function handleBlur(e) {
                const target = e.target;
                if (!target || !isFormControl(target) || shouldIgnore(target))
                    return;
                if (!target.name)
                    return;
                setTouched(getPath(target), true);
                interacted.set(target.name);
            }
            function handleReset(e) {
                e.preventDefault();
                reset();
            }
            const mutationOptions = { childList: true, subtree: true };
            function unsetTaggedForRemove(formControls) {
                let currentData = get(data);
                let currentTouched = get(touched);
                let currentErrors = get(errors);
                let currentWarnings = get(warnings);
                for (const control of formControls.reverse()) {
                    if (control.hasAttribute('data-felte-keep-on-remove') &&
                        control.dataset.felteKeepOnRemove !== 'false')
                        continue;
                    const fieldArrayReg = /.*(\[[0-9]+\]|\.[0-9]+)\.[^.]+$/;
                    let fieldName = getPath(control);
                    const shape = get(touched);
                    const isFieldArray = fieldArrayReg.test(fieldName);
                    if (isFieldArray) {
                        const arrayPath = fieldName.split('.').slice(0, -1).join('.');
                        const valueToRemove = _get(shape, arrayPath);
                        if (_isPlainObject(valueToRemove) &&
                            Object.keys(valueToRemove).length <= 1) {
                            fieldName = arrayPath;
                        }
                    }
                    currentData = _unset(currentData, fieldName);
                    currentTouched = _unset(currentTouched, fieldName);
                    currentErrors = _unset(currentErrors, fieldName);
                    currentWarnings = _unset(currentWarnings, fieldName);
                }
                data.set(currentData);
                touched.set(currentTouched);
                errors.set(currentErrors);
                warnings.set(currentWarnings);
            }
            const updateAddedNodes = debounce(() => {
                _getCurrentExtenders().forEach((extender) => { var _a; return (_a = extender.destroy) === null || _a === void 0 ? void 0 : _a.call(extender); });
                _setCurrentExtenders(extender.map(callExtender('UPDATE')));
                const { defaultData: newDefaultData, defaultTouched: newDefaultTouched, } = getFormDefaultValues(node);
                data.update(($data) => _defaultsDeep($data, newDefaultData));
                touched.update(($touched) => {
                    return _defaultsDeep($touched, newDefaultTouched);
                });
                helpers.setFields(get(data));
            }, 0);
            let removedFormControls = [];
            const updateRemovedNodes = debounce(() => {
                _getCurrentExtenders().forEach((extender) => { var _a; return (_a = extender.destroy) === null || _a === void 0 ? void 0 : _a.call(extender); });
                _setCurrentExtenders(extender.map(callExtender('UPDATE')));
                unsetTaggedForRemove(removedFormControls);
                removedFormControls = [];
            }, 0);
            function handleNodeAddition(mutation) {
                const shouldUpdate = Array.from(mutation.addedNodes).some((node) => {
                    if (!isElement(node))
                        return false;
                    if (isFormControl(node))
                        return true;
                    const formControls = getFormControls(node);
                    return formControls.length > 0;
                });
                if (!shouldUpdate)
                    return;
                updateAddedNodes();
            }
            function handleNodeRemoval(mutation) {
                for (const removedNode of mutation.removedNodes) {
                    if (!isElement(removedNode))
                        continue;
                    const formControls = getFormControls(removedNode);
                    if (formControls.length === 0)
                        continue;
                    removedFormControls.push(...formControls);
                    updateRemovedNodes();
                }
            }
            function mutationCallback(mutationList) {
                for (const mutation of mutationList) {
                    if (mutation.type !== 'childList')
                        continue;
                    if (mutation.addedNodes.length > 0)
                        handleNodeAddition(mutation);
                    if (mutation.removedNodes.length > 0)
                        handleNodeRemoval(mutation);
                }
            }
            const observer = new MutationObserver(mutationCallback);
            observer.observe(node, mutationOptions);
            node.addEventListener('input', handleInput);
            node.addEventListener('change', handleChange);
            node.addEventListener('focusout', handleBlur);
            node.addEventListener('submit', handleSubmit);
            node.addEventListener('reset', handleReset);
            const unsubscribeErrors = errors.subscribe(($errors) => {
                for (const el of node.elements) {
                    if (!isFormControl(el) || !el.name)
                        continue;
                    const fieldErrors = _get($errors, getPath(el));
                    const message = Array.isArray(fieldErrors)
                        ? fieldErrors.join('\n')
                        : typeof fieldErrors === 'string'
                            ? fieldErrors
                            : undefined;
                    if (message === el.dataset.felteValidationMessage)
                        continue;
                    if (message) {
                        el.dataset.felteValidationMessage = message;
                        el.setAttribute('aria-invalid', 'true');
                    }
                    else {
                        delete el.dataset.felteValidationMessage;
                        el.removeAttribute('aria-invalid');
                    }
                }
            });
            return {
                destroy() {
                    observer.disconnect();
                    node.removeEventListener('input', handleInput);
                    node.removeEventListener('change', handleChange);
                    node.removeEventListener('focusout', handleBlur);
                    node.removeEventListener('submit', handleSubmit);
                    node.removeEventListener('reset', handleReset);
                    unsubscribeErrors();
                    _getCurrentExtenders().forEach((extender) => { var _a; return (_a = extender.destroy) === null || _a === void 0 ? void 0 : _a.call(extender); });
                },
            };
        }
        return { form };
    }

    function createValidationController(priority) {
        const signal = { aborted: false, priority };
        return {
            signal,
            abort() {
                signal.aborted = true;
            },
        };
    }
    function errorFilterer(touchValue, errValue) {
        if (_isPlainObject(touchValue)) {
            if (!errValue ||
                (_isPlainObject(errValue) && Object.keys(errValue).length === 0)) {
                return deepSet(touchValue, null);
            }
            return;
        }
        if (Array.isArray(touchValue)) {
            if (touchValue.some(_isPlainObject))
                return;
            const errArray = Array.isArray(errValue) ? errValue : [];
            return touchValue.map((value, index) => {
                const err = errArray[index];
                if (Array.isArray(err) && err.length === 0)
                    return null;
                return (value && err) || null;
            });
        }
        if (Array.isArray(errValue) && errValue.length === 0)
            return null;
        if (Array.isArray(errValue))
            return touchValue ? errValue : null;
        return touchValue && errValue ? [errValue] : null;
    }
    function warningFilterer(touchValue, errValue) {
        if (_isPlainObject(touchValue)) {
            if (!errValue ||
                (_isPlainObject(errValue) && Object.keys(errValue).length === 0)) {
                return deepSet(touchValue, null);
            }
            return;
        }
        if (Array.isArray(touchValue)) {
            if (touchValue.some(_isPlainObject))
                return;
            const errArray = Array.isArray(errValue) ? errValue : [];
            return touchValue.map((_, index) => {
                const err = errArray[index];
                if (Array.isArray(err) && err.length === 0)
                    return null;
                return err || null;
            });
        }
        if (Array.isArray(errValue) && errValue.length === 0)
            return null;
        if (Array.isArray(errValue))
            return errValue;
        return errValue ? [errValue] : null;
    }
    function filterErrors([errors, touched]) {
        return _mergeWith(touched, errors, errorFilterer);
    }
    function filterWarnings([errors, touched]) {
        return _mergeWith(touched, errors, warningFilterer);
    }
    // A `derived` store factory that can defer subscription and be constructed
    // with any store factory.
    function createDerivedFactory(storeFactory) {
        return function derived(storeOrStores, deriver, initialValue) {
            const stores = Array.isArray(storeOrStores)
                ? storeOrStores
                : [storeOrStores];
            const values = new Array(stores.length);
            const derivedStore = storeFactory(initialValue);
            const storeSet = derivedStore.set;
            const storeSubscribe = derivedStore.subscribe;
            let unsubscribers;
            function startStore() {
                unsubscribers = stores.map((store, index) => {
                    return store.subscribe(($store) => {
                        values[index] = $store;
                        storeSet(deriver(values));
                    });
                });
            }
            function stopStore() {
                unsubscribers === null || unsubscribers === void 0 ? void 0 : unsubscribers.forEach((unsub) => unsub());
            }
            derivedStore.subscribe = function subscribe(subscriber) {
                const unsubscribe = storeSubscribe(subscriber);
                return () => {
                    unsubscribe();
                };
            };
            return [derivedStore, startStore, stopStore];
        };
    }
    function createStores(storeFactory, config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const derived = createDerivedFactory(storeFactory);
        const initialValues = (config.initialValues = config.initialValues
            ? deepSetKey(executeTransforms(_cloneDeep(config.initialValues), config.transform))
            : {});
        const initialTouched = deepSetTouched(deepRemoveKey(initialValues), false);
        const touched = storeFactory(initialTouched);
        const validationCount = storeFactory(0);
        const [isValidating, startIsValidating, stopIsValidating] = derived([touched, validationCount], ([$touched, $validationCount]) => {
            const isTouched = deepSome($touched, (t) => !!t);
            return isTouched && $validationCount >= 1;
        }, false);
        // It is important not to destructure stores created with the factory
        // since some stores may be callable.
        delete isValidating.set;
        delete isValidating.update;
        function cancellableValidation(store) {
            let activeController;
            return async function executeValidations($data, shape, validations, priority = false) {
                if (!validations || !$data)
                    return;
                let current = shape && Object.keys(shape).length > 0
                    ? shape
                    : deepSet($data, []);
                // Keeping a controller allows us to cancel previous asynchronous
                // validations if they've become stale.
                const controller = createValidationController(priority);
                // By assigning `priority` we can prevent specific validations
                // from being aborted. Used when submitting the form or
                // calling the `validate` helper.
                if (!(activeController === null || activeController === void 0 ? void 0 : activeController.signal.priority) || priority) {
                    activeController === null || activeController === void 0 ? void 0 : activeController.abort();
                    activeController = controller;
                }
                // If the current controller has priority and we're not trying to
                // override it, completely prevent validations
                if (activeController.signal.priority && !priority)
                    return;
                validationCount.update((c) => c + 1);
                const results = runValidations($data, validations);
                results.forEach(async (promise) => {
                    const result = await promise;
                    if (controller.signal.aborted)
                        return;
                    current = mergeErrors([current, result]);
                    store.set(current);
                });
                await Promise.all(results);
                activeController = undefined;
                validationCount.update((c) => c - 1);
                return current;
            };
        }
        let storesShape = deepSet(initialTouched, []);
        const data = storeFactory(initialValues);
        const initialErrors = deepSet(initialTouched, []);
        const immediateErrors = storeFactory(initialErrors);
        const debouncedErrors = storeFactory(_cloneDeep(initialErrors));
        const [errors, startErrors, stopErrors] = derived([
            immediateErrors,
            debouncedErrors,
        ], mergeErrors, _cloneDeep(initialErrors));
        const initialWarnings = deepSet(initialTouched, []);
        const immediateWarnings = storeFactory(initialWarnings);
        const debouncedWarnings = storeFactory(_cloneDeep(initialWarnings));
        const [warnings, startWarnings, stopWarnings] = derived([
            immediateWarnings,
            debouncedWarnings,
        ], mergeErrors, _cloneDeep(initialWarnings));
        const [filteredErrors, startFilteredErrors, stopFilteredErrors] = derived([errors, touched], filterErrors, _cloneDeep(initialErrors));
        const [filteredWarnings, startFilteredWarnings, stopFilteredWarnings,] = derived([warnings, touched], filterWarnings, _cloneDeep(initialWarnings));
        // This is necessary since, on the first run, validations
        // have not run yet. We assume the form is not valid in the first calling
        // if there's validation functions assigned in the configuration.
        let firstCalled = false;
        const [isValid, startIsValid, stopIsValid] = derived(errors, ([$errors]) => {
            var _a;
            if (!firstCalled) {
                firstCalled = true;
                return !config.validate && !((_a = config.debounced) === null || _a === void 0 ? void 0 : _a.validate);
            }
            else {
                return !deepSome($errors, (error) => Array.isArray(error) ? error.length >= 1 : !!error);
            }
        }, !config.validate && !((_a = config.debounced) === null || _a === void 0 ? void 0 : _a.validate));
        delete isValid.set;
        delete isValid.update;
        const isSubmitting = storeFactory(false);
        const isDirty = storeFactory(false);
        const interacted = storeFactory(null);
        const validateErrors = cancellableValidation(immediateErrors);
        const validateWarnings = cancellableValidation(immediateWarnings);
        const validateDebouncedErrors = cancellableValidation(debouncedErrors);
        const validateDebouncedWarnings = cancellableValidation(debouncedWarnings);
        const _validateDebouncedErrors = debounce(validateDebouncedErrors, (_e = (_c = (_b = config.debounced) === null || _b === void 0 ? void 0 : _b.validateTimeout) !== null && _c !== void 0 ? _c : (_d = config.debounced) === null || _d === void 0 ? void 0 : _d.timeout) !== null && _e !== void 0 ? _e : 300, {
            onInit: () => {
                validationCount.update((c) => c + 1);
            },
            onEnd: () => {
                validationCount.update((c) => c - 1);
            },
        });
        const _validateDebouncedWarnings = debounce(validateDebouncedWarnings, (_j = (_g = (_f = config.debounced) === null || _f === void 0 ? void 0 : _f.warnTimeout) !== null && _g !== void 0 ? _g : (_h = config.debounced) === null || _h === void 0 ? void 0 : _h.timeout) !== null && _j !== void 0 ? _j : 300);
        async function executeErrorsValidation(data, altValidate) {
            var _a;
            const $data = deepRemoveKey(data);
            const errors = validateErrors($data, storesShape, altValidate !== null && altValidate !== void 0 ? altValidate : config.validate, true);
            if (altValidate)
                return errors;
            const debouncedErrors = validateDebouncedErrors($data, storesShape, (_a = config.debounced) === null || _a === void 0 ? void 0 : _a.validate, true);
            return mergeErrors(await Promise.all([errors, debouncedErrors]));
        }
        async function executeWarningsValidation(data, altWarn) {
            var _a;
            const $data = deepRemoveKey(data);
            const warnings = validateWarnings($data, storesShape, altWarn !== null && altWarn !== void 0 ? altWarn : config.warn, true);
            if (altWarn)
                return warnings;
            const debouncedWarnings = validateDebouncedWarnings($data, storesShape, (_a = config.debounced) === null || _a === void 0 ? void 0 : _a.warn, true);
            return mergeErrors(await Promise.all([warnings, debouncedWarnings]));
        }
        let errorsValue = initialErrors;
        let warningsValue = initialWarnings;
        function start() {
            const dataUnsubscriber = data.subscribe(($keyedData) => {
                var _a, _b;
                const $data = deepRemoveKey($keyedData);
                validateErrors($data, storesShape, config.validate);
                validateWarnings($data, storesShape, config.warn);
                _validateDebouncedErrors($data, storesShape, (_a = config.debounced) === null || _a === void 0 ? void 0 : _a.validate);
                _validateDebouncedWarnings($data, storesShape, (_b = config.debounced) === null || _b === void 0 ? void 0 : _b.warn);
            });
            const unsubscribeTouched = touched.subscribe(($touched) => {
                storesShape = deepSet($touched, []);
            });
            const unsubscribeErrors = errors.subscribe(($errors) => {
                errorsValue = $errors;
            });
            const unsubscribeWarnings = warnings.subscribe(($warnings) => {
                warningsValue = $warnings;
            });
            startErrors();
            startIsValid();
            startWarnings();
            startFilteredErrors();
            startFilteredWarnings();
            startIsValidating();
            function cleanup() {
                dataUnsubscriber();
                stopFilteredErrors();
                stopErrors();
                stopWarnings();
                stopFilteredWarnings();
                stopIsValid();
                stopIsValidating();
                unsubscribeTouched();
                unsubscribeErrors();
                unsubscribeWarnings();
            }
            return cleanup;
        }
        function publicErrorsUpdater(updater) {
            immediateErrors.set(updater(errorsValue));
            debouncedErrors.set({});
        }
        function publicWarningsUpdater(updater) {
            immediateWarnings.set(updater(warningsValue));
            debouncedWarnings.set({});
        }
        function publicErrorsSetter(value) {
            publicErrorsUpdater(() => value);
        }
        function publicWarningsSetter(value) {
            publicWarningsUpdater(() => value);
        }
        filteredErrors.set = publicErrorsSetter;
        filteredErrors.update = publicErrorsUpdater;
        filteredWarnings.set = publicWarningsSetter;
        filteredWarnings.update = publicWarningsUpdater;
        return {
            data: data,
            errors: filteredErrors,
            warnings: filteredWarnings,
            touched,
            isValid,
            isSubmitting,
            isDirty,
            isValidating,
            interacted,
            validateErrors: executeErrorsValidation,
            validateWarnings: executeWarningsValidation,
            cleanup: config.preventStoreStart ? () => undefined : start(),
            start,
        };
    }

    function createForm(config, adapters) {
        var _a, _b;
        (_a = config.extend) !== null && _a !== void 0 ? _a : (config.extend = []);
        (_b = config.debounced) !== null && _b !== void 0 ? _b : (config.debounced = {});
        if (config.validate && !Array.isArray(config.validate))
            config.validate = [config.validate];
        if (config.debounced.validate && !Array.isArray(config.debounced.validate))
            config.debounced.validate = [config.debounced.validate];
        if (config.transform && !Array.isArray(config.transform))
            config.transform = [config.transform];
        if (config.warn && !Array.isArray(config.warn))
            config.warn = [config.warn];
        if (config.debounced.warn && !Array.isArray(config.debounced.warn))
            config.debounced.warn = [config.debounced.warn];
        function addValidator(validator, { debounced, level } = {
            debounced: false,
            level: 'error',
        }) {
            var _a;
            const prop = level === 'error' ? 'validate' : 'warn';
            (_a = config.debounced) !== null && _a !== void 0 ? _a : (config.debounced = {});
            const validateConfig = debounced ? config.debounced : config;
            if (!validateConfig[prop]) {
                validateConfig[prop] = [validator];
            }
            else {
                validateConfig[prop] = [
                    ...validateConfig[prop],
                    validator,
                ];
            }
        }
        function addTransformer(transformer) {
            if (!config.transform) {
                config.transform = [transformer];
            }
            else {
                config.transform = [
                    ...config.transform,
                    transformer,
                ];
            }
        }
        const extender = Array.isArray(config.extend)
            ? config.extend
            : [config.extend];
        let currentExtenders = [];
        const _getCurrentExtenders = () => currentExtenders;
        const _setCurrentExtenders = (extenders) => {
            currentExtenders = extenders;
        };
        const { isSubmitting, isValidating, data, errors, warnings, touched, isValid, isDirty, cleanup, start, validateErrors, validateWarnings, interacted, } = createStores(adapters.storeFactory, config);
        const originalUpdate = data.update;
        const originalSet = data.set;
        const transUpdate = (updater) => originalUpdate((values) => deepSetKey(executeTransforms(updater(values), config.transform)));
        const transSet = (values) => originalSet(deepSetKey(executeTransforms(values, config.transform)));
        data.update = transUpdate;
        data.set = transSet;
        const helpers = createHelpers({
            extender,
            config,
            addValidator,
            addTransformer,
            validateErrors,
            validateWarnings,
            _getCurrentExtenders,
            stores: {
                data,
                errors,
                warnings,
                touched,
                isValid,
                isValidating,
                isSubmitting,
                isDirty,
                interacted,
            },
        });
        const { createSubmitHandler, handleSubmit } = helpers.public;
        currentExtenders = extender.map((extender) => extender({
            stage: 'SETUP',
            errors,
            warnings,
            touched,
            data,
            isDirty,
            isValid,
            isValidating,
            isSubmitting,
            interacted,
            config,
            addValidator,
            addTransformer,
            setFields: helpers.public.setFields,
            reset: helpers.public.reset,
            validate: helpers.public.validate,
            handleSubmit,
            createSubmitHandler,
        }));
        const formActionConfig = Object.assign({ config, stores: {
                data,
                touched,
                errors,
                warnings,
                isSubmitting,
                isValidating,
                isValid,
                isDirty,
                interacted,
            }, createSubmitHandler,
            handleSubmit, helpers: Object.assign(Object.assign({}, helpers.public), { addTransformer,
                addValidator }), extender,
            _getCurrentExtenders,
            _setCurrentExtenders }, helpers.private);
        const { form } = createFormAction(formActionConfig);
        return Object.assign({ data,
            errors,
            warnings,
            touched,
            isValid,
            isSubmitting,
            isValidating,
            isDirty,
            interacted,
            form,
            cleanup, startStores: start }, helpers.public);
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest$2(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function createForm$1(config) {
        const _a = createForm(config !== null && config !== void 0 ? config : {}, {
            storeFactory: writable,
        }), { cleanup, startStores } = _a, rest = __rest$2(_a, ["cleanup", "startStores"]);
        onDestroy(cleanup);
        return rest;
    }

    // concept: log in by name
    let users = writable([]);
    let numUsers = writable(0);
    let currentUserNum = writable(-1);
    let availabilities = writable([]);
    let checks = writable([]);
    let locations = writable([]);
    let startTimes = writable([]);
    let endTimes = writable([]);
    let timerNumber = writable(-1);
    // concept: eligible times and days - 7 days of week, 15 min increments, 9-19 ET
    let days = ["Monday   ", "Tuesday  ", "Wednesday ", "Thursday ", 
    					   "Friday   ", "Saturday ", "Sunday   "];
    let times = [
    						"9:00 am  ", "9:15 am  ", "9:30 am  ", "9:45 am  ",
    						"10:00 am ", "10:15 am ", "10:30 am ", "10:45 am ",
    						"11:00 am ", "11:15 am ", "11:30 am ", "11:45 am ",
    						"12:00 pm ", "12:15 pm ", "12:30 pm ", "12:45 pm ",
    						"1:00 pm  ", "1:15 pm  ", "1:30 pm  ", "1:45 pm  ",
    						"2:00 pm  ", "2:15 pm  ", "2:30 pm  ", "2:45 pm  ",
    						"3:00 pm  ", "3:15 pm  ", "3:30 pm  ", "3:45 pm  ",
    						"4:00 pm  ", "4:15 pm  ", "4:30 pm  ", "4:45 pm  ",
    						"5:00 pm  ", "5:15 pm  ", "5:30 pm  ", "5:45 pm  ",
    						"6:00 pm  ", "6:15 pm  ", "6:30 pm  ", "6:45 pm  ",];
    // concept: location, availability conditioned on location
    let locationNames = ["Cambridge (River)", "Cambridge (Yard)", 
                              "Cambridge (Quad)", "Allston", "Virtual"];
    let usersForTime = writable([]);
    let vchecks = writable([]);

    /* src/components/Login.svelte generated by Svelte v3.55.1 */
    const file = "src/components/Login.svelte";

    function create_fragment(ctx) {
    	let body;
    	let div8;
    	let div7;
    	let div6;
    	let div5;
    	let div0;
    	let h1;
    	let t1;
    	let div4;
    	let form_1;
    	let div1;
    	let input0;
    	let t2;
    	let div2;
    	let input1;
    	let t3;
    	let div3;
    	let button0;
    	let t5;
    	let button1;
    	let form_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			body = element("body");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "What's your availability?";
    			t1 = space();
    			div4 = element("div");
    			form_1 = element("form");
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t3 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Submit";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "View Summary";
    			attr_dev(h1, "class", "display-4");
    			add_location(h1, file, 19, 4, 583);
    			attr_dev(div0, "class", "jumbotron");
    			add_location(div0, file, 18, 3, 555);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "firstName");
    			attr_dev(input0, "placeholder", "First Name");
    			attr_dev(input0, "name", "firstName");
    			input0.value = "";
    			add_location(input0, file, 26, 6, 886);
    			attr_dev(div1, "class", "form-floating mb-3");
    			add_location(div1, file, 25, 4, 847);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "lastName");
    			attr_dev(input1, "placeholder", "Last Name");
    			attr_dev(input1, "name", "lastName");
    			input1.value = "";
    			add_location(input1, file, 29, 6, 1049);
    			attr_dev(div2, "class", "form-floating mb-3");
    			add_location(div2, file, 28, 4, 1010);
    			attr_dev(button0, "class", "btn btn-primary btn-login text-uppercase fw-bold svelte-1mstmo5");
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file, 33, 6, 1205);
    			attr_dev(button1, "class", "btn btn-primary btn-login text-uppercase fw-bold svelte-1mstmo5");
    			attr_dev(button1, "type", "button");
    			button1.value = "Summary";
    			add_location(button1, file, 36, 5, 1316);
    			attr_dev(div3, "class", "d-grid my-3");
    			add_location(div3, file, 32, 4, 1173);
    			add_location(form_1, file, 23, 5, 790);
    			attr_dev(div4, "class", "card-body p-4 p-sm-5");
    			add_location(div4, file, 21, 3, 651);
    			attr_dev(div5, "class", "card border-0 shadow rounded-3 my-5");
    			add_location(div5, file, 17, 4, 502);
    			attr_dev(div6, "class", "col-sm-9 col-md-7 col-lg-5 mx-auto");
    			add_location(div6, file, 16, 2, 449);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file, 15, 3, 429);
    			attr_dev(div8, "class", "container");
    			add_location(div8, file, 14, 1, 402);
    			attr_dev(body, "class", "svelte-1mstmo5");
    			add_location(body, file, 13, 0, 394);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, h1);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, form_1);
    			append_dev(form_1, div1);
    			append_dev(div1, input0);
    			append_dev(form_1, t2);
    			append_dev(form_1, div2);
    			append_dev(div2, input1);
    			append_dev(form_1, t3);
    			append_dev(form_1, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t5);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button1, "click", /*click_handler*/ ctx[5], false, false, false),
    					action_destroyer(form_action = /*form*/ ctx[2].call(null, form_1))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $data;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let { onSubmit } = $$props;
    	let { onSummary } = $$props;

    	const { form, data } = createForm$1({
    		onSubmit,
    		initialValues: { firstName: '', lastName: '' }
    	});

    	validate_store(data, 'data');
    	component_subscribe($$self, data, value => $$invalidate(1, $data = value));

    	$$self.$$.on_mount.push(function () {
    		if (onSubmit === undefined && !('onSubmit' in $$props || $$self.$$.bound[$$self.$$.props['onSubmit']])) {
    			console.warn("<Login> was created without expected prop 'onSubmit'");
    		}

    		if (onSummary === undefined && !('onSummary' in $$props || $$self.$$.bound[$$self.$$.props['onSummary']])) {
    			console.warn("<Login> was created without expected prop 'onSummary'");
    		}
    	});

    	const writable_props = ['onSubmit', 'onSummary'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => onSummary($data);

    	$$self.$$set = $$props => {
    		if ('onSubmit' in $$props) $$invalidate(4, onSubmit = $$props.onSubmit);
    		if ('onSummary' in $$props) $$invalidate(0, onSummary = $$props.onSummary);
    	};

    	$$self.$capture_state = () => ({
    		createForm: createForm$1,
    		users,
    		numUsers,
    		onSubmit,
    		onSummary,
    		form,
    		data,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('onSubmit' in $$props) $$invalidate(4, onSubmit = $$props.onSubmit);
    		if ('onSummary' in $$props) $$invalidate(0, onSummary = $$props.onSummary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onSummary, $data, form, data, onSubmit, click_handler];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { onSubmit: 4, onSummary: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get onSubmit() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSubmit(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onSummary() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSummary(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Collection.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;

    const file$1 = "src/components/Collection.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    // (140:2) {#each locationNames as location, i}
    function create_each_block_3(ctx) {
    	let button;
    	let t0_value = locationNames[/*i*/ ctx[29]] + "";
    	let t0;
    	let t1;
    	let button_id_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[16](/*location*/ ctx[34], /*i*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "id", button_id_value = /*location*/ ctx[34]);
    			set_style(button, "background", /*locs*/ ctx[6][/*i*/ ctx[29]]);
    			set_style(button, "color", "black");
    			set_style(button, "border", "blue 2px");
    			attr_dev(button, "class", "btn btn-primary btn-login text-uppercase fw-bold btn-loc svelte-z6ih7p");
    			attr_dev(button, "type", "button");
    			add_location(button, file$1, 141, 3, 4645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*locs*/ 64) {
    				set_style(button, "background", /*locs*/ ctx[6][/*i*/ ctx[29]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(140:2) {#each locationNames as location, i}",
    		ctx
    	});

    	return block;
    }

    // (154:10) {#each days as day, i}
    function create_each_block_2(ctx) {
    	let th;
    	let input;
    	let input_id_value;
    	let input_name_value;
    	let input_value_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[17](/*i*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			th = element("th");
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = /*ud*/ ctx[4][/*i*/ ctx[29]]);
    			attr_dev(input, "name", input_name_value = /*day*/ ctx[30]);
    			input.value = input_value_value = /*day*/ ctx[30];
    			add_location(input, file$1, 154, 14, 5178);
    			attr_dev(th, "class", "svelte-z6ih7p");
    			add_location(th, file$1, 154, 10, 5174);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, input);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*ud*/ 16 && input_id_value !== (input_id_value = /*ud*/ ctx[4][/*i*/ ctx[29]])) {
    				attr_dev(input, "id", input_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(154:10) {#each days as day, i}",
    		ctx
    	});

    	return block;
    }

    // (172:6) {#each days as day, j}
    function create_each_block_1(ctx) {
    	let td;
    	let button;
    	let t_value = /*time*/ ctx[27] + "";
    	let t;
    	let td_id_value;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[19](/*i*/ ctx[29], /*j*/ ctx[32]);
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			button = element("button");
    			t = text(t_value);
    			set_style(button, "width", "100%");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-primary text-uppercase fw-bold");
    			add_location(button, file$1, 174, 7, 6099);
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", /*currAvail*/ ctx[0][/*i*/ ctx[29]][/*j*/ ctx[32]]);
    			set_style(td, "color", "black");
    			attr_dev(td, "id", td_id_value = /*dt*/ ctx[2][/*i*/ ctx[29]][/*j*/ ctx[32]]);
    			attr_dev(td, "class", "svelte-z6ih7p");
    			add_location(td, file$1, 173, 8, 6017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*currAvail*/ 1) {
    				set_style(td, "background", /*currAvail*/ ctx[0][/*i*/ ctx[29]][/*j*/ ctx[32]]);
    			}

    			if (dirty[0] & /*dt*/ 4 && td_id_value !== (td_id_value = /*dt*/ ctx[2][/*i*/ ctx[29]][/*j*/ ctx[32]])) {
    				attr_dev(td, "id", td_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(172:6) {#each days as day, j}",
    		ctx
    	});

    	return block;
    }

    // (169:5) {#each times as time, i}
    function create_each_block(ctx) {
    	let tr;
    	let td;
    	let input;
    	let input_id_value;
    	let input_name_value;
    	let input_value_value;
    	let t0;
    	let t1;
    	let tr_id_value;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[18](/*i*/ ctx[29]);
    	}

    	let each_value_1 = days;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			input = element("input");
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = /*ut*/ ctx[3][/*i*/ ctx[29]]);
    			attr_dev(input, "name", input_name_value = /*time*/ ctx[27]);
    			input.value = input_value_value = /*time*/ ctx[27];
    			add_location(input, file$1, 170, 10, 5837);
    			attr_dev(td, "class", "svelte-z6ih7p");
    			add_location(td, file$1, 170, 6, 5833);
    			attr_dev(tr, "id", tr_id_value = /*i*/ ctx[29]);
    			add_location(tr, file$1, 169, 5, 5815);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, input);
    			append_dev(tr, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*ut*/ 8 && input_id_value !== (input_id_value = /*ut*/ ctx[3][/*i*/ ctx[29]])) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty[0] & /*currAvail, dt, changeThisColor*/ 1029) {
    				each_value_1 = days;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(169:5) {#each times as time, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let hr;
    	let t3;
    	let p0;
    	let span;
    	let t5;
    	let p1;
    	let t7;
    	let div4;
    	let form_1;
    	let label;
    	let br;
    	let t9;
    	let div1;
    	let t10;
    	let div2;
    	let table;
    	let thead;
    	let tr0;
    	let th;
    	let t11;
    	let t12;
    	let tr1;
    	let td0;
    	let t14;
    	let td1;
    	let t16;
    	let td2;
    	let t18;
    	let td3;
    	let t20;
    	let td4;
    	let t22;
    	let td5;
    	let t24;
    	let td6;
    	let t26;
    	let td7;
    	let t28;
    	let t29;
    	let div3;
    	let button0;
    	let t31;
    	let button1;
    	let form_action;
    	let mounted;
    	let dispose;
    	let each_value_3 = locationNames;
    	validate_each_argument(each_value_3);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = days;
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = times;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text("Enter Availability for ");
    			t1 = text(/*currUser*/ ctx[5]);
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			p0 = element("p");
    			span = element("span");
    			span.textContent = "Select once for \"Available\" and twice for \"If need be\".";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "Note: all times in Eastern Standard Time.";
    			t7 = space();
    			div4 = element("div");
    			form_1 = element("form");
    			label = element("label");
    			label.textContent = "Select preferred location(s):";
    			br = element("br");
    			t9 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t10 = space();
    			div2 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th = element("th");
    			t11 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t12 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Time";
    			t14 = space();
    			td1 = element("td");
    			td1.textContent = "Monday";
    			t16 = space();
    			td2 = element("td");
    			td2.textContent = "Tuesday";
    			t18 = space();
    			td3 = element("td");
    			td3.textContent = "Wednesday";
    			t20 = space();
    			td4 = element("td");
    			td4.textContent = "Thursday";
    			t22 = space();
    			td5 = element("td");
    			td5.textContent = "Friday";
    			t24 = space();
    			td6 = element("td");
    			td6.textContent = "Saturday";
    			t26 = space();
    			td7 = element("td");
    			td7.textContent = "Sunday";
    			t28 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t29 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Back";
    			t31 = space();
    			button1 = element("button");
    			button1.textContent = "Submit";
    			attr_dev(h1, "class", "display-4");
    			add_location(h1, file$1, 129, 1, 4199);
    			attr_dev(hr, "class", "my-4");
    			add_location(hr, file$1, 130, 1, 4261);
    			attr_dev(span, "class", "bolded svelte-z6ih7p");
    			add_location(span, file$1, 131, 17, 4296);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file$1, 131, 1, 4280);
    			add_location(p1, file$1, 132, 1, 4385);
    			attr_dev(div0, "class", "jumbotron");
    			add_location(div0, file$1, 128, 0, 4174);
    			attr_dev(label, "for", "aboutMe");
    			set_style(label, "font-size", "1.5em");
    			add_location(label, file$1, 137, 2, 4487);
    			add_location(br, file$1, 137, 82, 4567);
    			attr_dev(div1, "class", "d-grid my-3");
    			add_location(div1, file$1, 138, 2, 4574);
    			attr_dev(th, "class", "svelte-z6ih7p");
    			add_location(th, file$1, 152, 10, 5121);
    			add_location(tr0, file$1, 151, 8, 5105);
    			attr_dev(td0, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td0, file$1, 158, 6, 5346);
    			attr_dev(td1, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td1, file$1, 160, 6, 5403);
    			attr_dev(td2, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td2, file$1, 161, 6, 5455);
    			attr_dev(td3, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td3, file$1, 162, 6, 5508);
    			attr_dev(td4, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td4, file$1, 163, 6, 5563);
    			attr_dev(td5, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td5, file$1, 164, 6, 5617);
    			attr_dev(td6, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td6, file$1, 165, 6, 5669);
    			attr_dev(td7, "class", "text-uppercase freeze svelte-z6ih7p");
    			add_location(td7, file$1, 166, 6, 5723);
    			attr_dev(tr1, "class", "bg-light-gray svelte-z6ih7p");
    			add_location(tr1, file$1, 157, 5, 5313);
    			add_location(thead, file$1, 150, 4, 5089);
    			attr_dev(table, "class", "table table-bordered text-center svelte-z6ih7p");
    			add_location(table, file$1, 149, 3, 5036);
    			attr_dev(div2, "class", "table-responsive");
    			add_location(div2, file$1, 147, 2, 4914);
    			attr_dev(button0, "class", "btn btn-primary btn-login text-uppercase fw-bold svelte-z6ih7p");
    			attr_dev(button0, "type", "button");
    			button0.value = "Back";
    			add_location(button0, file$1, 184, 3, 6391);
    			attr_dev(button1, "class", "btn btn-primary btn-login text-uppercase fw-bold svelte-z6ih7p");
    			attr_dev(button1, "type", "submit");
    			button1.value = "Submit";
    			add_location(button1, file$1, 187, 3, 6541);
    			attr_dev(div3, "class", "d-grid my-3");
    			add_location(div3, file$1, 183, 2, 6362);
    			add_location(form_1, file$1, 136, 1, 4469);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$1, 135, 0, 4444);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(div0, t2);
    			append_dev(div0, hr);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(p0, span);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, form_1);
    			append_dev(form_1, label);
    			append_dev(form_1, br);
    			append_dev(form_1, t9);
    			append_dev(form_1, div1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div1, null);
    			}

    			append_dev(form_1, t10);
    			append_dev(form_1, div2);
    			append_dev(div2, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th);
    			append_dev(tr0, t11);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr0, null);
    			}

    			append_dev(thead, t12);
    			append_dev(thead, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t14);
    			append_dev(tr1, td1);
    			append_dev(tr1, t16);
    			append_dev(tr1, td2);
    			append_dev(tr1, t18);
    			append_dev(tr1, td3);
    			append_dev(tr1, t20);
    			append_dev(tr1, td4);
    			append_dev(tr1, t22);
    			append_dev(tr1, td5);
    			append_dev(tr1, t24);
    			append_dev(tr1, td6);
    			append_dev(tr1, t26);
    			append_dev(tr1, td7);
    			append_dev(thead, t28);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(thead, null);
    			}

    			append_dev(form_1, t29);
    			append_dev(form_1, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t31);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_4*/ ctx[20], false, false, false),
    					action_destroyer(form_action = /*form*/ ctx[8].call(null, form_1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*currUser*/ 32) set_data_dev(t1, /*currUser*/ ctx[5]);

    			if (dirty[0] & /*locs, changeLocColor*/ 2112) {
    				each_value_3 = locationNames;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_3(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_3.length;
    			}

    			if (dirty[0] & /*ud, clickVCheckbox*/ 8208) {
    				each_value_2 = days;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*currAvail, dt, changeThisColor, ut, clickCheckbox*/ 5133) {
    				each_value = times;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(thead, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function changeColor(color) {
    	if (color == "gray") {
    		return "green";
    	}

    	if (color == "green") {
    		return "yellow";
    	}

    	return "gray";
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $currentUserNum;
    	let $vchecks;
    	let $checks;
    	let $locations;
    	let $availabilities;
    	let $data;
    	validate_store(currentUserNum, 'currentUserNum');
    	component_subscribe($$self, currentUserNum, $$value => $$invalidate(22, $currentUserNum = $$value));
    	validate_store(vchecks, 'vchecks');
    	component_subscribe($$self, vchecks, $$value => $$invalidate(23, $vchecks = $$value));
    	validate_store(checks, 'checks');
    	component_subscribe($$self, checks, $$value => $$invalidate(24, $checks = $$value));
    	validate_store(locations, 'locations');
    	component_subscribe($$self, locations, $$value => $$invalidate(25, $locations = $$value));
    	validate_store(availabilities, 'availabilities');
    	component_subscribe($$self, availabilities, $$value => $$invalidate(26, $availabilities = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Collection', slots, []);
    	let { initialValues } = $$props;
    	let { onSubmit } = $$props;
    	let { onBack } = $$props;
    	let currUser;
    	let boxes;
    	let locs;

    	// PL concept: writable stores, reactive values #reactive
    	checks.subscribe(val => {
    		boxes = val[$currentUserNum];
    	});

    	users.subscribe(val => {
    		$$invalidate(5, currUser = val[$currentUserNum]);
    	});

    	locations.subscribe(val => {
    		$$invalidate(6, locs = val[$currentUserNum]);
    	});

    	const { form, data } = createForm$1({ onSubmit, initialValues });
    	validate_store(data, 'data');
    	component_subscribe($$self, data, value => $$invalidate(7, $data = value));
    	let { dt = [] } = $$props;
    	let { currAvail } = $$props;

    	availabilities.subscribe(val => {
    		$$invalidate(0, currAvail = val[$currentUserNum]);
    	});

    	let { ut = [] } = $$props;

    	for (let i = 0; i < times.length; i++) {
    		ut.push(times[i] + currUser);
    	}

    	let { ud = [] } = $$props;

    	for (let i = 0; i < days.length; i++) {
    		ud.push(days[i] + currUser);
    	}

    	for (let i = 0; i < times.length; i++) {
    		dt.push([]);

    		for (let j = 0; j < days.length; j++) {
    			dt[i].push(days[j] + times[i]);
    		}
    	}

    	// rotate the color of a specific cell, or, if called from checkbox,
    	// change to a fixed color
    	// concepts: availability preference, logic-based rendering
    	function changeThisColor(id, i, j, auto) {
    		// if just clicking one box
    		if (auto == "auto") {
    			let currColor = document.getElementById(id).style.background;
    			document.getElementById(id).style.background = changeColor(currColor);

    			if (currColor == "green") {
    				boxes[i] = false;
    				set_store_value(checks, $checks[$currentUserNum][i] = boxes[i], $checks);
    				set_store_value(vchecks, $vchecks[$currentUserNum][j] = false, $vchecks);
    				document.getElementById(ud[j]).checked = false;
    				document.getElementById(ut[i]).checked = false;
    			}
    		} else {
    			// if calling from a checkbox
    			document.getElementById(id).style.background = auto;
    		}

    		// update writable stores with new user data
    		$$invalidate(0, currAvail[i][j] = document.getElementById(id).style.background, currAvail);

    		set_store_value(availabilities, $availabilities[$currentUserNum][i][j] = currAvail[i][j], $availabilities);
    	}

    	// change color for a location preference
    	// concept: location, availability conditioned on location
    	function changeLocColor(id, i) {
    		let currColor = document.getElementById(id).style.background;
    		document.getElementById(id).style.background = changeColor(currColor);
    		$$invalidate(6, locs[i] = document.getElementById(id).style.background, locs);
    		set_store_value(locations, $locations[$currentUserNum][i] = locs[i], $locations);
    	}

    	// click a horizontal checkbox indicating availability for all 7 days
    	// for one time slot
    	// concept: logic-based rendering, binary availability
    	// can only toggle between all green & all gray
    	function clickCheckbox(row) {
    		console.log("checkbox clicked at ", row);

    		if (document.getElementById(ut[row]).checked) {
    			for (let j = 0; j < days.length; j++) {
    				changeThisColor(dt[row][j], row, j, "green");
    			}

    			boxes[row] = false;
    		} else {
    			for (let j = 0; j < days.length; j++) {
    				changeThisColor(dt[row][j], row, j, "gray");
    			}

    			boxes[row] = true;
    		}

    		set_store_value(checks, $checks[$currentUserNum][row] = boxes[row], $checks);
    	}

    	// same as above, but for vertical checkboxes, indicating availability
    	// for all times on one day
    	function clickVCheckbox(column) {
    		if (document.getElementById(ud[column]).checked) {
    			for (let j = 0; j < times.length; j++) {
    				changeThisColor(dt[j][column], j, column, "green");
    			}

    			set_store_value(vchecks, $vchecks[$currentUserNum][column] = false, $vchecks);
    		} else {
    			for (let j = 0; j < times.length; j++) {
    				changeThisColor(dt[j][column], j, column, "gray");
    			}

    			set_store_value(vchecks, $vchecks[$currentUserNum][column] = true, $vchecks);
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (initialValues === undefined && !('initialValues' in $$props || $$self.$$.bound[$$self.$$.props['initialValues']])) {
    			console_1.warn("<Collection> was created without expected prop 'initialValues'");
    		}

    		if (onSubmit === undefined && !('onSubmit' in $$props || $$self.$$.bound[$$self.$$.props['onSubmit']])) {
    			console_1.warn("<Collection> was created without expected prop 'onSubmit'");
    		}

    		if (onBack === undefined && !('onBack' in $$props || $$self.$$.bound[$$self.$$.props['onBack']])) {
    			console_1.warn("<Collection> was created without expected prop 'onBack'");
    		}

    		if (currAvail === undefined && !('currAvail' in $$props || $$self.$$.bound[$$self.$$.props['currAvail']])) {
    			console_1.warn("<Collection> was created without expected prop 'currAvail'");
    		}
    	});

    	const writable_props = ['initialValues', 'onSubmit', 'onBack', 'dt', 'currAvail', 'ut', 'ud'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Collection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (location, i) => changeLocColor(location, i);
    	const click_handler_1 = i => clickVCheckbox(i);
    	const click_handler_2 = i => clickCheckbox(i);
    	const click_handler_3 = (i, j) => changeThisColor(dt[i][j], i, j, "auto");
    	const click_handler_4 = () => onBack($data);

    	$$self.$$set = $$props => {
    		if ('initialValues' in $$props) $$invalidate(14, initialValues = $$props.initialValues);
    		if ('onSubmit' in $$props) $$invalidate(15, onSubmit = $$props.onSubmit);
    		if ('onBack' in $$props) $$invalidate(1, onBack = $$props.onBack);
    		if ('dt' in $$props) $$invalidate(2, dt = $$props.dt);
    		if ('currAvail' in $$props) $$invalidate(0, currAvail = $$props.currAvail);
    		if ('ut' in $$props) $$invalidate(3, ut = $$props.ut);
    		if ('ud' in $$props) $$invalidate(4, ud = $$props.ud);
    	};

    	$$self.$capture_state = () => ({
    		createForm: createForm$1,
    		writable,
    		users,
    		numUsers,
    		currentUserNum,
    		availabilities,
    		checks,
    		locations,
    		startTimes,
    		endTimes,
    		timerNumber,
    		days,
    		times,
    		locationNames,
    		vchecks,
    		initialValues,
    		onSubmit,
    		onBack,
    		currUser,
    		boxes,
    		locs,
    		form,
    		data,
    		dt,
    		currAvail,
    		ut,
    		ud,
    		changeColor,
    		changeThisColor,
    		changeLocColor,
    		clickCheckbox,
    		clickVCheckbox,
    		$currentUserNum,
    		$vchecks,
    		$checks,
    		$locations,
    		$availabilities,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('initialValues' in $$props) $$invalidate(14, initialValues = $$props.initialValues);
    		if ('onSubmit' in $$props) $$invalidate(15, onSubmit = $$props.onSubmit);
    		if ('onBack' in $$props) $$invalidate(1, onBack = $$props.onBack);
    		if ('currUser' in $$props) $$invalidate(5, currUser = $$props.currUser);
    		if ('boxes' in $$props) boxes = $$props.boxes;
    		if ('locs' in $$props) $$invalidate(6, locs = $$props.locs);
    		if ('dt' in $$props) $$invalidate(2, dt = $$props.dt);
    		if ('currAvail' in $$props) $$invalidate(0, currAvail = $$props.currAvail);
    		if ('ut' in $$props) $$invalidate(3, ut = $$props.ut);
    		if ('ud' in $$props) $$invalidate(4, ud = $$props.ud);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currAvail,
    		onBack,
    		dt,
    		ut,
    		ud,
    		currUser,
    		locs,
    		$data,
    		form,
    		data,
    		changeThisColor,
    		changeLocColor,
    		clickCheckbox,
    		clickVCheckbox,
    		initialValues,
    		onSubmit,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Collection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				initialValues: 14,
    				onSubmit: 15,
    				onBack: 1,
    				dt: 2,
    				currAvail: 0,
    				ut: 3,
    				ud: 4
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Collection",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get initialValues() {
    		throw new Error("<Collection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialValues(value) {
    		throw new Error("<Collection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onSubmit() {
    		throw new Error("<Collection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSubmit(value) {
    		throw new Error("<Collection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBack() {
    		throw new Error("<Collection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBack(value) {
    		throw new Error("<Collection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dt() {
    		throw new Error("<Collection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dt(value) {
    		throw new Error("<Collection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currAvail() {
    		throw new Error("<Collection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currAvail(value) {
    		throw new Error("<Collection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ut() {
    		throw new Error("<Collection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ut(value) {
    		throw new Error("<Collection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ud() {
    		throw new Error("<Collection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ud(value) {
    		throw new Error("<Collection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Summary.svelte generated by Svelte v3.55.1 */

    const file$2 = "src/components/Summary.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (174:1) {:else}
    function create_else_block_4(ctx) {
    	let p;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Summary Unavailable: Please enter availability first.";
    			attr_dev(span, "class", "bolded room svelte-1mul8vl");
    			add_location(span, file$2, 174, 17, 4672);
    			attr_dev(p, "class", "lead");
    			add_location(p, file$2, 174, 1, 4656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(174:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:1) {#if $users.length >= 1 }
    function create_if_block(ctx) {
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let div1;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let div2;
    	let table0;
    	let thead0;
    	let tr0;
    	let t8;
    	let tr1;
    	let t9;
    	let div3;
    	let table1;
    	let thead1;
    	let tr2;
    	let td0;
    	let t11;
    	let td1;
    	let t13;
    	let td2;
    	let t15;
    	let td3;
    	let t17;
    	let td4;
    	let t19;
    	let td5;
    	let t21;
    	let td6;
    	let t23;
    	let td7;
    	let t25;
    	let mounted;
    	let dispose;
    	let each_value_3 = locationNames;
    	validate_each_argument(each_value_3);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	let each_value_2 = locationNames;
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each_value = times;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Toggle between 'Definitely Available' and 'Include Possibles'";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Note: 'Include Possibles' adds if need be availabilities to definite availabilities";
    			t3 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Definitely Available";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Include Possibles";
    			t7 = space();
    			div2 = element("div");
    			table0 = element("table");
    			thead0 = element("thead");
    			tr0 = element("tr");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t8 = space();
    			tr1 = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t9 = space();
    			div3 = element("div");
    			table1 = element("table");
    			thead1 = element("thead");
    			tr2 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Time";
    			t11 = space();
    			td1 = element("td");
    			td1.textContent = "Monday";
    			t13 = space();
    			td2 = element("td");
    			td2.textContent = "Tuesday";
    			t15 = space();
    			td3 = element("td");
    			td3.textContent = "Wednesday";
    			t17 = space();
    			td4 = element("td");
    			td4.textContent = "Thursday";
    			t19 = space();
    			td5 = element("td");
    			td5.textContent = "Friday";
    			t21 = space();
    			td6 = element("td");
    			td6.textContent = "Saturday";
    			t23 = space();
    			td7 = element("td");
    			td7.textContent = "Sunday";
    			t25 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p0, "class", "lead room svelte-1mul8vl");
    			add_location(p0, file$2, 75, 2, 1663);
    			attr_dev(p1, "class", "room bolded svelte-1mul8vl");
    			add_location(p1, file$2, 76, 2, 1752);
    			add_location(div0, file$2, 74, 1, 1655);
    			attr_dev(button0, "class", "btn btn-primary btn-login text-uppercase fw-bold room svelte-1mul8vl");
    			attr_dev(button0, "type", "button");
    			button0.value = "avail";
    			add_location(button0, file$2, 79, 8, 1906);
    			attr_dev(button1, "class", "btn btn-primary btn-login text-uppercase fw-bold less svelte-1mul8vl");
    			attr_dev(button1, "type", "button");
    			button1.value = "need";
    			add_location(button1, file$2, 82, 8, 2088);
    			attr_dev(div1, "class", "d-grid my-3");
    			add_location(div1, file$2, 78, 1, 1872);
    			attr_dev(tr0, "class", "bg-light-gray");
    			add_location(tr0, file$2, 90, 4, 2475);
    			add_location(tr1, file$2, 95, 4, 2614);
    			add_location(thead0, file$2, 89, 3, 2463);
    			attr_dev(table0, "class", "table table-bordered text-center");
    			add_location(table0, file$2, 88, 2, 2411);
    			attr_dev(div2, "class", "table-responsive");
    			add_location(div2, file$2, 86, 1, 2294);
    			attr_dev(td0, "class", "text-uppercase freeze");
    			add_location(td0, file$2, 130, 5, 3492);
    			attr_dev(td1, "class", "text-uppercase freeze");
    			add_location(td1, file$2, 132, 5, 3547);
    			attr_dev(td2, "class", "text-uppercase freeze");
    			add_location(td2, file$2, 133, 5, 3598);
    			attr_dev(td3, "class", "text-uppercase freeze");
    			add_location(td3, file$2, 134, 5, 3650);
    			attr_dev(td4, "class", "text-uppercase freeze");
    			add_location(td4, file$2, 135, 5, 3704);
    			attr_dev(td5, "class", "text-uppercase freeze");
    			add_location(td5, file$2, 136, 5, 3757);
    			attr_dev(td6, "class", "text-uppercase freeze");
    			add_location(td6, file$2, 137, 5, 3808);
    			attr_dev(td7, "class", "text-uppercase freeze");
    			add_location(td7, file$2, 138, 5, 3861);
    			attr_dev(tr2, "class", "bg-light-gray");
    			add_location(tr2, file$2, 129, 4, 3460);
    			add_location(thead1, file$2, 128, 3, 3448);
    			attr_dev(table1, "class", "table table-bordered text-center");
    			add_location(table1, file$2, 127, 2, 3396);
    			attr_dev(div3, "class", "table-responsive");
    			add_location(div3, file$2, 125, 1, 3279);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, table0);
    			append_dev(table0, thead0);
    			append_dev(thead0, tr0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(tr0, null);
    			}

    			append_dev(thead0, t8);
    			append_dev(thead0, tr1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr1, null);
    			}

    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, table1);
    			append_dev(table1, thead1);
    			append_dev(thead1, tr2);
    			append_dev(tr2, td0);
    			append_dev(tr2, t11);
    			append_dev(tr2, td1);
    			append_dev(tr2, t13);
    			append_dev(tr2, td2);
    			append_dev(tr2, t15);
    			append_dev(tr2, td3);
    			append_dev(tr2, t17);
    			append_dev(tr2, td4);
    			append_dev(tr2, t19);
    			append_dev(tr2, td5);
    			append_dev(tr2, t21);
    			append_dev(tr2, td6);
    			append_dev(tr2, t23);
    			append_dev(tr2, td7);
    			append_dev(thead1, t25);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(thead1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*locationNames*/ 0) {
    				each_value_3 = locationNames;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_3$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(tr0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_3.length;
    			}

    			if (dirty & /*availLocs, screen, needLocs*/ 56) {
    				each_value_2 = locationNames;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*days, availSums, screen, needSums, times*/ 38) {
    				each_value = times;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(thead1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(74:1) {#if $users.length >= 1 }",
    		ctx
    	});

    	return block;
    }

    // (92:5) {#each locationNames as ln, i}
    function create_each_block_3$1(ctx) {
    	let td;
    	let t_value = /*ln*/ ctx[21] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "text-uppercase freeze");
    			add_location(td, file$2, 92, 5, 2543);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(92:5) {#each locationNames as ln, i}",
    		ctx
    	});

    	return block;
    }

    // (114:6) {:else}
    function create_else_block_3(ctx) {
    	let td;
    	let t0_value = /*needLocs*/ ctx[4][/*i*/ ctx[17]] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#F5F5F5");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 114, 6, 3086);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t0);
    			append_dev(td, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*needLocs*/ 16 && t0_value !== (t0_value = /*needLocs*/ ctx[4][/*i*/ ctx[17]] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(114:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (110:6) {#if needLocs[i] > 0}
    function create_if_block_6(ctx) {
    	let td;
    	let t0_value = /*needLocs*/ ctx[4][/*i*/ ctx[17]] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#FFFACD");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 110, 8, 2978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t0);
    			append_dev(td, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*needLocs*/ 16 && t0_value !== (t0_value = /*needLocs*/ ctx[4][/*i*/ ctx[17]] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(110:6) {#if needLocs[i] > 0}",
    		ctx
    	});

    	return block;
    }

    // (98:5) {#if screen == 0}
    function create_if_block_4(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*availLocs*/ ctx[3][/*i*/ ctx[17]] > 0) return create_if_block_5;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(98:5) {#if screen == 0}",
    		ctx
    	});

    	return block;
    }

    // (104:8) {:else}
    function create_else_block_2(ctx) {
    	let td;
    	let t0_value = /*availLocs*/ ctx[3][/*i*/ ctx[17]] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#F5F5F5");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 104, 6, 2827);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t0);
    			append_dev(td, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availLocs*/ 8 && t0_value !== (t0_value = /*availLocs*/ ctx[3][/*i*/ ctx[17]] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(104:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (99:6) {#if availLocs[i] > 0}
    function create_if_block_5(ctx) {
    	let td;
    	let t0_value = /*availLocs*/ ctx[3][/*i*/ ctx[17]] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#FFFACD");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 100, 8, 2716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t0);
    			append_dev(td, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availLocs*/ 8 && t0_value !== (t0_value = /*availLocs*/ ctx[3][/*i*/ ctx[17]] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(99:6) {#if availLocs[i] > 0}",
    		ctx
    	});

    	return block;
    }

    // (97:5) {#each locationNames as ln, i}
    function create_each_block_2$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*screen*/ ctx[5] == 0) return create_if_block_4;
    		if (/*needLocs*/ ctx[4][/*i*/ ctx[17]] > 0) return create_if_block_6;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(97:5) {#each locationNames as ln, i}",
    		ctx
    	});

    	return block;
    }

    // (162:6) {:else}
    function create_else_block_1(ctx) {
    	let td;
    	let t_value = /*needSums*/ ctx[2][/*i*/ ctx[17]][/*j*/ ctx[20]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#F5F5F5");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 162, 6, 4460);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*needSums*/ 4 && t_value !== (t_value = /*needSums*/ ctx[2][/*i*/ ctx[17]][/*j*/ ctx[20]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(162:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (158:6) {#if needSums[i][j] > 0}
    function create_if_block_3(ctx) {
    	let td;
    	let t_value = /*needSums*/ ctx[2][/*i*/ ctx[17]][/*j*/ ctx[20]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#FFFACD");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 158, 8, 4349);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*needSums*/ 4 && t_value !== (t_value = /*needSums*/ ctx[2][/*i*/ ctx[17]][/*j*/ ctx[20]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(158:6) {#if needSums[i][j] > 0}",
    		ctx
    	});

    	return block;
    }

    // (146:5) {#if screen == 0}
    function create_if_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_4(ctx, dirty) {
    		if (/*availSums*/ ctx[1][/*i*/ ctx[17]][/*j*/ ctx[20]] > 0) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(146:5) {#if screen == 0}",
    		ctx
    	});

    	return block;
    }

    // (152:8) {:else}
    function create_else_block(ctx) {
    	let td;
    	let t_value = /*availSums*/ ctx[1][/*i*/ ctx[17]][/*j*/ ctx[20]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#F5F5F5");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 152, 6, 4190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availSums*/ 2 && t_value !== (t_value = /*availSums*/ ctx[1][/*i*/ ctx[17]][/*j*/ ctx[20]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(152:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (147:6) {#if availSums[i][j] > 0}
    function create_if_block_2(ctx) {
    	let td;
    	let t_value = /*availSums*/ ctx[1][/*i*/ ctx[17]][/*j*/ ctx[20]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", "#FFFACD");
    			set_style(td, "color", "black");
    			add_location(td, file$2, 148, 8, 4076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availSums*/ 2 && t_value !== (t_value = /*availSums*/ ctx[1][/*i*/ ctx[17]][/*j*/ ctx[20]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(147:6) {#if availSums[i][j] > 0}",
    		ctx
    	});

    	return block;
    }

    // (144:5) {#each days as day, j}
    function create_each_block_1$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (/*screen*/ ctx[5] == 0) return create_if_block_1;
    		if (/*needSums*/ ctx[2][/*i*/ ctx[17]][/*j*/ ctx[20]] > 0) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(144:5) {#each days as day, j}",
    		ctx
    	});

    	return block;
    }

    // (141:4) {#each times as time, i}
    function create_each_block$1(ctx) {
    	let tr;
    	let td;
    	let t0_value = /*time*/ ctx[15] + "";
    	let t0;
    	let t1;
    	let t2;
    	let tr_id_value;
    	let each_value_1 = days;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(td, file$2, 142, 5, 3967);
    			attr_dev(tr, "id", tr_id_value = /*i*/ ctx[17]);
    			add_location(tr, file$2, 141, 4, 3950);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, t0);
    			append_dev(tr, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availSums, screen, needSums*/ 38) {
    				each_value_1 = days;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(141:4) {#each times as time, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let body;
    	let div0;
    	let h1;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$users*/ ctx[6].length >= 1) return create_if_block;
    		return create_else_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			body = element("body");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Availability Summary";
    			t1 = space();
    			div1 = element("div");
    			if_block.c();
    			t2 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Back";
    			attr_dev(h1, "class", "display-4");
    			add_location(h1, file$2, 70, 8, 1561);
    			attr_dev(div0, "class", "jumbotron");
    			add_location(div0, file$2, 69, 4, 1529);
    			add_location(div1, file$2, 72, 1, 1621);
    			attr_dev(button, "class", "btn btn-primary btn-login text-uppercase fw-bold room svelte-1mul8vl");
    			attr_dev(button, "type", "button");
    			button.value = "Back";
    			add_location(button, file$2, 178, 8, 4816);
    			attr_dev(div2, "class", "d-grid my-3");
    			add_location(div2, file$2, 177, 4, 4782);
    			add_location(body, file$2, 68, 0, 1518);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div0);
    			append_dev(div0, h1);
    			append_dev(body, t1);
    			append_dev(body, div1);
    			if_block.m(div1, null);
    			append_dev(body, t2);
    			append_dev(body, div2);
    			append_dev(div2, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $availabilities;
    	let $locations;
    	let $numUsers;
    	let $users;
    	validate_store(availabilities, 'availabilities');
    	component_subscribe($$self, availabilities, $$value => $$invalidate(12, $availabilities = $$value));
    	validate_store(locations, 'locations');
    	component_subscribe($$self, locations, $$value => $$invalidate(13, $locations = $$value));
    	validate_store(numUsers, 'numUsers');
    	component_subscribe($$self, numUsers, $$value => $$invalidate(14, $numUsers = $$value));
    	validate_store(users, 'users');
    	component_subscribe($$self, users, $$value => $$invalidate(6, $users = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Summary', slots, []);
    	let { onBack } = $$props;

    	// summary structures
    	let availSums = [];

    	let needSums = [];
    	let availLocs = [0, 0, 0, 0, 0];
    	let needLocs = [0, 0, 0, 0, 0];

    	// create summaries only if there is at least one user
    	if ($numUsers > 0) {
    		for (let i = 0; i < times.length; i++) {
    			availSums.push([]);
    			needSums.push([]);

    			for (let j = 0; j < days.length; j++) {
    				availSums[i].push(0);
    				needSums[i].push(0);
    			}
    		}

    		for (let u = 0; u < $numUsers; u++) {
    			for (let i = 0; i < locationNames.length; i++) {
    				if ($locations[u][i] === "green") {
    					availLocs[i] += 1;
    					needLocs[i] += 1;
    				} else if ($locations[u][i] === "yellow") {
    					needLocs[i] += 1;
    				}
    			}

    			for (let i = 0; i < times.length; i++) {
    				for (let j = 0; j < days.length; j++) {
    					if ($availabilities[u][i][j] === "green") {
    						availSums[i][j] += 1;
    						needSums[i][j] += 1;
    					} else if ($availabilities[u][i][j] === "yellow") {
    						needSums[i][j] += 1;
    					}
    				}
    			}
    		}
    	}

    	// functions to toggle available vs if need be summaries
    	let screen = 0;

    	function setAvail() {
    		if (screen == 0) {
    			return;
    		} else {
    			$$invalidate(5, screen -= 1);
    		}
    	}

    	function setNeed() {
    		if (screen == 1) {
    			return;
    		} else {
    			$$invalidate(5, screen += 1);
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (onBack === undefined && !('onBack' in $$props || $$self.$$.bound[$$self.$$.props['onBack']])) {
    			console.warn("<Summary> was created without expected prop 'onBack'");
    		}
    	});

    	const writable_props = ['onBack'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => setAvail();
    	const click_handler_1 = () => setNeed();
    	const click_handler_2 = () => onBack();

    	$$self.$$set = $$props => {
    		if ('onBack' in $$props) $$invalidate(0, onBack = $$props.onBack);
    	};

    	$$self.$capture_state = () => ({
    		createForm: createForm$1,
    		writable,
    		users,
    		numUsers,
    		currentUserNum,
    		availabilities,
    		checks,
    		locations,
    		startTimes,
    		endTimes,
    		timerNumber,
    		days,
    		times,
    		locationNames,
    		vchecks,
    		onBack,
    		availSums,
    		needSums,
    		availLocs,
    		needLocs,
    		screen,
    		setAvail,
    		setNeed,
    		$availabilities,
    		$locations,
    		$numUsers,
    		$users
    	});

    	$$self.$inject_state = $$props => {
    		if ('onBack' in $$props) $$invalidate(0, onBack = $$props.onBack);
    		if ('availSums' in $$props) $$invalidate(1, availSums = $$props.availSums);
    		if ('needSums' in $$props) $$invalidate(2, needSums = $$props.needSums);
    		if ('availLocs' in $$props) $$invalidate(3, availLocs = $$props.availLocs);
    		if ('needLocs' in $$props) $$invalidate(4, needLocs = $$props.needLocs);
    		if ('screen' in $$props) $$invalidate(5, screen = $$props.screen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		onBack,
    		availSums,
    		needSums,
    		availLocs,
    		needLocs,
    		screen,
    		$users,
    		setAvail,
    		setNeed,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { onBack: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get onBack() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBack(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { console: console_1$1 } = globals;

    function create_fragment$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*pages*/ ctx[2][/*page*/ ctx[0]];

    	function switch_props(ctx) {
    		return {
    			props: {
    				onSubmit: /*onSubmit*/ ctx[3],
    				onBack: /*onBack*/ ctx[4],
    				onSummary: /*onSummary*/ ctx[5],
    				initialValues: /*pagesState*/ ctx[1][/*page*/ ctx[0]]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*pagesState, page*/ 3) switch_instance_changes.initialValues = /*pagesState*/ ctx[1][/*page*/ ctx[0]];

    			if (switch_value !== (switch_value = /*pages*/ ctx[2][/*page*/ ctx[0]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function hasName(userStructure, targetName) {
    	for (let i = 0; i < userStructure.length; i++) {
    		if (userStructure[i] == targetName) {
    			return i;
    		}
    	}

    	return -1;
    }

    // convert final availabilities from color to indicator
    // concept: preference over binary availability
    function convert(color) {
    	if (color == "gray") {
    		return "not available";
    	}

    	if (color == "green") {
    		return "available";
    	}

    	return "if need be";
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $numUsers;
    	let $checks;
    	let $availabilities;
    	let $locations;
    	let $users;
    	let $usersForTime;
    	let $startTimes;
    	let $endTimes;
    	let $timerNumber;
    	validate_store(numUsers, 'numUsers');
    	component_subscribe($$self, numUsers, $$value => $$invalidate(6, $numUsers = $$value));
    	validate_store(checks, 'checks');
    	component_subscribe($$self, checks, $$value => $$invalidate(7, $checks = $$value));
    	validate_store(availabilities, 'availabilities');
    	component_subscribe($$self, availabilities, $$value => $$invalidate(8, $availabilities = $$value));
    	validate_store(locations, 'locations');
    	component_subscribe($$self, locations, $$value => $$invalidate(9, $locations = $$value));
    	validate_store(users, 'users');
    	component_subscribe($$self, users, $$value => $$invalidate(10, $users = $$value));
    	validate_store(usersForTime, 'usersForTime');
    	component_subscribe($$self, usersForTime, $$value => $$invalidate(11, $usersForTime = $$value));
    	validate_store(startTimes, 'startTimes');
    	component_subscribe($$self, startTimes, $$value => $$invalidate(12, $startTimes = $$value));
    	validate_store(endTimes, 'endTimes');
    	component_subscribe($$self, endTimes, $$value => $$invalidate(13, $endTimes = $$value));
    	validate_store(timerNumber, 'timerNumber');
    	component_subscribe($$self, timerNumber, $$value => $$invalidate(14, $timerNumber = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const pages = [Login, Collection, Summary];
    	let currUser;

    	startTimes.subscribe(val => {
    		
    	});

    	// The current page of our form.
    	let page = 0;

    	// The state of all of our pages
    	let pagesState = [];

    	// Our handlers
    	function onSubmit(values) {
    		if (page === 1) {
    			// On our final page with POST our data somewhere
    			$$invalidate(1, pagesState[page] = values, pagesState);

    			$$invalidate(1, pagesState);
    			$$invalidate(0, page = 0);

    			// timer for in-class competition
    			let endTime = Date.now();

    			endTimes.set($endTimes.concat([endTime]));
    			console.log($endTimes[$timerNumber] - $startTimes[$timerNumber]);

    			const downloadFile = () => {
    				const link = document.createElement("a");
    				let content = "Name, Start Time, End Time, Duration (Milliseconds)\n";

    				for (let i = 0; i < $usersForTime.length; i++) {
    					content = content + $usersForTime[i] + "," + new Date($startTimes[i]).toString() + "," + new Date($endTimes[i]).toString() + "," + ($endTimes[i] - $startTimes[i]).toString() + "\n";
    				}

    				const file = new Blob([content], { type: 'text/plain' });
    				link.href = URL.createObjectURL(file);
    				link.download = "timelogs.csv";
    				link.click();
    				URL.revokeObjectURL(link.href);
    			};

    			downloadFile();
    		} else {
    			// If we're not on the last page, store our data and increase a step
    			// timing for in-class competition
    			let startTime = Date.now();

    			startTimes.set($startTimes.concat([startTime]));
    			timerNumber.update(n => n + 1);
    			$$invalidate(1, pagesState[page] = values, pagesState);
    			usersForTime.set($usersForTime.concat([values["firstName"] + " " + values["lastName"]]));
    			let alreadyHere = hasName($users, values["firstName"] + " " + values["lastName"]);

    			if (alreadyHere != -1) {
    				// allow existing users to edit their responses by paging to their entry in stored data
    				currentUserNum.set(alreadyHere);
    			} else {
    				// create new user - concept: login
    				numUsers.update(n => n + 1);

    				users.set($users.concat([values["firstName"] + " " + values["lastName"]]));
    				let ca = [];
    				let ch = [];

    				for (let i = 0; i < times.length; i++) {
    					ca.push([]);
    					ch.push(false);

    					for (let j = 0; j < days.length; j++) {
    						ca[i].push("gray");
    					}
    				}

    				// concept: default availability = unavailable, location preferences
    				locations.set($locations.concat([["gray", "gray", "gray", "gray", "gray"]]));

    				availabilities.set($availabilities.concat([ca]));

    				// store checkbox data to allow faster selection
    				// concept: logic-based rendering of times
    				checks.set($checks.concat([ch]));

    				vchecks.set($checks.concat([["gray", "gray", "gray", "gray", "gray", "gray", "gray"]]));
    				currentUserNum.set($numUsers - 1);
    			}

    			$$invalidate(1, pagesState); // Triggering update
    			$$invalidate(0, page += 1);
    		}
    	}

    	function onBack(values) {
    		if (page === 0) return; else if (page === 1) {
    			$$invalidate(1, pagesState[page] = values, pagesState);
    			$$invalidate(1, pagesState); // Triggering update
    			$$invalidate(0, page -= 1);
    		} else {
    			//pagesState[page] = values;
    			$$invalidate(1, pagesState);

    			$$invalidate(0, page = 0);
    		}
    	}

    	function onSummary(values) {
    		if (page === 0) {
    			//pagesState = pagesState;
    			$$invalidate(0, page = 2);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Login,
    		Collection,
    		Summary,
    		users,
    		numUsers,
    		availabilities,
    		currentUserNum,
    		checks,
    		locations,
    		startTimes,
    		endTimes,
    		timerNumber,
    		days,
    		times,
    		locationNames,
    		usersForTime,
    		vchecks,
    		writable,
    		pages,
    		currUser,
    		page,
    		pagesState,
    		hasName,
    		convert,
    		onSubmit,
    		onBack,
    		onSummary,
    		$numUsers,
    		$checks,
    		$availabilities,
    		$locations,
    		$users,
    		$usersForTime,
    		$startTimes,
    		$endTimes,
    		$timerNumber
    	});

    	$$self.$inject_state = $$props => {
    		if ('currUser' in $$props) currUser = $$props.currUser;
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('pagesState' in $$props) $$invalidate(1, pagesState = $$props.pagesState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, pagesState, pages, onSubmit, onBack, onSummary];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
