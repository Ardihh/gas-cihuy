import assert from "node:assert/strict";
import test from "node:test";

import { adaptItem } from "./catalog-adapter.mjs";

const validApiItem = {
  id: 1,
  name: "Example",
  category: "Vocaloid",
  description: "A sample item.",
  size: "L",
  price_per_day: 75000,
  stock: 3,
  image_url: null,
  status: "available",
};

test("adaptItem maps the verified API shape to the internal camelCase shape", () => {
  assert.deepEqual(adaptItem({ ...validApiItem, created_at: "ignored" }), {
    id: 1,
    name: "Example",
    category: "Vocaloid",
    description: "A sample item.",
    size: "L",
    pricePerDay: 75000,
    stock: 3,
    imageUrl: null,
    status: "available",
  });
});

test("adaptItem normalizes nullable optional fields", () => {
  const item = adaptItem({
    ...validApiItem,
    description: null,
    size: null,
    image_url: null,
  });

  assert.equal(item.description, "");
  assert.equal(item.size, null);
  assert.equal(item.imageUrl, null);
});

test("adaptItem rejects a missing required field", () => {
  const missingPrice = { ...validApiItem };
  delete missingPrice.price_per_day;

  assert.throws(() => adaptItem(missingPrice), /price_per_day/);
});

test("adaptItem rejects an invalid price or stock value", () => {
  assert.throws(() => adaptItem({ ...validApiItem, price_per_day: "75000" }), /price_per_day/);
  assert.throws(() => adaptItem({ ...validApiItem, stock: -1 }), /stock/);
  assert.throws(() => adaptItem({ ...validApiItem, stock: 1.5 }), /stock/);
});

test("adaptItem rejects unsupported statuses and incompatible optional values", () => {
  assert.throws(() => adaptItem({ ...validApiItem, status: "limited" }), /status/);
  assert.throws(() => adaptItem({ ...validApiItem, image_url: 42 }), /image_url/);
});
