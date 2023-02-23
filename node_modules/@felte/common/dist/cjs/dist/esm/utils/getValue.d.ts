import type { Paths, Traverse, Obj } from '../types';
export declare function getValue<T>(storeValue: T): T;
export declare function getValue<T extends Obj, R>(storeValue: T, selector: (value: T) => R): R;
export declare function getValue<T extends Obj, P extends Paths<T> = Paths<T>>(storeValue: T, path: P): Traverse<T, P>;
export declare function getValue<T>(storeValue: T, selectorOrPath: string | ((value: any) => any)): T;
//# sourceMappingURL=getValue.d.ts.map