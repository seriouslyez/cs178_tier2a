class FelteSubmitError extends Error {
    constructor(message, response) {
        super(message);
        this.name = 'FelteSubmitError';
        this.response = response;
    }
}

export { FelteSubmitError };
//# sourceMappingURL=error.js.map
