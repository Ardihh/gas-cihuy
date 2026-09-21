import assert from "node:assert/strict";
import test from "node:test";

import {
  RENTAL_STATUSES,
  RentalInputError,
  RentalResponseError,
  filterRentalsByUser,
  normalizeRentalCreateResponse,
  normalizeRentalList,
  validateRentalInput,
} from "./rental-adapter.mjs";

function createResponse(overrides = {}) {
  return {
    message: "Pengajuan rental berhasil dibuat.",
    rental: {
      id: 42,
      user_id: 7,
      item_id: 3,
      item_name: "Gojo Satoru",
      start_date: "2026-09-17",
      end_date: "2026-09-19",
      quantity: 1,
      total_price: 300000,
      status: "pending",
      admin_note: null,
      created_at: "2026-09-20T10:00:00Z",
    },
    calculation: {
      price_per_day: 100000,
      days: 3,
      quantity: 1,
      total_price: 300000,
    },
    ...overrides,
  };
}

function createListRecord(overrides = {}) {
  return {
    id: 101,
    user_id: 9001,
    item_id: 41,
    item_name: "Example Costume",
    item_category: "Kostum",
    start_date: "2026-09-20",
    end_date: "2026-09-22",
    quantity: 2,
    total_price: 180000,
    status: "pending",
    admin_note: null,
    created_at: { inconsistent: true },
    ...overrides,
  };
}

test("normalizes a verified rental creation response", () => {
  assert.deepEqual(normalizeRentalCreateResponse(createResponse()), {
    message: "Pengajuan rental berhasil dibuat.",
    rental: {
      id: 42,
      userId: 7,
      itemId: 3,
      itemName: "Gojo Satoru",
      startDate: "2026-09-17",
      endDate: "2026-09-19",
      quantity: 1,
      totalPrice: 300000,
      status: "pending",
      adminNote: null,
    },
    calculation: {
      pricePerDay: 100000,
      days: 3,
      quantity: 1,
      totalPrice: 300000,
    },
  });
});

test("preserves a textual admin note and excludes backend metadata", () => {
  const normalized = normalizeRentalCreateResponse(createResponse({
    rental: {
      ...createResponse().rental,
      admin_note: "Tunggu persetujuan admin.",
      created_at: "should not be exposed",
    },
    extra: "ignored",
  }));

  assert.equal(normalized.rental.adminNote, "Tunggu persetujuan admin.");
  assert.equal("createdAt" in normalized.rental, false);
  assert.equal("extra" in normalized, false);
});

test("rejects malformed required rental fields", () => {
  const invalidResponses = [
    createResponse({ rental: { ...createResponse().rental, id: 0 } }),
    createResponse({ rental: { ...createResponse().rental, item_name: "" } }),
    createResponse({ rental: { ...createResponse().rental, start_date: "2026-02-30" } }),
    createResponse({ rental: { ...createResponse().rental, quantity: 1.5 } }),
    createResponse({ rental: { ...createResponse().rental, total_price: -1 } }),
    createResponse({ calculation: { ...createResponse().calculation, price_per_day: "100000" } }),
    createResponse({ calculation: { ...createResponse().calculation, days: 0 } }),
    createResponse({ calculation: { ...createResponse().calculation, total_price: -1 } }),
  ];

  for (const response of invalidResponses) {
    assert.throws(() => normalizeRentalCreateResponse(response), RentalResponseError);
  }
});

test("rejects quantity or total mismatches between rental and calculation", () => {
  assert.throws(
    () => normalizeRentalCreateResponse(createResponse({
      calculation: { ...createResponse().calculation, quantity: 2 },
    })),
    /must match rental\.quantity/,
  );

  assert.throws(
    () => normalizeRentalCreateResponse(createResponse({
      calculation: { ...createResponse().calculation, total_price: 200000 },
    })),
    /must match rental\.total_price/,
  );
});

test("normalizes valid rental input without accepting browser-derived totals", () => {
  assert.deepEqual(validateRentalInput({
    itemId: "3",
    startDate: "2026-09-17",
    endDate: "2026-09-19",
    quantity: "1",
    totalPrice: "300000",
  }), {
    itemId: 3,
    startDate: "2026-09-17",
    endDate: "2026-09-19",
    quantity: 1,
  });
});

test("rejects invalid rental input", () => {
  const invalidInputs = [
    { itemId: 0, startDate: "2026-09-17", endDate: "2026-09-19", quantity: 1 },
    { itemId: 3, startDate: "2026-09-19", endDate: "2026-09-17", quantity: 1 },
    { itemId: 3, startDate: "2026-02-30", endDate: "2026-03-01", quantity: 1 },
    { itemId: 3, startDate: "2026-09-17", endDate: "2026-09-19", quantity: 0 },
    { itemId: 3, startDate: "2026-09-17", endDate: "2026-09-19", quantity: 1.5 },
    { itemId: 3, startDate: "2026-09-17", endDate: "2026-09-19", quantity: "NaN" },
  ];

  for (const input of invalidInputs) {
    assert.throws(() => validateRentalInput(input), RentalInputError);
  }
});

test("normalizes a verified rental list and excludes backend metadata", () => {
  assert.deepEqual(normalizeRentalList([createListRecord()]), [{
    id: 101,
    userId: 9001,
    itemId: 41,
    itemName: "Example Costume",
    itemCategory: "Kostum",
    startDate: "2026-09-20",
    endDate: "2026-09-22",
    quantity: 2,
    totalPrice: 180000,
    status: "pending",
    adminNote: null,
  }]);
});

test("accepts exactly the supported rental statuses", () => {
  assert.deepEqual(RENTAL_STATUSES, [
    "pending",
    "approved",
    "rejected",
    "ongoing",
    "returned",
    "cancelled",
  ]);

  for (const status of RENTAL_STATUSES) {
    assert.equal(normalizeRentalList([createListRecord({ status })])[0].status, status);
  }
});

test("rejects a rental list when any record is malformed", () => {
  const malformedRecords = [
    { id: 0 },
    { user_id: 0 },
    { item_id: 0 },
    { item_name: "" },
    { item_category: "" },
    { start_date: "2026-02-30" },
    { end_date: "2026-09-19" },
    { quantity: 1.5 },
    { total_price: -1 },
    { status: "completed" },
    { admin_note: 42 },
  ];

  for (const overrides of malformedRecords) {
    assert.throws(
      () => normalizeRentalList([createListRecord(), createListRecord(overrides)]),
      RentalResponseError,
    );
  }
});

test("rejects non-array rental responses and missing nullable fields", () => {
  assert.throws(() => normalizeRentalList({ rentals: [] }), RentalResponseError);

  const missingAdminNote = createListRecord();
  delete missingAdminNote.admin_note;

  assert.throws(() => normalizeRentalList([missingAdminNote]), /admin_note/);
});

test("filters normalized rentals by the authenticated user's id", () => {
  const rentals = normalizeRentalList([
    createListRecord({ id: 101, user_id: 9001 }),
    createListRecord({ id: 102, user_id: 9002 }),
    createListRecord({ id: 103, user_id: 9001 }),
  ]);

  assert.deepEqual(filterRentalsByUser(rentals, 9001).map((rental) => rental.id), [101, 103]);
  assert.deepEqual(filterRentalsByUser(rentals, 9002).map((rental) => rental.id), [102]);
});
