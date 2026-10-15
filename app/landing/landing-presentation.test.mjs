import assert from "node:assert/strict";
import test from "node:test";

import { getLandingFeature } from "./landing-presentation.mjs";

const costume = (overrides = {}) => ({
  id: 101,
  name: "Studio test costume",
  category: "Anime",
  description: "Fake fixture for presentation tests only.",
  size: "M",
  pricePerDay: 75000,
  stock: 1,
  imageUrl: null,
  status: "available",
  ...overrides,
});

test("empty preview has no fabricated hero product", () => {
  assert.equal(getLandingFeature([]), null);
});

test("hero favors an available product with a trusted image", () => {
  const items = [
    costume({ id: 101, status: "unavailable", imageUrl: "https://i.pinimg.com/test/a.jpg" }),
    costume({ id: 102 }),
    costume({ id: 103, imageUrl: "https://i.pinimg.com/test/c.jpg" }),
  ];
  assert.equal(getLandingFeature(items)?.id, 103);
});

test("untrusted image cannot outrank an available trusted image", () => {
  const items = [
    costume({ id: 101, imageUrl: "https://unknown.example/test.jpg" }),
    costume({ id: 102, imageUrl: "https://i.pinimg.com/test/b.jpg" }),
  ];
  assert.equal(getLandingFeature(items)?.id, 102);
});

test("available product without a photo remains a real hero fallback", () => {
  const items = [
    costume({ id: 101, status: "unavailable", imageUrl: "https://i.pinimg.com/test/a.jpg" }),
    costume({ id: 102 }),
  ];
  assert.equal(getLandingFeature(items)?.id, 102);
});

test("unavailable catalog never becomes invented availability", () => {
  const items = [costume({ status: "unavailable", stock: 9 })];
  assert.equal(getLandingFeature(items)?.status, "unavailable");
});

test("hero selection preserves preview order and the normalized product", () => {
  const items = Object.freeze([
    Object.freeze(costume({ id: 101 })),
    Object.freeze(costume({ id: 102, imageUrl: "https://i.pinimg.com/test/b.jpg" })),
  ]);
  const featured = getLandingFeature(items);
  assert.equal(featured, items[1]);
  assert.deepEqual(items.map((item) => item.id), [101, 102]);
});
