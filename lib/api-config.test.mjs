import assert from "node:assert/strict";
import test from "node:test";

import { ApiConfigurationError, readApiConfiguration } from "./api-config.mjs";

test("reads and normalizes only server API configuration", () => {
  assert.deepEqual(readApiConfiguration({
    API_BASE_URL: " https://api.example.test/v3/// ",
    API_PROJECT_ID: " /cosplay/ ",
    API_KEY: " fake-server-key ",
  }), {
    base: "https://api.example.test/v3",
    project: "cosplay",
    apiKey: "fake-server-key",
  });
});

test("fails safely when required server configuration is missing", () => {
  assert.throws(
    () => readApiConfiguration({ API_BASE_URL: "", API_PROJECT_ID: "cosplay", API_KEY: "" }),
    (error) => {
      assert.ok(error instanceof ApiConfigurationError);
      assert.match(error.message, /API_BASE_URL/);
      assert.match(error.message, /API_KEY/);
      assert.doesNotMatch(error.message, /fake|secret|token/i);
      return true;
    },
  );
});
