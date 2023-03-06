
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
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

    let users = writable([]);
    let numUsers = writable(0);
    let currentUserNum = writable(-1);
    let availabilities = writable([]);
    let checks = writable([]);
    let locations = writable([]);
    let startTimes = writable([]);
    let endTimes = writable([]);
    let timerNumber = writable(-1);
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
    let locationNames = ["Cambridge (River)", "Cambridge (Yard)", 
                              "Cambridge (Quad)", "Allston", "Virtual"];
    let usersForTime = writable([]);

    /* src/components/Page1.svelte generated by Svelte v3.55.1 */
    const file = "src/components/Page1.svelte";

    function create_fragment(ctx) {
    	let body;
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let div3;
    	let h5;
    	let t1;
    	let form_1;
    	let div0;
    	let input0;
    	let t2;
    	let div1;
    	let input1;
    	let t3;
    	let div2;
    	let button;
    	let form_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			body = element("body");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			h5 = element("h5");
    			h5.textContent = "What's your availability?";
    			t1 = space();
    			form_1 = element("form");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t3 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(h5, "class", "card-title text-center mb-5 fw-light fs-5");
    			add_location(h5, file, 19, 5, 584);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "firstName");
    			attr_dev(input0, "placeholder", "First Name");
    			attr_dev(input0, "name", "firstName");
    			input0.value = "";
    			add_location(input0, file, 22, 6, 733);
    			attr_dev(div0, "class", "form-floating mb-3");
    			add_location(div0, file, 21, 4, 694);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "lastName");
    			attr_dev(input1, "placeholder", "Last Name");
    			attr_dev(input1, "name", "lastName");
    			input1.value = "";
    			add_location(input1, file, 25, 6, 896);
    			attr_dev(div1, "class", "form-floating mb-3");
    			add_location(div1, file, 24, 4, 857);
    			attr_dev(button, "class", "btn btn-primary btn-login text-uppercase fw-bold svelte-1mstmo5");
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 29, 6, 1052);
    			attr_dev(div2, "class", "d-grid my-3");
    			add_location(div2, file, 28, 4, 1020);
    			add_location(form_1, file, 20, 5, 674);
    			attr_dev(div3, "class", "card-body p-4 p-sm-5");
    			add_location(div3, file, 18, 3, 544);
    			attr_dev(div4, "class", "card border-0 shadow rounded-3 my-5");
    			add_location(div4, file, 17, 4, 491);
    			attr_dev(div5, "class", "col-sm-9 col-md-7 col-lg-5 mx-auto");
    			add_location(div5, file, 16, 2, 438);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file, 15, 3, 418);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file, 14, 1, 391);
    			attr_dev(body, "class", "svelte-1mstmo5");
    			add_location(body, file, 13, 0, 383);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h5);
    			append_dev(div3, t1);
    			append_dev(div3, form_1);
    			append_dev(form_1, div0);
    			append_dev(div0, input0);
    			append_dev(form_1, t2);
    			append_dev(form_1, div1);
    			append_dev(div1, input1);
    			append_dev(form_1, t3);
    			append_dev(form_1, div2);
    			append_dev(div2, button);

    			if (!mounted) {
    				dispose = action_destroyer(form_action = /*form*/ ctx[0].call(null, form_1));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Page1', slots, []);
    	let { initialValues } = $$props;
    	let { onSubmit } = $$props;
    	let { onBack } = $$props;

    	const { form } = createForm$1({
    		onSubmit,
    		initialValues: { firstName: '', lastName: '' }
    	});

    	$$self.$$.on_mount.push(function () {
    		if (initialValues === undefined && !('initialValues' in $$props || $$self.$$.bound[$$self.$$.props['initialValues']])) {
    			console.warn("<Page1> was created without expected prop 'initialValues'");
    		}

    		if (onSubmit === undefined && !('onSubmit' in $$props || $$self.$$.bound[$$self.$$.props['onSubmit']])) {
    			console.warn("<Page1> was created without expected prop 'onSubmit'");
    		}

    		if (onBack === undefined && !('onBack' in $$props || $$self.$$.bound[$$self.$$.props['onBack']])) {
    			console.warn("<Page1> was created without expected prop 'onBack'");
    		}
    	});

    	const writable_props = ['initialValues', 'onSubmit', 'onBack'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Page1> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('initialValues' in $$props) $$invalidate(1, initialValues = $$props.initialValues);
    		if ('onSubmit' in $$props) $$invalidate(2, onSubmit = $$props.onSubmit);
    		if ('onBack' in $$props) $$invalidate(3, onBack = $$props.onBack);
    	};

    	$$self.$capture_state = () => ({
    		createForm: createForm$1,
    		users,
    		numUsers,
    		initialValues,
    		onSubmit,
    		onBack,
    		form
    	});

    	$$self.$inject_state = $$props => {
    		if ('initialValues' in $$props) $$invalidate(1, initialValues = $$props.initialValues);
    		if ('onSubmit' in $$props) $$invalidate(2, onSubmit = $$props.onSubmit);
    		if ('onBack' in $$props) $$invalidate(3, onBack = $$props.onBack);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [form, initialValues, onSubmit, onBack];
    }

    class Page1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { initialValues: 1, onSubmit: 2, onBack: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page1",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get initialValues() {
    		throw new Error("<Page1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialValues(value) {
    		throw new Error("<Page1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onSubmit() {
    		throw new Error("<Page1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSubmit(value) {
    		throw new Error("<Page1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBack() {
    		throw new Error("<Page1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBack(value) {
    		throw new Error("<Page1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.55.1 */

    const file$1 = "src/components/Button.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	let button_levels = [/*buttonProps*/ ctx[0]];
    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			toggle_class(button, "svelte-1daaqs9", true);
    			add_location(button, file$1, 6, 1, 73);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			if (button.autofocus) button.focus();
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(button, "mouseover", /*mouseover_handler*/ ctx[4], false, false, false),
    					listen_dev(button, "mouseenter", /*mouseenter_handler*/ ctx[5], false, false, false),
    					listen_dev(button, "mouseleave", /*mouseleave_handler*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [/*buttonProps*/ ctx[0]]));
    			toggle_class(button, "svelte-1daaqs9", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	const omit_props_names = [];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let buttonProps = { class: [$$restProps.class] };

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(7, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('$$scope' in $$new_props) $$invalidate(1, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ buttonProps });

    	$$self.$inject_state = $$new_props => {
    		if ('buttonProps' in $$props) $$invalidate(0, buttonProps = $$new_props.buttonProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		buttonProps,
    		$$scope,
    		slots,
    		click_handler,
    		mouseover_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/Page2.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;

    const file$2 = "src/components/Page2.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (106:2) {#each locationNames as location, i}
    function create_each_block_2(ctx) {
    	let div;
    	let button;
    	let t_value = locationNames[/*i*/ ctx[26]] + "";
    	let t;
    	let button_id_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[14](/*location*/ ctx[30], /*i*/ ctx[26]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "id", button_id_value = /*location*/ ctx[30]);
    			set_style(button, "background", /*locs*/ ctx[5][/*i*/ ctx[26]]);
    			set_style(button, "color", "black");
    			set_style(button, "border", "blue 2px");
    			attr_dev(button, "class", "btn btn-primary text-uppercase fw-bold btn-login svelte-1b5ec1a");
    			attr_dev(button, "type", "button");
    			add_location(button, file$2, 107, 3, 3059);
    			attr_dev(div, "class", "d-grid my-3");
    			add_location(div, file$2, 106, 2, 3030);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*locs*/ 32) {
    				set_style(button, "background", /*locs*/ ctx[5][/*i*/ ctx[26]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(106:2) {#each locationNames as location, i}",
    		ctx
    	});

    	return block;
    }

    // (129:6) {#each days as day, j}
    function create_each_block_1(ctx) {
    	let td;
    	let button;
    	let t_value = /*time*/ ctx[24] + "";
    	let t;
    	let td_id_value;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[16](/*i*/ ctx[26], /*j*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			button = element("button");
    			t = text(t_value);
    			set_style(button, "width", "100%");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "notavailable sm btn btn-primary text-uppercase fw-bold");
    			add_location(button, file$2, 130, 7, 4095);
    			attr_dev(td, "nowrap", "");
    			set_style(td, "background", /*currAvail*/ ctx[0][/*i*/ ctx[26]][/*j*/ ctx[29]]);
    			set_style(td, "color", "black");
    			attr_dev(td, "id", td_id_value = /*dt*/ ctx[2][/*i*/ ctx[26]][/*j*/ ctx[29]]);
    			attr_dev(td, "class", "svelte-1b5ec1a");
    			add_location(td, file$2, 129, 8, 4013);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*currAvail*/ 1) {
    				set_style(td, "background", /*currAvail*/ ctx[0][/*i*/ ctx[26]][/*j*/ ctx[29]]);
    			}

    			if (dirty[0] & /*dt*/ 4 && td_id_value !== (td_id_value = /*dt*/ ctx[2][/*i*/ ctx[26]][/*j*/ ctx[29]])) {
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
    		source: "(129:6) {#each days as day, j}",
    		ctx
    	});

    	return block;
    }

    // (126:5) {#each times as time, i}
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

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[15](/*i*/ ctx[26]);
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
    			attr_dev(input, "id", input_id_value = /*ut*/ ctx[3][/*i*/ ctx[26]]);
    			attr_dev(input, "name", input_name_value = /*time*/ ctx[24]);
    			input.value = input_value_value = /*time*/ ctx[24];
    			add_location(input, file$2, 127, 10, 3877);
    			attr_dev(td, "class", "svelte-1b5ec1a");
    			add_location(td, file$2, 127, 6, 3873);
    			attr_dev(tr, "id", tr_id_value = /*i*/ ctx[26]);
    			add_location(tr, file$2, 126, 5, 3855);
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
    				dispose = listen_dev(input, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*ut*/ 8 && input_id_value !== (input_id_value = /*ut*/ ctx[3][/*i*/ ctx[26]])) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty[0] & /*currAvail, dt, changeThisColor*/ 517) {
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
    		source: "(126:5) {#each times as time, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let hr;
    	let t3;
    	let p0;
    	let t5;
    	let p1;
    	let t7;
    	let div4;
    	let form_1;
    	let label;
    	let br;
    	let t9;
    	let t10;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t12;
    	let th1;
    	let t14;
    	let th2;
    	let t16;
    	let th3;
    	let t18;
    	let th4;
    	let t20;
    	let th5;
    	let t22;
    	let th6;
    	let t24;
    	let th7;
    	let t26;
    	let t27;
    	let div2;
    	let button0;
    	let t29;
    	let div3;
    	let button1;
    	let form_action;
    	let mounted;
    	let dispose;
    	let each_value_2 = locationNames;
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
    			t1 = text(/*currUser*/ ctx[4]);
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Select once for \"Available\" and twice for \"If need be\".";
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

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t10 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Time";
    			t12 = space();
    			th1 = element("th");
    			th1.textContent = "Monday";
    			t14 = space();
    			th2 = element("th");
    			th2.textContent = "Tuesday";
    			t16 = space();
    			th3 = element("th");
    			th3.textContent = "Wednesday";
    			t18 = space();
    			th4 = element("th");
    			th4.textContent = "Thursday";
    			t20 = space();
    			th5 = element("th");
    			th5.textContent = "Friday";
    			t22 = space();
    			th6 = element("th");
    			th6.textContent = "Saturday";
    			t24 = space();
    			th7 = element("th");
    			th7.textContent = "Sunday";
    			t26 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t27 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Back";
    			t29 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "Submit";
    			attr_dev(h1, "class", "display-4");
    			add_location(h1, file$2, 96, 1, 2644);
    			attr_dev(hr, "class", "my-4");
    			add_location(hr, file$2, 97, 1, 2706);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file$2, 98, 1, 2725);
    			add_location(p1, file$2, 99, 1, 2802);
    			attr_dev(div0, "class", "jumbotron");
    			add_location(div0, file$2, 95, 0, 2619);
    			attr_dev(label, "for", "aboutMe");
    			set_style(label, "font-size", "1.5em");
    			add_location(label, file$2, 104, 2, 2904);
    			add_location(br, file$2, 104, 82, 2984);
    			attr_dev(th0, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th0, file$2, 115, 6, 3442);
    			attr_dev(th1, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th1, file$2, 117, 6, 3492);
    			attr_dev(th2, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th2, file$2, 118, 6, 3537);
    			attr_dev(th3, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th3, file$2, 119, 6, 3583);
    			attr_dev(th4, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th4, file$2, 120, 6, 3631);
    			attr_dev(th5, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th5, file$2, 121, 6, 3678);
    			attr_dev(th6, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th6, file$2, 122, 6, 3723);
    			attr_dev(th7, "class", "text-uppercase svelte-1b5ec1a");
    			add_location(th7, file$2, 123, 6, 3770);
    			attr_dev(tr, "class", "bg-light-gray svelte-1b5ec1a");
    			add_location(tr, file$2, 114, 5, 3409);
    			add_location(thead, file$2, 113, 4, 3396);
    			attr_dev(table, "class", "table table-bordered text-center svelte-1b5ec1a");
    			add_location(table, file$2, 112, 3, 3343);
    			attr_dev(div1, "class", "table-responsive");
    			add_location(div1, file$2, 111, 2, 3309);
    			attr_dev(button0, "class", "btn btn-primary btn-login text-uppercase fw-bold svelte-1b5ec1a");
    			attr_dev(button0, "type", "button");
    			button0.value = "Back";
    			add_location(button0, file$2, 140, 3, 4403);
    			attr_dev(div2, "class", "d-grid my-3");
    			add_location(div2, file$2, 139, 2, 4374);
    			attr_dev(button1, "class", "btn btn-primary btn-login text-uppercase fw-bold svelte-1b5ec1a");
    			attr_dev(button1, "type", "submit");
    			button1.value = "Submit";
    			add_location(button1, file$2, 144, 3, 4585);
    			attr_dev(div3, "class", "d-grid my-3");
    			add_location(div3, file$2, 143, 2, 4556);
    			add_location(form_1, file$2, 103, 1, 2886);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$2, 102, 0, 2861);
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
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, form_1);
    			append_dev(form_1, label);
    			append_dev(form_1, br);
    			append_dev(form_1, t9);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(form_1, null);
    			}

    			append_dev(form_1, t10);
    			append_dev(form_1, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t12);
    			append_dev(tr, th1);
    			append_dev(tr, t14);
    			append_dev(tr, th2);
    			append_dev(tr, t16);
    			append_dev(tr, th3);
    			append_dev(tr, t18);
    			append_dev(tr, th4);
    			append_dev(tr, t20);
    			append_dev(tr, th5);
    			append_dev(tr, t22);
    			append_dev(tr, th6);
    			append_dev(tr, t24);
    			append_dev(tr, th7);
    			append_dev(thead, t26);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(thead, null);
    			}

    			append_dev(form_1, t27);
    			append_dev(form_1, div2);
    			append_dev(div2, button0);
    			append_dev(form_1, t29);
    			append_dev(form_1, div3);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[17], false, false, false),
    					action_destroyer(form_action = /*form*/ ctx[7].call(null, form_1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*currUser*/ 16) set_data_dev(t1, /*currUser*/ ctx[4]);

    			if (dirty[0] & /*locs, changeLocColor*/ 1056) {
    				each_value_2 = locationNames;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(form_1, t10);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*currAvail, dt, changeThisColor, ut, clickCheckbox*/ 2573) {
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
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function changeColor(color) {
    	if (color == "gray") {
    		return "green";
    	}

    	if (color == "green") {
    		return "yellow";
    	}

    	return "gray";
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $currentUserNum;
    	let $checks;
    	let $locations;
    	let $availabilities;
    	let $data;
    	validate_store(currentUserNum, 'currentUserNum');
    	component_subscribe($$self, currentUserNum, $$value => $$invalidate(19, $currentUserNum = $$value));
    	validate_store(checks, 'checks');
    	component_subscribe($$self, checks, $$value => $$invalidate(20, $checks = $$value));
    	validate_store(locations, 'locations');
    	component_subscribe($$self, locations, $$value => $$invalidate(21, $locations = $$value));
    	validate_store(availabilities, 'availabilities');
    	component_subscribe($$self, availabilities, $$value => $$invalidate(22, $availabilities = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Page2', slots, []);
    	let { initialValues } = $$props;
    	let { onSubmit } = $$props;
    	let { onBack } = $$props;
    	let currUser;
    	let boxes;
    	let locs;

    	checks.subscribe(val => {
    		boxes = val[$currentUserNum];
    	});

    	users.subscribe(val => {
    		$$invalidate(4, currUser = val[$currentUserNum]);
    	});

    	locations.subscribe(val => {
    		$$invalidate(5, locs = val[$currentUserNum]);
    	});

    	const { form, data } = createForm$1({ onSubmit, initialValues });
    	validate_store(data, 'data');
    	component_subscribe($$self, data, value => $$invalidate(6, $data = value));
    	let { dt = [] } = $$props;
    	let { currAvail } = $$props;
    	let putItBackTogether = [];

    	availabilities.subscribe(val => {
    		$$invalidate(0, currAvail = val[$currentUserNum]);
    	});

    	let { ut = [] } = $$props;

    	for (let i = 0; i < times.length; i++) {
    		ut.push(times[i] + currUser);
    	}

    	for (let i = 0; i < times.length; i++) {
    		dt.push([]);

    		for (let j = 0; j < days.length; j++) {
    			dt[i].push(days[j] + times[i]);
    		}
    	}

    	function changeThisColor(id, i, j, auto) {
    		if (auto == "auto") {
    			let currColor = document.getElementById(id).style.background;
    			document.getElementById(id).style.background = changeColor(currColor);

    			if (currColor == "green") {
    				boxes[i] = false;
    				set_store_value(checks, $checks[$currentUserNum][i] = boxes[i], $checks);
    			}
    		} else {
    			document.getElementById(id).style.background = auto;
    		}

    		$$invalidate(0, currAvail[i][j] = document.getElementById(id).style.background, currAvail);
    		set_store_value(availabilities, $availabilities[$currentUserNum][i][j] = currAvail[i][j], $availabilities);
    	}

    	function changeLocColor(id, i) {
    		let currColor = document.getElementById(id).style.background;
    		document.getElementById(id).style.background = changeColor(currColor);
    		$$invalidate(5, locs[i] = document.getElementById(id).style.background, locs);
    		set_store_value(locations, $locations[$currentUserNum][i] = locs[i], $locations);
    	}

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

    	$$self.$$.on_mount.push(function () {
    		if (initialValues === undefined && !('initialValues' in $$props || $$self.$$.bound[$$self.$$.props['initialValues']])) {
    			console_1.warn("<Page2> was created without expected prop 'initialValues'");
    		}

    		if (onSubmit === undefined && !('onSubmit' in $$props || $$self.$$.bound[$$self.$$.props['onSubmit']])) {
    			console_1.warn("<Page2> was created without expected prop 'onSubmit'");
    		}

    		if (onBack === undefined && !('onBack' in $$props || $$self.$$.bound[$$self.$$.props['onBack']])) {
    			console_1.warn("<Page2> was created without expected prop 'onBack'");
    		}

    		if (currAvail === undefined && !('currAvail' in $$props || $$self.$$.bound[$$self.$$.props['currAvail']])) {
    			console_1.warn("<Page2> was created without expected prop 'currAvail'");
    		}
    	});

    	const writable_props = ['initialValues', 'onSubmit', 'onBack', 'dt', 'currAvail', 'ut'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Page2> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (location, i) => changeLocColor(location, i);
    	const click_handler_1 = i => clickCheckbox(i);
    	const click_handler_2 = (i, j) => changeThisColor(dt[i][j], i, j, "auto");
    	const click_handler_3 = () => onBack($data);

    	$$self.$$set = $$props => {
    		if ('initialValues' in $$props) $$invalidate(12, initialValues = $$props.initialValues);
    		if ('onSubmit' in $$props) $$invalidate(13, onSubmit = $$props.onSubmit);
    		if ('onBack' in $$props) $$invalidate(1, onBack = $$props.onBack);
    		if ('dt' in $$props) $$invalidate(2, dt = $$props.dt);
    		if ('currAvail' in $$props) $$invalidate(0, currAvail = $$props.currAvail);
    		if ('ut' in $$props) $$invalidate(3, ut = $$props.ut);
    	};

    	$$self.$capture_state = () => ({
    		createForm: createForm$1,
    		Button,
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
    		putItBackTogether,
    		ut,
    		changeColor,
    		changeThisColor,
    		changeLocColor,
    		clickCheckbox,
    		$currentUserNum,
    		$checks,
    		$locations,
    		$availabilities,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ('initialValues' in $$props) $$invalidate(12, initialValues = $$props.initialValues);
    		if ('onSubmit' in $$props) $$invalidate(13, onSubmit = $$props.onSubmit);
    		if ('onBack' in $$props) $$invalidate(1, onBack = $$props.onBack);
    		if ('currUser' in $$props) $$invalidate(4, currUser = $$props.currUser);
    		if ('boxes' in $$props) boxes = $$props.boxes;
    		if ('locs' in $$props) $$invalidate(5, locs = $$props.locs);
    		if ('dt' in $$props) $$invalidate(2, dt = $$props.dt);
    		if ('currAvail' in $$props) $$invalidate(0, currAvail = $$props.currAvail);
    		if ('putItBackTogether' in $$props) putItBackTogether = $$props.putItBackTogether;
    		if ('ut' in $$props) $$invalidate(3, ut = $$props.ut);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currAvail,
    		onBack,
    		dt,
    		ut,
    		currUser,
    		locs,
    		$data,
    		form,
    		data,
    		changeThisColor,
    		changeLocColor,
    		clickCheckbox,
    		initialValues,
    		onSubmit,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Page2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				initialValues: 12,
    				onSubmit: 13,
    				onBack: 1,
    				dt: 2,
    				currAvail: 0,
    				ut: 3
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page2",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get initialValues() {
    		throw new Error("<Page2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialValues(value) {
    		throw new Error("<Page2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onSubmit() {
    		throw new Error("<Page2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSubmit(value) {
    		throw new Error("<Page2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBack() {
    		throw new Error("<Page2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBack(value) {
    		throw new Error("<Page2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dt() {
    		throw new Error("<Page2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dt(value) {
    		throw new Error("<Page2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currAvail() {
    		throw new Error("<Page2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currAvail(value) {
    		throw new Error("<Page2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ut() {
    		throw new Error("<Page2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ut(value) {
    		throw new Error("<Page2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    	let $currentUserNum;
    	validate_store(numUsers, 'numUsers');
    	component_subscribe($$self, numUsers, $$value => $$invalidate(5, $numUsers = $$value));
    	validate_store(checks, 'checks');
    	component_subscribe($$self, checks, $$value => $$invalidate(6, $checks = $$value));
    	validate_store(availabilities, 'availabilities');
    	component_subscribe($$self, availabilities, $$value => $$invalidate(7, $availabilities = $$value));
    	validate_store(locations, 'locations');
    	component_subscribe($$self, locations, $$value => $$invalidate(8, $locations = $$value));
    	validate_store(users, 'users');
    	component_subscribe($$self, users, $$value => $$invalidate(9, $users = $$value));
    	validate_store(usersForTime, 'usersForTime');
    	component_subscribe($$self, usersForTime, $$value => $$invalidate(10, $usersForTime = $$value));
    	validate_store(startTimes, 'startTimes');
    	component_subscribe($$self, startTimes, $$value => $$invalidate(11, $startTimes = $$value));
    	validate_store(endTimes, 'endTimes');
    	component_subscribe($$self, endTimes, $$value => $$invalidate(12, $endTimes = $$value));
    	validate_store(timerNumber, 'timerNumber');
    	component_subscribe($$self, timerNumber, $$value => $$invalidate(13, $timerNumber = $$value));
    	validate_store(currentUserNum, 'currentUserNum');
    	component_subscribe($$self, currentUserNum, $$value => $$invalidate(14, $currentUserNum = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const pages = [Page1, Page2];
    	let currUser;

    	startTimes.subscribe(val => {
    		
    	});

    	// The current page of our form.
    	let page = 0;

    	// The state of all of our pages
    	let pagesState = [];

    	// Our handlers
    	function onSubmit(values) {
    		if (page === pages.length - 1) {
    			// On our final page with POST our data somewhere
    			$$invalidate(1, pagesState[page] = values, pagesState);

    			$$invalidate(1, pagesState);
    			console.log('Submitted data: ', pagesState);
    			console.log('availabilities: ', $availabilities[$currentUserNum]);
    			$$invalidate(0, page = 0);
    			let endTime = Date.now();
    			endTimes.set($endTimes.concat([endTime]));
    			console.log($endTimes[$timerNumber] - $startTimes[$timerNumber]);

    			const downloadFile = () => {
    				const link = document.createElement("a");
    				let content = "Name,Start Time, End Time, Duration (Milliseconds)\n";

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
    			let startTime = Date.now();

    			startTimes.set($startTimes.concat([startTime]));
    			timerNumber.update(n => n + 1);
    			$$invalidate(1, pagesState[page] = values, pagesState);
    			usersForTime.set($usersForTime.concat([values["firstName"] + " " + values["lastName"]]));
    			let alreadyHere = hasName($users, values["firstName"] + " " + values["lastName"]);

    			if (alreadyHere != -1) {
    				currentUserNum.set(alreadyHere);
    			} else {
    				numUsers.update(n => n + 1);
    				users.set($users.concat([values["firstName"] + " " + values["lastName"]]));
    				let ca = [];
    				let ch = [];

    				for (let i = 0; i < 40; i++) {
    					ca.push([]);
    					ch.push(false);

    					for (let j = 0; j < 7; j++) {
    						ca[i].push("gray");
    					}
    				}

    				locations.set($locations.concat([["gray", "gray", "gray", "gray", "gray"]]));
    				console.log(ca);
    				availabilities.set($availabilities.concat([ca]));
    				checks.set($checks.concat([ch]));
    				console.log(ch);
    				currentUserNum.set($numUsers - 1);
    			}

    			$$invalidate(1, pagesState); // Triggering update
    			$$invalidate(0, page += 1);
    		}
    	}

    	function onBack(values) {
    		if (page === 0) return;
    		$$invalidate(1, pagesState[page] = values, pagesState);
    		$$invalidate(1, pagesState); // Triggering update
    		$$invalidate(0, page -= 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Page1,
    		Page2,
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
    		writable,
    		pages,
    		currUser,
    		page,
    		pagesState,
    		hasName,
    		convert,
    		onSubmit,
    		onBack,
    		$numUsers,
    		$checks,
    		$availabilities,
    		$locations,
    		$users,
    		$usersForTime,
    		$startTimes,
    		$endTimes,
    		$timerNumber,
    		$currentUserNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('currUser' in $$props) currUser = $$props.currUser;
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('pagesState' in $$props) $$invalidate(1, pagesState = $$props.pagesState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, pagesState, pages, onSubmit, onBack];
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
