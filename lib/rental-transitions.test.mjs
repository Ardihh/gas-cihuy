import assert from "node:assert/strict";
import test from "node:test";

import {
  canTransitionRentalStatus,
  getAllowedRentalTransitions,
} from "./rental-transitions.mjs";

test("returns only valid next statuses for every lifecycle state", () => {
  assert.deepEqual(getAllowedRentalTransitions("pending"), ["approved", "rejected", "cancelled"]);
  assert.deepEqual(getAllowedRentalTransitions("approved"), ["ongoing", "cancelled"]);
  assert.deepEqual(getAllowedRentalTransitions("ongoing"), ["returned"]);
  assert.deepEqual(getAllowedRentalTransitions("returned"), []);
  assert.deepEqual(getAllowedRentalTransitions("rejected"), []);
  assert.deepEqual(getAllowedRentalTransitions("cancelled"), []);
  assert.deepEqual(getAllowedRentalTransitions("unknown"), []);
});

test("allows only transitions in the rental state machine", () => {
  const validTransitions = [
    ["pending", "approved"],
    ["pending", "rejected"],
    ["pending", "cancelled"],
    ["approved", "ongoing"],
    ["approved", "cancelled"],
    ["ongoing", "returned"],
  ];
  const invalidTransitions = [
    ["pending", "returned"],
    ["returned", "pending"],
    ["rejected", "ongoing"],
    ["cancelled", "approved"],
    ["returned", "returned"],
    ["unknown", "pending"],
  ];

  for (const [current, next] of validTransitions) {
    assert.equal(canTransitionRentalStatus(current, next), true, `${current} → ${next}`);
  }

  for (const [current, next] of invalidTransitions) {
    assert.equal(canTransitionRentalStatus(current, next), false, `${current} → ${next}`);
  }
});

test("allows same-status submissions only when a non-empty admin note is supplied", () => {
  assert.equal(canTransitionRentalStatus("pending", "pending"), false);
  assert.equal(canTransitionRentalStatus("pending", "pending", { adminNote: "   " }), false);
  assert.equal(canTransitionRentalStatus("returned", "returned", { adminNote: "Sudah dicek." }), true);
  assert.equal(canTransitionRentalStatus("returned", "returned", {
    adminNote: "Catatan lama.",
    currentAdminNote: "Catatan lama.",
  }), false);
});
