import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_IMAGE_REMOTE_PATTERN,
  normalizeCatalogImageUrl,
} from "./catalog-image.mjs";

test("allows any image path on the verified remote host", () => {
  assert.equal(CATALOG_IMAGE_REMOTE_PATTERN.pathname, "/**");
  assert.equal(
    normalizeCatalogImageUrl("  https://example.com/miku.jpg  "),
    "https://example.com/miku.jpg",
  );
  assert.equal(
    normalizeCatalogImageUrl("https://example.com/another-costume.webp"),
    "https://example.com/another-costume.webp",
  );
});

test("allows image paths on the live catalog host", () => {
  assert.equal(
    normalizeCatalogImageUrl("https://i.pinimg.com/736x/example-costume.jpg"),
    "https://i.pinimg.com/736x/example-costume.jpg",
  );
});

test("uses the fallback decision for missing or malformed image URLs", () => {
  assert.equal(normalizeCatalogImageUrl(null), null);
  assert.equal(normalizeCatalogImageUrl(""), null);
  assert.equal(normalizeCatalogImageUrl("   "), null);
  assert.equal(normalizeCatalogImageUrl("/images/miku.jpg"), null);
  assert.equal(normalizeCatalogImageUrl("not-a-url"), null);
});

test("rejects image URLs outside the verified remote pattern", () => {
  assert.equal(normalizeCatalogImageUrl("http://example.com/miku.jpg"), null);
  assert.equal(normalizeCatalogImageUrl("https://cdn.example.com/miku.jpg"), null);
  assert.equal(normalizeCatalogImageUrl("https://www.pinimg.com/miku.jpg"), null);
  assert.equal(normalizeCatalogImageUrl("https://example.com/miku.jpg?signature=fixture"), null);
  assert.equal(normalizeCatalogImageUrl("https://user@example.com/miku.jpg"), null);
  assert.equal(normalizeCatalogImageUrl("https://example.com/miku.jpg#preview"), null);
});
