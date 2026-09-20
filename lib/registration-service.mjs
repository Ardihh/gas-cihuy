import {
  RegistrationInputError,
  buildRegistrationPayload,
} from "./registration-adapter.mjs";

export class RegistrationServiceError extends Error {
  constructor(message, { code, status = null, cause } = {}) {
    super(message);
    this.name = "RegistrationServiceError";
    this.code = code;
    this.status = status;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function getErrorStatus(error) {
  return Number.isInteger(error?.status) ? error.status : null;
}

export async function registerUserWith(request, input) {
  let payload;

  try {
    payload = buildRegistrationPayload(input);
  } catch (error) {
    if (error instanceof RegistrationInputError) {
      throw new RegistrationServiceError("Registration input is invalid.", {
        code: "INVALID_INPUT",
        cause: error,
      });
    }

    throw error;
  }

  try {
    await request("/register", {
      method: "POST",
      auth: false,
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    return { registered: true };
  } catch (error) {
    const status = getErrorStatus(error);

    if ([400, 409, 422].includes(status)) {
      throw new RegistrationServiceError("Registration data was rejected.", {
        code: "INVALID_INPUT",
        status,
        cause: error,
      });
    }

    throw new RegistrationServiceError("Registration service unavailable.", {
      code: "SERVICE_UNAVAILABLE",
      status,
      cause: error,
    });
  }
}
