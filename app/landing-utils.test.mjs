import assert from "node:assert/strict";
import test from "node:test";

import { getLandingRecommendations } from "./landing-utils.mjs";

function product(id, { category = "Anime", status = "available", stock = 4 } = {}) {
  return { id, name: `Product ${id}`, category, status, stock };
}

test("fills an eight-item preview from later available products in API order", () => {
  const products = [
    product(1, { status: "unavailable", stock: 4 }),
    product(2, { status: "unavailable", stock: 4 }),
    ...Array.from({ length: 10 }, (_, index) => product(index + 3)),
  ];

  const result = getLandingRecommendations(products);

  assert.deepEqual(result.map(({ id }) => id), [3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(result.length, 8);
  assert.ok(result.every(({ status }) => status === "available"));
});

test("filters category and availability before filling the eight-item preview", () => {
  const products = [
    product(1, { category: "Game", status: "unavailable" }),
    product(2, { category: "Game", status: "unavailable" }),
    ...Array.from({ length: 10 }, (_, index) => product(index + 3, { category: "Game" })),
    product(20, { category: "Film" }),
  ];

  const result = getLandingRecommendations(products, "Game");

  assert.deepEqual(result.map(({ id }) => id), [3, 4, 5, 6, 7, 8, 9, 10]);
});

test("uses status as the availability source, not stock", () => {
  const products = [
    product(1, { status: "available", stock: 0 }),
    product(2, { status: "unavailable", stock: 8 }),
  ];

  assert.deepEqual(getLandingRecommendations(products).map(({ id }) => id), [1]);
});
