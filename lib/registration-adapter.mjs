export class RegistrationInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "RegistrationInputError";
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function buildRegistrationPayload(input) {
  if (!isRecord(input)) {
    throw new RegistrationInputError("Registration input must be an object.");
  }

  const name = readTrimmedString(input.name);
  const email = readTrimmedString(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  const phone = readTrimmedString(input.phone);

  if (!name) {
    throw new RegistrationInputError("Name is required.");
  }

  if (!isValidEmail(email)) {
    throw new RegistrationInputError("A valid email is required.");
  }

  if (!password) {
    throw new RegistrationInputError("Password is required.");
  }

  const payload = { name, email, password };

  if (phone) {
    payload.phone = phone;
  }

  return payload;
}
