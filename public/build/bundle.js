
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
        node.parentNode.removeChild(node);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/FilterButton.svelte generated by Svelte v3.24.1 */

    const file = "src/components/FilterButton.svelte";

    function create_fragment(ctx) {
    	let div;
    	let button0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let button0_aria_pressed_value;
    	let t5;
    	let button1;
    	let span3;
    	let t7;
    	let span4;
    	let t9;
    	let span5;
    	let button1_aria_pressed_value;
    	let t11;
    	let button2;
    	let span6;
    	let t13;
    	let span7;
    	let t15;
    	let span8;
    	let button2_aria_pressed_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "Show";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "All";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "tasks";
    			t5 = space();
    			button1 = element("button");
    			span3 = element("span");
    			span3.textContent = "Show";
    			t7 = space();
    			span4 = element("span");
    			span4.textContent = "Active";
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "tasks";
    			t11 = space();
    			button2 = element("button");
    			span6 = element("span");
    			span6.textContent = "Show";
    			t13 = space();
    			span7 = element("span");
    			span7.textContent = "Completed";
    			t15 = space();
    			span8 = element("span");
    			span8.textContent = "tasks";
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file, 8, 6, 332);
    			add_location(span1, file, 9, 6, 380);
    			attr_dev(span2, "class", "visually-hidden");
    			add_location(span2, file, 10, 6, 403);
    			attr_dev(button0, "class", "btn toggle-btn");
    			attr_dev(button0, "aria-pressed", button0_aria_pressed_value = /*filter*/ ctx[0] === "all");
    			toggle_class(button0, "btn__primary", /*filter*/ ctx[0] === "all");
    			add_location(button0, file, 7, 4, 191);
    			attr_dev(span3, "class", "visually-hidden");
    			add_location(span3, file, 13, 6, 614);
    			add_location(span4, file, 14, 6, 662);
    			attr_dev(span5, "class", "visually-hidden");
    			add_location(span5, file, 15, 6, 688);
    			attr_dev(button1, "class", "btn toggle-btn");
    			attr_dev(button1, "aria-pressed", button1_aria_pressed_value = /*filter*/ ctx[0] === "active");
    			toggle_class(button1, "btn__primary", /*filter*/ ctx[0] === "active");
    			add_location(button1, file, 12, 4, 464);
    			attr_dev(span6, "class", "visually-hidden");
    			add_location(span6, file, 18, 6, 908);
    			add_location(span7, file, 19, 6, 956);
    			attr_dev(span8, "class", "visually-hidden");
    			add_location(span8, file, 20, 6, 985);
    			attr_dev(button2, "class", "btn toggle-btn");
    			attr_dev(button2, "aria-pressed", button2_aria_pressed_value = /*filter*/ ctx[0] === "completed");
    			toggle_class(button2, "btn__primary", /*filter*/ ctx[0] === "completed");
    			add_location(button2, file, 17, 4, 749);
    			attr_dev(div, "class", "filters btn-group stack-exception");
    			add_location(div, file, 6, 2, 139);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, span0);
    			append_dev(button0, t1);
    			append_dev(button0, span1);
    			append_dev(button0, t3);
    			append_dev(button0, span2);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, span3);
    			append_dev(button1, t7);
    			append_dev(button1, span4);
    			append_dev(button1, t9);
    			append_dev(button1, span5);
    			append_dev(div, t11);
    			append_dev(div, button2);
    			append_dev(button2, span6);
    			append_dev(button2, t13);
    			append_dev(button2, span7);
    			append_dev(button2, t15);
    			append_dev(button2, span8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 1 && button0_aria_pressed_value !== (button0_aria_pressed_value = /*filter*/ ctx[0] === "all")) {
    				attr_dev(button0, "aria-pressed", button0_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 1) {
    				toggle_class(button0, "btn__primary", /*filter*/ ctx[0] === "all");
    			}

    			if (dirty & /*filter*/ 1 && button1_aria_pressed_value !== (button1_aria_pressed_value = /*filter*/ ctx[0] === "active")) {
    				attr_dev(button1, "aria-pressed", button1_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 1) {
    				toggle_class(button1, "btn__primary", /*filter*/ ctx[0] === "active");
    			}

    			if (dirty & /*filter*/ 1 && button2_aria_pressed_value !== (button2_aria_pressed_value = /*filter*/ ctx[0] === "completed")) {
    				attr_dev(button2, "aria-pressed", button2_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 1) {
    				toggle_class(button2, "btn__primary", /*filter*/ ctx[0] === "completed");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { filter = "all" } = $$props;
    	const writable_props = ["filter"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FilterButton> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FilterButton", $$slots, []);
    	const click_handler = () => $$invalidate(0, filter = "all");
    	const click_handler_1 = () => $$invalidate(0, filter = "active");
    	const click_handler_2 = () => $$invalidate(0, filter = "completed");

    	$$self.$$set = $$props => {
    		if ("filter" in $$props) $$invalidate(0, filter = $$props.filter);
    	};

    	$$self.$capture_state = () => ({ filter });

    	$$self.$inject_state = $$props => {
    		if ("filter" in $$props) $$invalidate(0, filter = $$props.filter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filter, click_handler, click_handler_1, click_handler_2];
    }

    class FilterButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { filter: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FilterButton",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get filter() {
    		throw new Error("<FilterButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filter(value) {
    		throw new Error("<FilterButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function selectOnFocus(node) {
        if (node && node.select === 'function') {
            const onFocus = (event) => node.select();
            node.addEventListener('focus', onFocus);
            return {
                destroy: () => node.removeEventListener('focus', onFocus)
            }
        }
    }

    /* src/components/Todo.svelte generated by Svelte v3.24.1 */
    const file$1 = "src/components/Todo.svelte";

    // (69:4) {:else}
    function create_else_block(ctx) {
    	let div0;
    	let input;
    	let input_id_value;
    	let input_checked_value;
    	let t0;
    	let label;
    	let t1_value = /*todo*/ ctx[0].name + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let div1;
    	let button0;
    	let t3;
    	let span0;
    	let t4_value = /*todo*/ ctx[0].name + "";
    	let t4;
    	let focusEditButton_action;
    	let t5;
    	let button1;
    	let t6;
    	let span1;
    	let t7_value = /*todo*/ ctx[0].name + "";
    	let t7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t3 = text("Edit");
    			span0 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			button1 = element("button");
    			t6 = text("Delete");
    			span1 = element("span");
    			t7 = text(t7_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = "todo-" + /*todo*/ ctx[0].id);
    			input.checked = input_checked_value = /*todo*/ ctx[0].completed;
    			add_location(input, file$1, 71, 8, 2550);
    			attr_dev(label, "for", label_for_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(label, "class", "todo-label");
    			add_location(label, file$1, 74, 8, 2666);
    			attr_dev(div0, "class", "c-cb");
    			add_location(div0, file$1, 70, 6, 2523);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$1, 78, 14, 2871);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn");
    			add_location(button0, file$1, 77, 8, 2784);
    			attr_dev(span1, "class", "visually-hidden");
    			add_location(span1, file$1, 81, 16, 3030);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn__danger");
    			add_location(button1, file$1, 80, 8, 2947);
    			attr_dev(div1, "class", "btn-group");
    			add_location(div1, file$1, 76, 6, 2752);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(button0, t3);
    			append_dev(button0, span0);
    			append_dev(span0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(button1, t6);
    			append_dev(button1, span1);
    			append_dev(span1, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*onToggle*/ ctx[9], false, false, false),
    					listen_dev(button0, "click", /*onEdit*/ ctx[7], false, false, false),
    					action_destroyer(focusEditButton_action = /*focusEditButton*/ ctx[8].call(null, button0)),
    					listen_dev(button1, "click", /*onRemove*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todo*/ 1 && input_id_value !== (input_id_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*todo*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[0].completed)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todo*/ 1 && t1_value !== (t1_value = /*todo*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*todo*/ 1 && label_for_value !== (label_for_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*todo*/ 1 && t4_value !== (t4_value = /*todo*/ ctx[0].name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*todo*/ 1 && t7_value !== (t7_value = /*todo*/ ctx[0].name + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(69:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (52:4) {#if editing}
    function create_if_block(ctx) {
    	let form;
    	let div0;
    	let label;
    	let t0;
    	let t1_value = /*todo*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let label_for_value;
    	let t3;
    	let input;
    	let input_id_value;
    	let selectOnFocus_action;
    	let t4;
    	let div1;
    	let button0;
    	let t5;
    	let span0;
    	let t6;
    	let t7_value = /*todo*/ ctx[0].name + "";
    	let t7;
    	let t8;
    	let button1;
    	let t9;
    	let span1;
    	let t10;
    	let t11_value = /*todo*/ ctx[0].name + "";
    	let t11;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			label = element("label");
    			t0 = text("New name for '");
    			t1 = text(t1_value);
    			t2 = text("'");
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t5 = text("Cancel");
    			span0 = element("span");
    			t6 = text("renaming ");
    			t7 = text(t7_value);
    			t8 = space();
    			button1 = element("button");
    			t9 = text("Save");
    			span1 = element("span");
    			t10 = text("new name for ");
    			t11 = text(t11_value);
    			attr_dev(label, "for", label_for_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(label, "class", "todo-label");
    			add_location(label, file$1, 55, 10, 1502);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", input_id_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "class", "todo-text");
    			add_location(input, file$1, 56, 10, 1594);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$1, 54, 8, 1467);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$1, 61, 18, 2130);
    			attr_dev(button0, "class", "btn todo-cancel");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$1, 60, 10, 2045);
    			attr_dev(span1, "class", "visually-hidden");
    			add_location(span1, file$1, 64, 16, 2311);
    			attr_dev(button1, "class", "btn btn__primary todo-edit");
    			attr_dev(button1, "type", "submit");
    			button1.disabled = button1_disabled_value = !/*name*/ ctx[2];
    			add_location(button1, file$1, 63, 10, 2220);
    			attr_dev(div1, "class", "btn-group");
    			add_location(div1, file$1, 59, 8, 2011);
    			attr_dev(form, "class", "stack-small");
    			add_location(form, file$1, 53, 6, 1345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			append_dev(div0, label);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			set_input_value(input, /*name*/ ctx[2]);
    			/*input_binding*/ ctx[11](input);
    			append_dev(form, t4);
    			append_dev(form, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t5);
    			append_dev(button0, span0);
    			append_dev(span0, t6);
    			append_dev(span0, t7);
    			append_dev(div1, t8);
    			append_dev(div1, button1);
    			append_dev(button1, t9);
    			append_dev(button1, span1);
    			append_dev(span1, t10);
    			append_dev(span1, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					action_destroyer(selectOnFocus_action = selectOnFocus.call(null, input)),
    					listen_dev(button0, "click", /*onCancel*/ ctx[4], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*onSave*/ ctx[5]), false, true, false),
    					listen_dev(form, "keydown", /*keydown_handler*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todo*/ 1 && t1_value !== (t1_value = /*todo*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*todo*/ 1 && label_for_value !== (label_for_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*todo*/ 1 && input_id_value !== (input_id_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*name*/ 4 && input.value !== /*name*/ ctx[2]) {
    				set_input_value(input, /*name*/ ctx[2]);
    			}

    			if (dirty & /*todo*/ 1 && t7_value !== (t7_value = /*todo*/ ctx[0].name + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*todo*/ 1 && t11_value !== (t11_value = /*todo*/ ctx[0].name + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*name*/ 4 && button1_disabled_value !== (button1_disabled_value = !/*name*/ ctx[2])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			/*input_binding*/ ctx[11](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(52:4) {#if editing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*editing*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "stack-small");
    			add_location(div, file$1, 50, 2, 1213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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
    	const dispatch = createEventDispatcher();
    	let { todo } = $$props;
    	let editing = false;
    	let name = todo.name;
    	let nameEl;
    	let editButtonPressed = false;

    	function update(updatedTodo) {
    		$$invalidate(0, todo = { ...todo, ...updatedTodo });
    		dispatch("update", todo);
    	}

    	function onCancel() {
    		$$invalidate(2, name = todo.name);
    		$$invalidate(1, editing = false);
    	}

    	function onSave() {
    		update({ name });
    		$$invalidate(1, editing = false);
    	}

    	function onRemove() {
    		dispatch("remove", todo);
    	}

    	function onEdit() {
    		editButtonPressed = true;
    		$$invalidate(1, editing = true);
    	}

    	const focusEditButton = node => editButtonPressed && node.focus();

    	function onToggle() {
    		update({ completed: !todo.completed });
    	}

    	const writable_props = ["todo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Todo", $$slots, []);

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			nameEl = $$value;
    			$$invalidate(3, nameEl);
    		});
    	}

    	const keydown_handler = e => e.key === "Escape" && onCancel();

    	$$self.$$set = $$props => {
    		if ("todo" in $$props) $$invalidate(0, todo = $$props.todo);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		tick,
    		selectOnFocus,
    		dispatch,
    		todo,
    		editing,
    		name,
    		nameEl,
    		editButtonPressed,
    		update,
    		onCancel,
    		onSave,
    		onRemove,
    		onEdit,
    		focusEditButton,
    		onToggle
    	});

    	$$self.$inject_state = $$props => {
    		if ("todo" in $$props) $$invalidate(0, todo = $$props.todo);
    		if ("editing" in $$props) $$invalidate(1, editing = $$props.editing);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("nameEl" in $$props) $$invalidate(3, nameEl = $$props.nameEl);
    		if ("editButtonPressed" in $$props) editButtonPressed = $$props.editButtonPressed;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todo,
    		editing,
    		name,
    		nameEl,
    		onCancel,
    		onSave,
    		onRemove,
    		onEdit,
    		focusEditButton,
    		onToggle,
    		input_input_handler,
    		input_binding,
    		keydown_handler
    	];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { todo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todo*/ ctx[0] === undefined && !("todo" in props)) {
    			console.warn("<Todo> was created without expected prop 'todo'");
    		}
    	}

    	get todo() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todo(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/MoreActions.svelte generated by Svelte v3.24.1 */
    const file$2 = "src/components/MoreActions.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let button0;
    	let t0_value = (/*completed*/ ctx[1] ? "Check" : "Uncheck") + "";
    	let t0;
    	let t1;
    	let button0_disabled_value;
    	let t2;
    	let button1;
    	let t3;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = text(" all");
    			t2 = space();
    			button1 = element("button");
    			t3 = text("Remove completed");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn__primary");
    			button0.disabled = button0_disabled_value = /*todos*/ ctx[0].length === 0;
    			add_location(button0, file$2, 22, 4, 918);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn__primary");
    			button1.disabled = button1_disabled_value = /*completedTodos*/ ctx[2] === 0;
    			add_location(button1, file$2, 23, 4, 1066);
    			attr_dev(div, "class", "btn-group");
    			add_location(div, file$2, 21, 0, 890);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(button0, t1);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(button1, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*checkAll*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*removeCompleted*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completed*/ 2 && t0_value !== (t0_value = (/*completed*/ ctx[1] ? "Check" : "Uncheck") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && button0_disabled_value !== (button0_disabled_value = /*todos*/ ctx[0].length === 0)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*completedTodos*/ 4 && button1_disabled_value !== (button1_disabled_value = /*completedTodos*/ ctx[2] === 0)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { todos } = $$props; // todos is also received as a #Property here with the export line, so that I can set the disabled property on each button when there is no elements in the todos array
    	let completed = true;

    	const checkAll = () => {
    		dispatch("checkAll", completed);
    		$$invalidate(1, completed = !completed);
    	};

    	const removeCompleted = () => dispatch("removeCompleted");
    	const writable_props = ["todos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MoreActions> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MoreActions", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		todos,
    		completed,
    		checkAll,
    		removeCompleted,
    		completedTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    		if ("completed" in $$props) $$invalidate(1, completed = $$props.completed);
    		if ("completedTodos" in $$props) $$invalidate(2, completedTodos = $$props.completedTodos);
    	};

    	let completedTodos;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 1) {
    			 $$invalidate(2, completedTodos = todos.filter(t => t.completed).length); // completedTodos has been declared as a #Reactive variable so that the Remove Completed button is disabled if there are no completed elements in the array
    		}
    	};

    	return [todos, completed, completedTodos, checkAll, removeCompleted];
    }

    class MoreActions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { todos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MoreActions",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todos*/ ctx[0] === undefined && !("todos" in props)) {
    			console.warn("<MoreActions> was created without expected prop 'todos'");
    		}
    	}

    	get todos() {
    		throw new Error("<MoreActions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<MoreActions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/NewTodo.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$3 = "src/components/NewTodo.svelte";

    function create_fragment$3(ctx) {
    	let form;
    	let h2;
    	let label;
    	let t1;
    	let input;
    	let selectOnFocus_action;
    	let t2;
    	let button;
    	let t3;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			h2 = element("h2");
    			label = element("label");
    			label.textContent = "What needs to be done?";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			t3 = text("Add");
    			attr_dev(label, "for", "todo-0");
    			attr_dev(label, "class", "label__lg");
    			add_location(label, file$3, 32, 6, 839);
    			attr_dev(h2, "class", "label-wrapper");
    			add_location(h2, file$3, 31, 4, 806);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "todo-0");
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "class", "input input__lg");
    			add_location(input, file$3, 35, 4, 977);
    			attr_dev(button, "type", "submit");
    			button.disabled = button_disabled_value = !/*name*/ ctx[0];
    			attr_dev(button, "class", "btn btn__primary btn__lg");
    			add_location(button, file$3, 36, 4, 1113);
    			add_location(form, file$3, 30, 2, 707);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h2);
    			append_dev(h2, label);
    			append_dev(form, t1);
    			append_dev(form, input);
    			set_input_value(input, /*name*/ ctx[0]);
    			/*input_binding*/ ctx[6](input);
    			append_dev(form, t2);
    			append_dev(form, button);
    			append_dev(button, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					action_destroyer(selectOnFocus_action = selectOnFocus.call(null, input)),
    					listen_dev(form, "submit", prevent_default(/*addTodo*/ ctx[2]), false, true, false),
    					listen_dev(form, "keydown", /*keydown_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && input.value !== /*name*/ ctx[0]) {
    				set_input_value(input, /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1 && button_disabled_value !== (button_disabled_value = !/*name*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			/*input_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
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

    function instance$3($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { autofocus = false } = $$props; // autofocus #Property is added
    	let name = "";
    	let nameEl; // reference to the name input DOM node

    	const addTodo = () => {
    		dispatch("addTodo", name);
    		$$invalidate(0, name = "");
    		nameEl.focus();
    	};

    	const onCancel = () => {
    		$$invalidate(0, name = "");
    		nameEl.focus();
    	};

    	console.log("initializing:", nameEl);
    	onMount(() => autofocus && nameEl.focus());
    	const writable_props = ["autofocus"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<NewTodo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NewTodo", $$slots, []);

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			nameEl = $$value;
    			$$invalidate(1, nameEl);
    		});
    	}

    	const keydown_handler = e => e.key === "Escape" && onCancel();

    	$$self.$$set = $$props => {
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		selectOnFocus,
    		dispatch,
    		autofocus,
    		name,
    		nameEl,
    		addTodo,
    		onCancel
    	});

    	$$self.$inject_state = $$props => {
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("nameEl" in $$props) $$invalidate(1, nameEl = $$props.nameEl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		nameEl,
    		addTodo,
    		onCancel,
    		autofocus,
    		input_input_handler,
    		input_binding,
    		keydown_handler
    	];
    }

    class NewTodo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { autofocus: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewTodo",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get autofocus() {
    		throw new Error("<NewTodo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autofocus(value) {
    		throw new Error("<NewTodo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TodosStatus.svelte generated by Svelte v3.24.1 */

    const file$4 = "src/components/TodosStatus.svelte";

    function create_fragment$4(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(/*completedTodos*/ ctx[2]);
    			t1 = text(" out of ");
    			t2 = text(/*totalTodos*/ ctx[1]);
    			t3 = text(" items completed");
    			attr_dev(h2, "id", "list-heading");
    			attr_dev(h2, "tabindex", "-1");
    			add_location(h2, file$4, 20, 0, 975);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			/*h2_binding*/ ctx[5](h2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completedTodos*/ 4) set_data_dev(t0, /*completedTodos*/ ctx[2]);
    			if (dirty & /*totalTodos*/ 2) set_data_dev(t2, /*totalTodos*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			/*h2_binding*/ ctx[5](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { todos } = $$props; //#Properties ... with export, we are able to mark todos as a property so that we can accept a todos attribute

    	//#Reactive values are used for listening to DOM events; in this case, totalTodos and completedTodos are both instatiated when the script is executed and afterwards, Svelte will automatically update them whenever they change based on the array itself.
    	let headingEl;

    	function focus() {
    		// shorter version: export const focus = () => headingEl.focus()
    		headingEl.focus();
    	}

    	const writable_props = ["todos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodosStatus> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TodosStatus", $$slots, []);

    	function h2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			headingEl = $$value;
    			$$invalidate(0, headingEl);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("todos" in $$props) $$invalidate(3, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		todos,
    		headingEl,
    		focus,
    		totalTodos,
    		completedTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("todos" in $$props) $$invalidate(3, todos = $$props.todos);
    		if ("headingEl" in $$props) $$invalidate(0, headingEl = $$props.headingEl);
    		if ("totalTodos" in $$props) $$invalidate(1, totalTodos = $$props.totalTodos);
    		if ("completedTodos" in $$props) $$invalidate(2, completedTodos = $$props.completedTodos);
    	};

    	let totalTodos;
    	let completedTodos;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 8) {
    			 $$invalidate(1, totalTodos = todos.length);
    		}

    		if ($$self.$$.dirty & /*todos*/ 8) {
    			 $$invalidate(2, completedTodos = todos.filter(todo => todo.completed).length);
    		}
    	};

    	return [headingEl, totalTodos, completedTodos, todos, focus, h2_binding];
    }

    class TodosStatus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { todos: 3, focus: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodosStatus",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todos*/ ctx[3] === undefined && !("todos" in props)) {
    			console.warn("<TodosStatus> was created without expected prop 'todos'");
    		}
    	}

    	get todos() {
    		throw new Error("<TodosStatus>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<TodosStatus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focus() {
    		return this.$$.ctx[4];
    	}

    	set focus(value) {
    		throw new Error("<TodosStatus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Todos.svelte generated by Svelte v3.24.1 */
    const file$5 = "src/components/Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (93:4) {:else}
    function create_else_block$1(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "Nothing to do here!";
    			add_location(li, file$5, 93, 4, 4034);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(93:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (89:4) {#each filterTodos(filter, todos) as todo (todo.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let todo;
    	let t;
    	let current;

    	todo = new Todo({
    			props: { todo: /*todo*/ ctx[19] },
    			$$inline: true
    		});

    	todo.$on("update", /*update_handler*/ ctx[15]);
    	todo.$on("remove", /*remove_handler*/ ctx[16]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			create_component(todo.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "todo");
    			add_location(li, file$5, 89, 4, 3888);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(todo, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todo_changes = {};
    			if (dirty & /*filter, todos*/ 5) todo_changes.todo = /*todo*/ ctx[19];
    			todo.$set(todo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(todo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(89:4) {#each filterTodos(filter, todos) as todo (todo.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let newtodo;
    	let t0;
    	let filterbutton;
    	let updating_filter;
    	let t1;
    	let button0;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let span2;
    	let button0_aria_pressed_value;
    	let t7;
    	let button1;
    	let span3;
    	let t9;
    	let span4;
    	let t11;
    	let span5;
    	let button1_aria_pressed_value;
    	let t13;
    	let button2;
    	let span6;
    	let t15;
    	let span7;
    	let t17;
    	let span8;
    	let button2_aria_pressed_value;
    	let t19;
    	let todosstatus;
    	let t20;
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t21;
    	let moreactions;
    	let current;
    	let mounted;
    	let dispose;

    	newtodo = new NewTodo({
    			props: { autofocus: true },
    			$$inline: true
    		});

    	newtodo.$on("addTodo", /*addTodo_handler*/ ctx[9]);

    	function filterbutton_filter_binding(value) {
    		/*filterbutton_filter_binding*/ ctx[10].call(null, value);
    	}

    	let filterbutton_props = {};

    	if (/*filter*/ ctx[2] !== void 0) {
    		filterbutton_props.filter = /*filter*/ ctx[2];
    	}

    	filterbutton = new FilterButton({
    			props: filterbutton_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(filterbutton, "filter", filterbutton_filter_binding));
    	let todosstatus_props = { todos: /*todos*/ ctx[0] };
    	todosstatus = new TodosStatus({ props: todosstatus_props, $$inline: true });
    	/*todosstatus_binding*/ ctx[14](todosstatus);
    	let each_value = /*filterTodos*/ ctx[5](/*filter*/ ctx[2], /*todos*/ ctx[0]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*todo*/ ctx[19].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$1(ctx);
    	}

    	moreactions = new MoreActions({
    			props: { todos: /*todos*/ ctx[0] },
    			$$inline: true
    		});

    	moreactions.$on("checkAll", /*checkAll_handler*/ ctx[17]);
    	moreactions.$on("removeCompleted", /*removeCompletedTodos*/ ctx[8]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(newtodo.$$.fragment);
    			t0 = space();
    			create_component(filterbutton.$$.fragment);
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "Show";
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "All";
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = "tasks";
    			t7 = space();
    			button1 = element("button");
    			span3 = element("span");
    			span3.textContent = "Show";
    			t9 = space();
    			span4 = element("span");
    			span4.textContent = "Active";
    			t11 = space();
    			span5 = element("span");
    			span5.textContent = "tasks";
    			t13 = space();
    			button2 = element("button");
    			span6 = element("span");
    			span6.textContent = "Show";
    			t15 = space();
    			span7 = element("span");
    			span7.textContent = "Completed";
    			t17 = space();
    			span8 = element("span");
    			span8.textContent = "tasks";
    			t19 = space();
    			create_component(todosstatus.$$.fragment);
    			t20 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t21 = space();
    			create_component(moreactions.$$.fragment);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$5, 57, 6, 2308);
    			add_location(span1, file$5, 58, 6, 2356);
    			attr_dev(span2, "class", "visually-hidden");
    			add_location(span2, file$5, 59, 6, 2379);
    			attr_dev(button0, "class", "btn toggle-btn");
    			attr_dev(button0, "aria-pressed", button0_aria_pressed_value = /*filter*/ ctx[2] === "all");
    			toggle_class(button0, "btn__primary", /*filter*/ ctx[2] === "all");
    			add_location(button0, file$5, 56, 4, 2168);
    			attr_dev(span3, "class", "visually-hidden");
    			add_location(span3, file$5, 62, 6, 2590);
    			add_location(span4, file$5, 63, 6, 2638);
    			attr_dev(span5, "class", "visually-hidden");
    			add_location(span5, file$5, 64, 6, 2664);
    			attr_dev(button1, "class", "btn toggle-btn");
    			attr_dev(button1, "aria-pressed", button1_aria_pressed_value = /*filter*/ ctx[2] === "active");
    			toggle_class(button1, "btn__primary", /*filter*/ ctx[2] === "active");
    			add_location(button1, file$5, 61, 4, 2440);
    			attr_dev(span6, "class", "visually-hidden");
    			add_location(span6, file$5, 67, 6, 2884);
    			add_location(span7, file$5, 68, 6, 2932);
    			attr_dev(span8, "class", "visually-hidden");
    			add_location(span8, file$5, 69, 6, 2961);
    			attr_dev(button2, "class", "btn toggle-btn");
    			attr_dev(button2, "aria-pressed", button2_aria_pressed_value = /*filter*/ ctx[2] === "completed");
    			toggle_class(button2, "btn__primary", /*filter*/ ctx[2] === "completed");
    			add_location(button2, file$5, 66, 4, 2725);
    			attr_dev(ul, "role", "list");
    			attr_dev(ul, "class", "todo-list stack-large");
    			attr_dev(ul, "aria-labelledby", "list-heading");
    			add_location(ul, file$5, 81, 2, 3307);
    			attr_dev(div, "class", "todoapp stack-large");
    			add_location(div, file$5, 45, 0, 1638);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(newtodo, div, null);
    			append_dev(div, t0);
    			mount_component(filterbutton, div, null);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(button0, span0);
    			append_dev(button0, t3);
    			append_dev(button0, span1);
    			append_dev(button0, t5);
    			append_dev(button0, span2);
    			append_dev(div, t7);
    			append_dev(div, button1);
    			append_dev(button1, span3);
    			append_dev(button1, t9);
    			append_dev(button1, span4);
    			append_dev(button1, t11);
    			append_dev(button1, span5);
    			append_dev(div, t13);
    			append_dev(div, button2);
    			append_dev(button2, span6);
    			append_dev(button2, t15);
    			append_dev(button2, span7);
    			append_dev(button2, t17);
    			append_dev(button2, span8);
    			append_dev(div, t19);
    			mount_component(todosstatus, div, null);
    			append_dev(div, t20);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			append_dev(div, t21);
    			mount_component(moreactions, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const filterbutton_changes = {};

    			if (!updating_filter && dirty & /*filter*/ 4) {
    				updating_filter = true;
    				filterbutton_changes.filter = /*filter*/ ctx[2];
    				add_flush_callback(() => updating_filter = false);
    			}

    			filterbutton.$set(filterbutton_changes);

    			if (!current || dirty & /*filter*/ 4 && button0_aria_pressed_value !== (button0_aria_pressed_value = /*filter*/ ctx[2] === "all")) {
    				attr_dev(button0, "aria-pressed", button0_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 4) {
    				toggle_class(button0, "btn__primary", /*filter*/ ctx[2] === "all");
    			}

    			if (!current || dirty & /*filter*/ 4 && button1_aria_pressed_value !== (button1_aria_pressed_value = /*filter*/ ctx[2] === "active")) {
    				attr_dev(button1, "aria-pressed", button1_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 4) {
    				toggle_class(button1, "btn__primary", /*filter*/ ctx[2] === "active");
    			}

    			if (!current || dirty & /*filter*/ 4 && button2_aria_pressed_value !== (button2_aria_pressed_value = /*filter*/ ctx[2] === "completed")) {
    				attr_dev(button2, "aria-pressed", button2_aria_pressed_value);
    			}

    			if (dirty & /*filter*/ 4) {
    				toggle_class(button2, "btn__primary", /*filter*/ ctx[2] === "completed");
    			}

    			const todosstatus_changes = {};
    			if (dirty & /*todos*/ 1) todosstatus_changes.todos = /*todos*/ ctx[0];
    			todosstatus.$set(todosstatus_changes);

    			if (dirty & /*filterTodos, filter, todos, updateTodo, removeTodo*/ 109) {
    				const each_value = /*filterTodos*/ ctx[5](/*filter*/ ctx[2], /*todos*/ ctx[0]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block$1(ctx);
    					each_1_else.c();
    					each_1_else.m(ul, null);
    				}
    			}

    			const moreactions_changes = {};
    			if (dirty & /*todos*/ 1) moreactions_changes.todos = /*todos*/ ctx[0];
    			moreactions.$set(moreactions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newtodo.$$.fragment, local);
    			transition_in(filterbutton.$$.fragment, local);
    			transition_in(todosstatus.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(moreactions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newtodo.$$.fragment, local);
    			transition_out(filterbutton.$$.fragment, local);
    			transition_out(todosstatus.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(moreactions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(newtodo);
    			destroy_component(filterbutton);
    			/*todosstatus_binding*/ ctx[14](null);
    			destroy_component(todosstatus);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (each_1_else) each_1_else.d();
    			destroy_component(moreactions);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let todosStatus;
    	let { todos = [] } = $$props; //#Properties ... with export, we are able to mark todos as a property so that we can accept a todos attribute

    	function removeTodo(todo) {
    		$$invalidate(0, todos = todos.filter(t => t.id !== todo.id));
    		todosStatus.focus(); // gives focus to the status heading
    	}

    	function addTodo(name) {
    		$$invalidate(0, todos = [...todos, { id: newTodoId, name, completed: false }]);
    	}

    	let filter = "all";

    	const filterTodos = (filter, todos) => filter === "active"
    	? todos.filter(t => !t.completed)
    	: filter === "completed"
    		? todos.filter(t => t.completed)
    		: todos;

    	function updateTodo(todo) {
    		const i = todos.findIndex(t => t.id === todo.id);
    		$$invalidate(0, todos[id] = { ...todos[i], ...todo }, todos);
    	}

    	const checkAllTodos = completed => {
    		todos.forEach((t, i) => $$invalidate(0, todos[i].completed = completed, todos));
    	};

    	const removeCompletedTodos = () => $$invalidate(0, todos = todos.filter(t => !t.completed));
    	const writable_props = ["todos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Todos> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Todos", $$slots, []);
    	const addTodo_handler = e => addTodo(e.detail);

    	function filterbutton_filter_binding(value) {
    		filter = value;
    		$$invalidate(2, filter);
    	}

    	const click_handler = () => $$invalidate(2, filter = "all");
    	const click_handler_1 = () => $$invalidate(2, filter = "active");
    	const click_handler_2 = () => $$invalidate(2, filter = "completed");

    	function todosstatus_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			todosStatus = $$value;
    			$$invalidate(1, todosStatus);
    		});
    	}

    	const update_handler = e => updateTodo(e.detail);
    	const remove_handler = e => removeTodo(e.detail);
    	const checkAll_handler = e => checkAllTodos(e.detail);

    	$$self.$$set = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		listen_dev,
    		FilterButton,
    		Todo,
    		MoreActions,
    		NewTodo,
    		TodosStatus,
    		todosStatus,
    		todos,
    		removeTodo,
    		addTodo,
    		filter,
    		filterTodos,
    		updateTodo,
    		checkAllTodos,
    		removeCompletedTodos,
    		newTodoId
    	});

    	$$self.$inject_state = $$props => {
    		if ("todosStatus" in $$props) $$invalidate(1, todosStatus = $$props.todosStatus);
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    		if ("filter" in $$props) $$invalidate(2, filter = $$props.filter);
    		if ("newTodoId" in $$props) newTodoId = $$props.newTodoId;
    	};

    	let newTodoId;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 1) {
    			 newTodoId = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1; // #Reactive values used for listening to DOM events. This reactive value will make sure that the current value of the id is retained so that when a new todo is added, its id can be created based on the last new id
    		}
    	};

    	return [
    		todos,
    		todosStatus,
    		filter,
    		removeTodo,
    		addTodo,
    		filterTodos,
    		updateTodo,
    		checkAllTodos,
    		removeCompletedTodos,
    		addTodo_handler,
    		filterbutton_filter_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		todosstatus_binding,
    		update_handler,
    		remove_handler,
    		checkAll_handler
    	];
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { todos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todos",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get todos() {
    		throw new Error("<Todos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<Todos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */

    function create_fragment$6(ctx) {
    	let todos_1;
    	let current;

    	todos_1 = new Todos({
    			props: { todos: /*todos*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(todos_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(todos_1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todos_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todos_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todos_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let todos = [
    		{
    			id: 1,
    			name: "Create a Svelte starter app",
    			completed: true
    		},
    		{
    			id: 2,
    			name: "Create your first component",
    			completed: true
    		},
    		{
    			id: 3,
    			name: "Complete the rest of the tutorial",
    			completed: false
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Todos, todos });

    	$$self.$inject_state = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [todos];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
