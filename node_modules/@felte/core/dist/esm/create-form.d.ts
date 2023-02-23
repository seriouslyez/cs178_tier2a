import type { Form, FormConfig, FormConfigWithTransformFn, FormConfigWithoutTransformFn, StoreFactory, Obj, UnknownStores, Stores, KnownStores, Helpers, UnknownHelpers, KnownHelpers } from '@felte/common';
export type Adapters<StoreExt = Record<string, any>> = {
    storeFactory: StoreFactory<StoreExt>;
};
export type CoreForm<Data extends Obj = any> = Form<Data> & {
    cleanup(): void;
    startStores(): () => void;
};
export declare function createForm<Data extends Obj = Obj, Ext extends Obj = Obj, StoreExt = Record<string, any>>(config: FormConfigWithTransformFn<Data> & Ext, adapters: Adapters<StoreExt>): CoreForm<Data> & UnknownHelpers<Data> & UnknownStores<Data, StoreExt>;
export declare function createForm<Data extends Obj = Obj, Ext extends Obj = Obj, StoreExt = Record<string, any>>(config: FormConfigWithoutTransformFn<Data> & Ext, adapters: Adapters<StoreExt>): CoreForm<Data> & KnownHelpers<Data> & KnownStores<Data, StoreExt>;
export declare function createForm<Data extends Obj = Obj, Ext extends Obj = Obj, StoreExt = Record<string, any>>(config: FormConfig<Data> & Ext, adapters: Adapters<StoreExt>): CoreForm<Data> & Helpers<Data> & Stores<Data, StoreExt>;
//# sourceMappingURL=create-form.d.ts.map