import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateEstimatedTotal,
  calculateInclusiveRentalDays,
  parseQuantity,
} from "./rental-calculation.mjs";

test("same-day rental counts as one rental day", () => {
  assert.equal(calculateInclusiveRentalDays("2026-09-10", "2026-09-10"), 1);
});

test("multi-day rental uses inclusive calendar days", () => {
  assert.equal(calculateInclusiveRentalDays("2026-09-10", "2026-09-12"), 3);
});

test("reversed dates return an invalid result", () => {
  assert.equal(calculateInclusiveRentalDays("2026-09-12", "2026-09-10"), null);
});

test("invalid calendar dates return an invalid result", () => {
  assert.equal(calculateInclusiveRentalDays("2026-02-30", "2026-03-01"), null);
});

test("quantity accepts positive integers only", () => {
  assert.equal(parseQuantity("2"), 2);
  assert.equal(parseQuantity(1), 1);
  assert.equal(parseQuantity("0"), null);
  assert.equal(parseQuantity("-1"), null);
  assert.equal(parseQuantity("1.5"), null);
  assert.equal(parseQuantity("1e2"), null);
});

test("estimated total multiplies price, duration, and quantity", () => {
  assert.equal(calculateEstimatedTotal(90000, 3, 2), 540000);
});
