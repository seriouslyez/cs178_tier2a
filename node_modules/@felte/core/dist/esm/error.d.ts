export type FailResponse = Omit<Response, 'ok'> & {
    ok: false;
};
export type SuccessResponse = Omit<Response, 'ok'> & {
    ok: true;
};
export type FetchResponse = SuccessResponse | FailResponse;
export declare class FelteSubmitError extends Error {
    constructor(message: string, response: FailResponse);
    response: FailResponse;
}
//# sourceMappingURL=error.d.ts.map