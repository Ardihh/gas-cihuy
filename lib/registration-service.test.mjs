import assert from "node:assert/strict";
import test from "node:test";

import {
  RegistrationServiceError,
  registerUserWith,
} from "./registration-service.mjs";

const validInput = {
  name: "Ani Kun",
  email: "ani@example.com",
  password: "secret",
};

test("treats a successful 201-style API transport result as registration success", async () => {
  let request;

  const result = await registerUserWith(async (endpoint, options) => {
    request = { endpoint, options };
    return null;
  }, validInput);

  assert.deepEqual(result, { registered: true });
  assert.equal(request.endpoint, "/register");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.auth, false);
  assert.equal(request.options.cache, "no-store");
  assert.deepEqual(JSON.parse(request.options.body), validInput);
});

test("does not send a role even when the browser attempts to choose admin", async () => {
  let body;

  await registerUserWith(async (_endpoint, options) => {
    body = JSON.parse(options.body);
    return null;
  }, { ...validInput, role: "admin" });

  assert.equal("role" in body, false);
});

test("maps trusted validation statuses without exposing backend details", async () => {
  await assert.rejects(
    () =>
      registerUserWith(async () => {
        const error = new Error("backend detail must stay internal");
        error.status = 422;
        throw error;
      }, validInput),
    (error) => {
      assert(error instanceof RegistrationServiceError);
      assert.equal(error.code, "INVALID_INPUT");
      assert.equal(error.status, 422);
      assert.equal(error.message, "Registration data was rejected.");
      return true;
    },
  );
});

test("maps network and server failures to service-unavailable errors", async () => {
  await assert.rejects(
    () => registerUserWith(async () => { throw new Error("network detail"); }, validInput),
    (error) => {
      assert(error instanceof RegistrationServiceError);
      assert.equal(error.code, "SERVICE_UNAVAILABLE");
      assert.equal(error.status, null);
      assert.equal(error.message, "Registration service unavailable.");
      return true;
    },
  );
});
