function createEventConstructors() {
    class SuccessEvent extends CustomEvent {
        constructor(detail) {
            super('feltesuccess', { detail });
        }
    }
    class ErrorEvent extends CustomEvent {
        constructor(detail) {
            super('felteerror', { detail, cancelable: true });
        }
        setErrors(errors) {
            this.preventDefault();
            this.errors = errors;
        }
    }
    class SubmitEvent extends Event {
        constructor() {
            super('feltesubmit', { cancelable: true });
        }
        handleSubmit(onSubmit) {
            this.onSubmit = onSubmit;
        }
        handleError(onError) {
            this.onError = onError;
        }
        handleSuccess(onSuccess) {
            this.onSuccess = onSuccess;
        }
    }
    return {
        createErrorEvent: (detail) => new ErrorEvent(detail),
        createSubmitEvent: () => new SubmitEvent(),
        createSuccessEvent: (detail) => new SuccessEvent(detail),
    };
}

export { createEventConstructors };
//# sourceMappingURL=events.js.map
