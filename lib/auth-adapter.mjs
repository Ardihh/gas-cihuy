export class AuthResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthResponseError";
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isPositiveNumericId(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function normalizeUser(value) {
  if (
    !isRecord(value) ||
    !isPositiveNumericId(value.id) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.email) ||
    !isNonEmptyString(value.role)
  ) {
    throw new AuthResponseError("Login response did not contain a valid user.");
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role,
  };
}

function normalizeExpiresIn(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new AuthResponseError("Login response did not contain a valid expires_in.");
  }

  return getSessionMaxAge(value);
}

export function getSessionMaxAge(expiresIn) {
  if (typeof expiresIn !== "number" || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return undefined;
  }

  return Math.floor(expiresIn);
}

export function validateLoginCredentials(email, password) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return false;
  }

  return typeof password === "string" && password.length > 0;
}

export function normalizeLoginResponse(payload) {
  if (!isRecord(payload) || payload.success !== true) {
    throw new AuthResponseError("Login response did not indicate success.");
  }

  const data = payload.data;

  if (!isRecord(data)) {
    throw new AuthResponseError("Login response did not contain a valid data object.");
  }

  if (!isNonEmptyString(data.access_token)) {
    throw new AuthResponseError("Login response did not contain a usable access_token.");
  }

  if (!isNonEmptyString(data.token_type)) {
    throw new AuthResponseError("Login response did not contain a valid token_type.");
  }

  return {
    token: data.access_token,
    tokenType: data.token_type,
    expiresIn: normalizeExpiresIn(data.expires_in),
    user: normalizeUser(data.user),
  };
}

export function normalizeCurrentUserResponse(payload) {
  if (!isRecord(payload) || payload.success !== true) {
    throw new AuthResponseError("Current-user response did not indicate success.");
  }

  const data = payload.data;

  if (
    !isRecord(data) ||
    !isPositiveNumericId(data.user_id) ||
    !isNonEmptyString(data.name) ||
    !isNonEmptyString(data.email) ||
    !isNonEmptyString(data.role)
  ) {
    throw new AuthResponseError("Current-user response did not contain valid data.");
  }

  return {
    id: data.user_id,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}
