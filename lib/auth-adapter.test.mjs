import assert from "node:assert/strict";
import test from "node:test";

import {
  getSessionMaxAge,
  normalizeCurrentUserResponse,
  normalizeLoginResponse,
  validateLoginCredentials,
} from "./auth-adapter.mjs";

const validLoginResponse = {
  success: true,
  message: "Login berhasil.",
  project: "cosplay",
  data: {
    access_token: "fixture-access-token",
    token_type: "Bearer",
    expires_in: 3600,
    expires_at: "2026-09-26T12:04:45+00:00",
    user: {
      id: 7,
      name: "AniKun",
      email: "ani@example.com",
      role: "user",
    },
  },
};

const validCurrentUserResponse = {
  success: true,
  message: "Sesi autentikasi valid.",
  project: "cosplay",
  data: {
    user_id: 8,
    name: "Test User",
    email: "test@example.invalid",
    project: "cosplay",
    role: "user",
    expires_at: "2026-09-26T12:04:45+00:00",
  },
};

test("normalizes the verified nested login response", () => {
  assert.deepEqual(normalizeLoginResponse(validLoginResponse), {
    token: "fixture-access-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {
      id: 7,
      name: "AniKun",
      email: "ani@example.com",
      role: "user",
    },
  });
});

test("does not retain extra login response fields", () => {
  const normalized = normalizeLoginResponse({
    ...validLoginResponse,
    api_key: "fixture-api-key-must-not-be-copied",
    data: {
      ...validLoginResponse.data,
      user: {
        ...validLoginResponse.data.user,
        password: "fixture-password-must-not-be-copied",
      },
    },
  });

  assert.equal("access_token" in normalized, false);
  assert.equal("api_key" in normalized, false);
  assert.equal("password" in normalized.user, false);
});

test("rejects a login response with missing data", () => {
  assert.throws(
    () => normalizeLoginResponse({ ...validLoginResponse, data: undefined }),
    /data/i,
  );
});

test("rejects a login response with missing access_token", () => {
  assert.throws(
    () =>
      normalizeLoginResponse({
        ...validLoginResponse,
        data: { ...validLoginResponse.data, access_token: "" },
      }),
    /access_token|token/i,
  );
});

test("rejects a login response with an invalid user id", () => {
  assert.throws(
    () =>
      normalizeLoginResponse({
        ...validLoginResponse,
        data: {
          ...validLoginResponse.data,
          user: { ...validLoginResponse.data.user, id: 0 },
        },
      }),
    /user/i,
  );
});

test("normalizes the verified nested current-user response", () => {
  assert.deepEqual(normalizeCurrentUserResponse(validCurrentUserResponse), {
    id: 8,
    name: "Test User",
    email: "test@example.invalid",
    role: "user",
  });
});

test("rejects a current-user response with missing data", () => {
  assert.throws(
    () => normalizeCurrentUserResponse({ ...validCurrentUserResponse, data: undefined }),
    /data/i,
  );
});

test("rejects a current-user response with an invalid user_id", () => {
  assert.throws(
    () =>
      normalizeCurrentUserResponse({
        ...validCurrentUserResponse,
        data: { ...validCurrentUserResponse.data, user_id: 0 },
      }),
    /data/i,
  );
});

test("does not retain extra current-user fields", () => {
  const normalized = normalizeCurrentUserResponse({
    ...validCurrentUserResponse,
    data: {
      ...validCurrentUserResponse.data,
      access_token: "fixture-token-must-not-be-copied",
    },
  });

  assert.deepEqual(Object.keys(normalized).sort(), ["email", "id", "name", "role"]);
  assert.equal("project" in normalized, false);
  assert.equal("expires_at" in normalized, false);
  assert.equal("access_token" in normalized, false);
});

test("uses a positive numeric expires_in as the session max age", () => {
  assert.equal(getSessionMaxAge(3600), 3600);
  assert.equal(getSessionMaxAge(0), undefined);
  assert.equal(getSessionMaxAge(-1), undefined);
  assert.equal(getSessionMaxAge("3600"), undefined);
});

test("rejects empty or malformed login credentials before transport", () => {
  assert.equal(validateLoginCredentials("ani@example.com", "secret"), true);
  assert.equal(validateLoginCredentials("ani@example", "secret"), false);
  assert.equal(validateLoginCredentials("", "secret"), false);
  assert.equal(validateLoginCredentials("ani@example.com", ""), false);
});
