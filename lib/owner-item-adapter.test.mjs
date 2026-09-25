import test from "node:test";
import assert from "node:assert/strict";

import {
  OwnerItemInputError,
  normalizeOwnerItemInput,
} from "./owner-item-adapter.mjs";

const validInput = {
  name: "Miku Costume",
  category: "Anime",
  description: "Kostum lengkap.",
  size: "M",
  pricePerDay: "125000",
  stock: "2",
  imageUrl: "https://example.com/miku.jpg",
};

test("normalizes an owner item form to the documented API fields", () => {
  assert.deepEqual(normalizeOwnerItemInput(validInput), {
    name: "Miku Costume",
    category: "Anime",
    description: "Kostum lengkap.",
    size: "M",
    price_per_day: 125000,
    stock: 2,
    image_url: "https://example.com/miku.jpg",
    status: "available",
  });
});

test("zero stock always makes a new item unavailable", () => {
  assert.equal(normalizeOwnerItemInput({ ...validInput, stock: "0" }).status, "unavailable");
});

test("item updates can clear optional descriptive fields and preserve an API category", () => {
  assert.deepEqual(normalizeOwnerItemInput({
    ...validInput,
    category: "Vocaloid",
    description: "",
    size: "",
    imageUrl: "",
    stock: "1",
    status: "unavailable",
  }, { mode: "update" }), {
    name: "Miku Costume",
    category: "Vocaloid",
    description: "",
    size: "",
    price_per_day: 125000,
    stock: 1,
    image_url: "",
    status: "unavailable",
  });
});

test("zero stock overrides an available status on update", () => {
  assert.equal(normalizeOwnerItemInput({
    ...validInput,
    stock: "0",
    status: "available",
  }, { mode: "update" }).status, "unavailable");
});

test("rejects invalid price, stock, status, and new-item category", () => {
  for (const input of [
    { ...validInput, pricePerDay: "0" },
    { ...validInput, stock: "1.5" },
    { ...validInput, stock: "" },
    { ...validInput, category: "Vocaloid" },
  ]) {
    assert.throws(() => normalizeOwnerItemInput(input), OwnerItemInputError);
  }

  assert.throws(() => normalizeOwnerItemInput({
    ...validInput,
    status: "limited",
  }, { mode: "update" }), OwnerItemInputError);
});
