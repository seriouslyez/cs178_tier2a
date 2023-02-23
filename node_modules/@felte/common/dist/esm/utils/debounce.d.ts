export declare function debounce<T extends unknown[]>(this: any, func: (...v: T) => any, timeout?: number, { onInit, onEnd }?: {
    onInit?: () => void;
    onEnd?: () => void;
}): (...args: T) => void;
//# sourceMappingURL=debounce.d.ts.map