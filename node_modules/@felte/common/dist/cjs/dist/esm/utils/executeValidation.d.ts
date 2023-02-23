import type { Obj, ValidationFunction, RecursivePartial } from '../types';
export declare function mergeErrors<Data extends Obj>(errors: (RecursivePartial<Data> | undefined)[]): Data;
export declare function runValidations<Data extends Obj>(values: Data, validationOrValidations?: ValidationFunction<Data>[] | ValidationFunction<Data>): ReturnType<ValidationFunction<Data>>[];
//# sourceMappingURL=executeValidation.d.ts.map