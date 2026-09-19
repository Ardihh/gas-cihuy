import assert from "node:assert/strict";
import test from "node:test";

import {
  getSessionMaxAge,
  normalizeCurrentUserResponse,
  normalizeLoginResponse,
  validateLoginCredentials,
} from "./auth-adapter.mjs";

const validUser = {
  id: 7,
  name: "AniKun",
  email: "ani@example.com",
  role: "user",
  password: "must-not-be-copied",
};

test("normalizes a successful login response without retaining secrets", () => {
  assert.deepEqual(
    normalizeLoginResponse({
      success: true,
      token: "session-token",
      token_type: "Bearer",
      expires_in: 3600,
      api_key: "project-key",
      user: validUser,
    }),
    {
      token: "session-token",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: 7,
        name: "AniKun",
        email: "ani@example.com",
        role: "user",
      },
    },
  );
});

test("rejects a successful login response without a usable token", () => {
  assert.throws(
    () => normalizeLoginResponse({ success: true, user: validUser }),
    /token/i,
  );
});

test("normalizes the verified current-user session response", () => {
  assert.deepEqual(
    normalizeCurrentUserResponse({
      success: true,
      message: "Sesi autentikasi valid.",
      session: {
        user_id: 8,
        name: "Test User",
        email: "test@example.invalid",
        project: "cosplay",
        role: "user",
        expires_at: "2026-09-26T12:04:45+00:00",
      },
    }),
    {
      id: 8,
      name: "Test User",
      email: "test@example.invalid",
      role: "user",
    },
  );
});

test("does not retain extra current-user session fields", () => {
  const normalized = normalizeCurrentUserResponse({
    success: true,
    session: {
      user_id: 8,
      name: "Test User",
      email: "test@example.invalid",
      role: "user",
      project: "cosplay",
      expires_at: "2026-09-26T12:04:45+00:00",
      token: "fixture-token-must-not-be-copied",
    },
  });

  assert.deepEqual(normalized, {
    id: 8,
    name: "Test User",
    email: "test@example.invalid",
    role: "user",
  });
});

test("rejects malformed current-user responses", () => {
  assert.throws(
    () => normalizeCurrentUserResponse({ success: true }),
    /session/i,
  );

  assert.throws(
    () => normalizeCurrentUserResponse({ success: false, session: {} }),
    /success/i,
  );

  assert.throws(
    () =>
      normalizeCurrentUserResponse({
        success: true,
        session: {
          user_id: 0,
          name: "Test User",
          email: "test@example.invalid",
          role: "user",
        },
      }),
    /session/i,
  );

  assert.throws(
    () =>
      normalizeCurrentUserResponse({
        success: true,
        session: {
          user_id: 8,
          name: "",
          email: "test@example.invalid",
          role: "user",
        },
      }),
    /session/i,
  );

  assert.throws(
    () => normalizeCurrentUserResponse({ id: 8, name: "Test User" }),
    /success/i,
  );
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
