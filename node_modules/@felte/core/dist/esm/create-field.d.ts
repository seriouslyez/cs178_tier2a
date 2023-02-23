import type { FieldValue } from '@felte/common';
export type FieldConfig = {
    name: string;
    touchOnChange?: boolean;
    defaultValue?: FieldValue;
    onFormReset?(e: ResetEvent): void;
};
export type Field = {
    field(node: HTMLElement): {
        destroy?(): void;
    };
    onInput(value: FieldValue): void;
    onChange(value: FieldValue): void;
    onBlur(): void;
};
type ResetEvent = Event & {
    target: HTMLFormElement;
};
export declare function createField(name: string, config?: Omit<FieldConfig, 'name'>): Field;
export declare function createField(config: FieldConfig): Field;
export declare function createField(nameOrConfig: FieldConfig | string, config?: Omit<FieldConfig, 'name'>): Field;
export {};
//# sourceMappingURL=create-field.d.ts.map