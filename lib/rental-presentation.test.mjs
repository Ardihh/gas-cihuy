import assert from "node:assert/strict";
import test from "node:test";

import {
  RENTAL_FILTERS,
  deriveRentalCounts,
  formatRentalPeriod,
  getAttentionGroups,
  getRentalStatusLabel,
  isFeedbackEligible,
  isHistoryRental,
  matchesRentalFilter,
} from "./rental-presentation.mjs";

const rentals = [
  { id: 1, status: "pending" },
  { id: 2, status: "approved" },
  { id: 3, status: "ongoing" },
  { id: 4, status: "returned" },
  { id: 5, status: "rejected" },
  { id: 6, status: "cancelled" },
];

test("maps only supported domain statuses to presentation labels", () => {
  assert.deepEqual(
    ["pending", "approved", "rejected", "ongoing", "returned", "cancelled"]
      .map(getRentalStatusLabel),
    ["Menunggu", "Disetujui", "Ditolak", "Berlangsung", "Selesai", "Dibatalkan"],
  );
});

test("groups live rental statuses into the existing dashboard filters", () => {
  assert.deepEqual(RENTAL_FILTERS, ["Semua", "Aktif", "Menunggu", "Selesai"]);
  assert.deepEqual(
    rentals.filter((rental) => matchesRentalFilter(rental, "Aktif")).map((rental) => rental.id),
    [2, 3],
  );
  assert.deepEqual(
    rentals.filter((rental) => matchesRentalFilter(rental, "Menunggu")).map((rental) => rental.id),
    [1],
  );
  assert.deepEqual(
    rentals.filter((rental) => matchesRentalFilter(rental, "Selesai")).map((rental) => rental.id),
    [4, 5, 6],
  );
  assert.equal(rentals.every((rental) => matchesRentalFilter(rental, "Semua")), true);
});

test("derives counts from the authenticated user's rental list", () => {
  assert.deepEqual(deriveRentalCounts(rentals), {
    total: 6,
    active: 2,
    pending: 1,
    history: 3,
  });
});

test("derives attention groups from live statuses only", () => {
  assert.deepEqual(getAttentionGroups(rentals), [
    { status: "pending", count: 1, label: "Menunggu persetujuan" },
    { status: "approved", count: 1, label: "Sudah disetujui" },
    { status: "ongoing", count: 1, label: "Sedang disewa" },
  ]);
  assert.equal(isHistoryRental({ status: "rejected" }), true);
  assert.equal(isHistoryRental({ status: "cancelled" }), true);
  assert.equal(isFeedbackEligible({ status: "returned" }), true);
  assert.equal(isFeedbackEligible({ status: "rejected" }), false);
});

test("formats validated rental dates in the presentation layer", () => {
  assert.equal(
    formatRentalPeriod("2026-09-10", "2026-09-12"),
    "10 Sep 2026 – 12 Sep 2026",
  );
});
