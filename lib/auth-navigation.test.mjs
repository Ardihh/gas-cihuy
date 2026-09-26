import assert from "node:assert/strict";
import test from "node:test";

import {
  getCatalogGateRedirect,
  getLandingAccountLink,
  getLoginHref,
  getRegisterHref,
  getSafeReturnPath,
} from "./auth-navigation.mjs";

test("uses an anonymous landing account link when no session is authenticated", () => {
  assert.deepEqual(getLandingAccountLink(false), {
    href: "/login",
    label: "Masuk",
  });
});

test("uses the dashboard landing account link for any authenticated role", () => {
  assert.deepEqual(getLandingAccountLink(true), {
    href: "/dashboard",
    label: "Dashboard",
  });
});

test("accepts the supported internal return destinations", () => {
  assert.equal(getSafeReturnPath("/dashboard"), "/dashboard");
  assert.equal(getSafeReturnPath("/katalog"), "/katalog");
  assert.equal(getSafeReturnPath("/product/3"), "/product/3");
});

test("falls back to the dashboard for unsafe or malformed destinations", () => {
  const unsafeDestinations = [
    "https://example.com",
    "//example.com",
    "///example.com",
    "javascript:alert(1)",
    "/\\example.com",
    "/product/0",
    "/product/3/extra",
    "/product/9007199254740992",
    "/katalog?next=https://example.com",
    "/%2Fexample.com",
    "/dashboard\n",
    ["/katalog"],
    null,
  ];

  for (const destination of unsafeDestinations) {
    assert.equal(getSafeReturnPath(destination), "/dashboard");
  }
});

test("keeps the intended destination through login and registration links", () => {
  assert.equal(getLoginHref("/katalog"), "/login?next=/katalog");
  assert.equal(getRegisterHref("/product/3"), "/register?next=/product/3");
  assert.equal(
    getLoginHref("/katalog", { registered: true }),
    "/login?registered=1&next=/katalog",
  );
});

test("only authenticated users can pass the full catalog gate", () => {
  assert.equal(
    getCatalogGateRedirect({ status: "unauthenticated", user: null }),
    "/login?next=/katalog",
  );
  assert.equal(
    getCatalogGateRedirect({ status: "authenticated", user: { role: "customer" } }),
    null,
  );
  assert.equal(
    getCatalogGateRedirect({ status: "authenticated", user: { role: "admin" } }),
    null,
  );
  assert.equal(
    getCatalogGateRedirect({ status: "authenticated", user: null }),
    "/login?next=/katalog",
  );
});
