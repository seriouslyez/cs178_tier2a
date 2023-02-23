import type { SubmitContext, Obj, CreateSubmitHandlerConfig, AssignableErrors } from '@felte/common';
export type FelteSuccessDetail<Data extends Obj = Obj> = SubmitContext<Data> & {
    response: unknown;
};
export type FelteErrorDetail<Data extends Obj = Obj> = SubmitContext<Data> & {
    error: unknown;
};
export type FelteSuccessEvent<Data extends Obj = any> = CustomEvent<FelteSuccessDetail<Data>>;
export type FelteErrorEvent<Data extends Obj = any> = CustomEvent<FelteErrorDetail<Data>> & {
    errors?: AssignableErrors<Data>;
    setErrors(errors: AssignableErrors<Data>): void;
};
export type FelteSubmitEvent<Data extends Obj = any> = Event & {
    target: HTMLFormElement;
    onSubmit?: CreateSubmitHandlerConfig<Data>['onSubmit'];
    onError?: CreateSubmitHandlerConfig<Data>['onError'];
    onSuccess?: CreateSubmitHandlerConfig<Data>['onSuccess'];
    handleSubmit(onSubmit: CreateSubmitHandlerConfig<Data>['onSubmit']): void;
    handleError(onError: CreateSubmitHandlerConfig<Data>['onError']): void;
    handleSuccess(onSuccess: CreateSubmitHandlerConfig<Data>['onSuccess']): void;
};
export declare function createEventConstructors<Data extends Obj = any>(): {
    createErrorEvent: (detail: FelteErrorDetail<Data>) => FelteErrorEvent<Data>;
    createSubmitEvent: () => FelteSubmitEvent<Data>;
    createSuccessEvent: (detail: FelteSuccessDetail<Data>) => FelteSuccessEvent<Data>;
};
//# sourceMappingURL=events.d.ts.map