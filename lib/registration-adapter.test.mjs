import assert from "node:assert/strict";
import test from "node:test";

import {
  RegistrationInputError,
  buildRegistrationPayload,
} from "./registration-adapter.mjs";

const validInput = {
  name: "  Ani Kun  ",
  email: "  ani@example.com  ",
  password: "  keep-this-password-exactly  ",
  phone: " 081234567890 ",
};

test("builds the verified registration payload and normalizes non-password fields", () => {
  assert.deepEqual(buildRegistrationPayload(validInput), {
    name: "Ani Kun",
    email: "ani@example.com",
    password: "  keep-this-password-exactly  ",
    phone: "081234567890",
  });
});

test("omits an empty optional phone value", () => {
  assert.deepEqual(
    buildRegistrationPayload({
      name: "Ani Kun",
      email: "ani@example.com",
      password: "secret",
      phone: "   ",
    }),
    {
      name: "Ani Kun",
      email: "ani@example.com",
      password: "secret",
    },
  );
});

test("never forwards role, user IDs, or arbitrary browser fields", () => {
  const payload = buildRegistrationPayload({
    ...validInput,
    role: "admin",
    userId: 99,
    admin: true,
    access_token: "injected-token",
  });

  assert.deepEqual(Object.keys(payload).sort(), ["email", "name", "password", "phone"]);
  assert.equal("role" in payload, false);
  assert.equal("userId" in payload, false);
  assert.equal("admin" in payload, false);
});

test("rejects empty name, email, and password values", () => {
  assert.throws(
    () => buildRegistrationPayload({ ...validInput, name: "   " }),
    RegistrationInputError,
  );
  assert.throws(
    () => buildRegistrationPayload({ ...validInput, email: "   " }),
    RegistrationInputError,
  );
  assert.throws(
    () => buildRegistrationPayload({ ...validInput, password: "" }),
    RegistrationInputError,
  );
});

test("rejects malformed email without inventing password complexity rules", () => {
  assert.throws(
    () => buildRegistrationPayload({ ...validInput, email: "not-an-email" }),
    RegistrationInputError,
  );

  assert.deepEqual(
    buildRegistrationPayload({ ...validInput, password: "x" }),
    {
      name: "Ani Kun",
      email: "ani@example.com",
      password: "x",
      phone: "081234567890",
    },
  );
});
