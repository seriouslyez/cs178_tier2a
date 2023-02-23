import type { Readable } from '@felte/common';
type Store<Data> = Readable<Data> | {
    subscribe(subscriber: (value: Data) => void): {
        unsubscribe(): void;
    };
};
export declare function get<Data>(store: Store<Data>): Data;
export {};
//# sourceMappingURL=get.d.ts.map