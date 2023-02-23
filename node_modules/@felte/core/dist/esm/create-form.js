import { executeTransforms } from '@felte/common';
import { createHelpers } from './helpers.js';
import { createFormAction } from './create-form-action.js';
import { createStores } from './stores.js';
import { deepSetKey } from './deep-set-key.js';

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

export { createForm };
//# sourceMappingURL=create-form.js.map
