import type { Extender, Obj, Stores, FormConfig, TransformFunction, ExtenderHandler, AddValidatorFn, Helpers, Form } from '@felte/common';
export type FormActionConfig<Data extends Obj> = {
    stores: Stores<Data>;
    config: FormConfig<Data>;
    extender: Extender<Data>[];
    helpers: Helpers<Data, string> & {
        addValidator: AddValidatorFn<Data>;
        addTransformer(transformer: TransformFunction<Data>): void;
    };
    createSubmitHandler: Form<Data>['createSubmitHandler'];
    handleSubmit: Form<Data>['handleSubmit'];
    _setFormNode(node: HTMLFormElement): void;
    _getInitialValues(): Data;
    _setCurrentExtenders(extenders: ExtenderHandler<Data>[]): void;
    _getCurrentExtenders(): ExtenderHandler<Data>[];
};
export declare function createFormAction<Data extends Obj>({ helpers, stores, config, extender, createSubmitHandler, handleSubmit, _setFormNode, _getInitialValues, _setCurrentExtenders, _getCurrentExtenders, }: FormActionConfig<Data>): {
    form: (node: HTMLFormElement) => {
        destroy(): void;
    };
};
//# sourceMappingURL=create-form-action.d.ts.map