import assert from "node:assert/strict";
import test from "node:test";

import {
  ReviewAuthorizationError,
  buildReviewCreatePayload,
  createReview,
} from "./reviews.js";

const currentUser = {
  status: "authenticated",
  user: {
    id: 7,
    name: "Test User",
    email: "test@example.invalid",
    role: "user",
  },
};

const returnedRental = {
  id: 101,
  userId: 7,
  itemId: 41,
  itemName: "Example Costume",
  itemCategory: "Kostum",
  startDate: "2026-09-20",
  endDate: "2026-09-22",
  quantity: 1,
  totalPrice: 180000,
  status: "returned",
  adminNote: null,
};

const baseInput = {
  rentalId: 101,
  rating: 5,
  comment: "Kostumnya nyaman dan proses rentalnya mudah.",
};

function buildPayload(input = baseInput, rentals = [returnedRental], user = currentUser) {
  return buildReviewCreatePayload({
    currentUser: user,
    rentals,
    input,
  });
}

test("rejects unauthenticated review submission", () => {
  assert.throws(
    () => buildPayload(baseInput, [returnedRental], { status: "unauthenticated", user: null }),
    (error) => error instanceof ReviewAuthorizationError && error.code === "UNAUTHENTICATED",
  );
});

test("rejects a rental that is not present in server-fetched rentals", () => {
  assert.throws(
    () => buildPayload(baseInput, []),
    (error) => error instanceof ReviewAuthorizationError && error.code === "RENTAL_NOT_FOUND",
  );
});

test("rejects a rental owned by another user", () => {
  assert.throws(
    () => buildPayload(baseInput, [{ ...returnedRental, userId: 8 }]),
    (error) => error instanceof ReviewAuthorizationError && error.code === "RENTAL_NOT_OWNED",
  );
});

test("rejects every non-returned rental status", () => {
  for (const status of ["pending", "approved", "ongoing", "rejected", "cancelled"]) {
    assert.throws(
      () => buildPayload(baseInput, [{ ...returnedRental, status }]),
      (error) => error instanceof ReviewAuthorizationError && error.code === "RENTAL_NOT_RETURNED",
    );
  }
});

test("accepts a returned rental and derives both foreign keys from authority", () => {
  assert.deepEqual(buildPayload({
    ...baseInput,
    userId: 999,
    itemId: 999,
  }), {
    rental_id: 101,
    user_id: 7,
    item_id: 41,
    rating: 5,
    comment: "Kostumnya nyaman dan proses rentalnya mudah.",
  });
});

test("createReview sends only the server-derived payload through an injected request", async () => {
  let request;
  const response = { opaque: "unverified POST response" };

  const result = await createReview({
    currentUser,
    rentals: [returnedRental],
    input: {
      ...baseInput,
      userId: 999,
      itemId: 999,
    },
  }, {
    request: async (endpoint, options) => {
      request = { endpoint, options };
      return response;
    },
  });

  assert.strictEqual(result, response);
  assert.equal(request.endpoint, "/reviews");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.auth, true);
  assert.deepEqual(JSON.parse(request.options.body), {
    rental_id: 101,
    user_id: 7,
    item_id: 41,
    rating: 5,
    comment: "Kostumnya nyaman dan proses rentalnya mudah.",
  });
});
