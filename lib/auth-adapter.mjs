const SAFE_USER_FIELDS = ["id", "name", "email", "role"];

export class AuthResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthResponseError";
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeUser(value) {
  if (!isRecord(value)) {
    return null;
  }

  const user = {};

  for (const field of SAFE_USER_FIELDS) {
    const fieldValue = value[field];

    if (field === "id") {
      if (
        (typeof fieldValue === "number" && Number.isSafeInteger(fieldValue)) ||
        (typeof fieldValue === "string" && fieldValue.trim() !== "")
      ) {
        user[field] = fieldValue;
      }
      continue;
    }

    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
      user[field] = fieldValue;
    }
  }

  return Object.keys(user).length > 0 ? user : null;
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

  if (typeof payload.token !== "string" || payload.token.trim() === "") {
    throw new AuthResponseError("Login response did not contain a usable token.");
  }

  return {
    token: payload.token,
    tokenType:
      typeof payload.token_type === "string" && payload.token_type.trim() !== ""
        ? payload.token_type
        : "Bearer",
    expiresIn: getSessionMaxAge(payload.expires_in),
    user: normalizeUser(payload.user),
  };
}

export function normalizeCurrentUserResponse(payload) {
  if (!isRecord(payload) || payload.success !== true) {
    throw new AuthResponseError("Current-user response did not indicate success.");
  }

  const session = payload.session;

  if (
    !isRecord(session) ||
    typeof session.user_id !== "number" ||
    !Number.isSafeInteger(session.user_id) ||
    session.user_id <= 0 ||
    typeof session.name !== "string" ||
    session.name.trim() === "" ||
    typeof session.email !== "string" ||
    session.email.trim() === "" ||
    typeof session.role !== "string" ||
    session.role.trim() === ""
  ) {
    throw new AuthResponseError("Current-user response did not contain a valid session.");
  }

  return {
    id: session.user_id,
    name: session.name,
    email: session.email,
    role: session.role,
  };
}
