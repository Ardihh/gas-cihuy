import assert from "node:assert/strict";
import test from "node:test";

import {
  ReviewAuthorizationError,
  ReviewDuplicateError,
  buildReviewCreatePayload,
  createReview,
  filterReviewsForDashboard,
  findReviewForRental,
  getReviews,
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

function buildPayload(
  input = baseInput,
  rentals = [returnedRental],
  user = currentUser,
  reviews = [],
) {
  return buildReviewCreatePayload({
    currentUser: user,
    rentals,
    reviews,
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

test("rejects an existing review for the same user and exact rental", () => {
  assert.throws(
    () => buildPayload(
      baseInput,
      [returnedRental],
      currentUser,
      [{ id: 501, rentalId: 101, userId: 7, itemId: 41, rating: 4, comment: "Sudah ada." }],
    ),
    (error) => error instanceof ReviewDuplicateError && error.code === "DUPLICATE_REVIEW",
  );
});

test("accepts the same item on a different returned rental", () => {
  const secondRental = { ...returnedRental, id: 102 };

  assert.equal(
    buildPayload(
      { ...baseInput, rentalId: 102 },
      [returnedRental, secondRental],
      currentUser,
      [{ id: 501, rentalId: 101, userId: 7, itemId: 41, rating: 4, comment: "Rental pertama." }],
    ).rental_id,
    102,
  );
});

test("reads and normalizes the direct review list response", async () => {
  const reviews = await getReviews({
    request: async (endpoint, options) => {
      assert.equal(endpoint, "/reviews");
      assert.deepEqual(options, { auth: true, cache: "no-store" });
      return [{
        id: 501,
        rental_id: 101,
        user_id: 7,
        item_id: 41,
        rating: 5,
        comment: "Kostumnya nyaman.",
      }];
    },
  });

  assert.deepEqual(reviews, [{
    id: 501,
    rentalId: 101,
    userId: 7,
    itemId: 41,
    rating: 5,
    comment: "Kostumnya nyaman.",
  }]);
});

test("filters dashboard reviews by current user and exact current-user rental ids", () => {
  const rentals = [
    returnedRental,
    { ...returnedRental, id: 102 },
    { ...returnedRental, id: 103, userId: 8 },
  ];
  const reviews = [
    { id: 501, rentalId: 101, userId: 7, itemId: 41, rating: 5, comment: "Pertama." },
    { id: 502, rentalId: 102, userId: 7, itemId: 41, rating: 4, comment: "Kedua." },
    { id: 503, rentalId: 103, userId: 8, itemId: 41, rating: 3, comment: "Pengguna lain." },
    { id: 504, rentalId: null, userId: 7, itemId: 41, rating: 5, comment: "Tanpa rental." },
  ];

  assert.deepEqual(
    filterReviewsForDashboard(reviews, 7, rentals).map((review) => review.id),
    [501, 502],
  );
});

test("matches a persisted review by rental and item ids, never by null rental id", () => {
  const reviews = [
    { id: 501, rentalId: 101, userId: 7, itemId: 41, rating: 5, comment: "Pertama." },
    { id: 504, rentalId: null, userId: 7, itemId: 41, rating: 5, comment: "Tanpa rental." },
  ];

  assert.equal(findReviewForRental(reviews, { id: 101, itemId: 41 }).id, 501);
  assert.equal(findReviewForRental(reviews, { id: 101, itemId: 42 }), null);
  assert.equal(findReviewForRental(reviews, { id: 999, itemId: 41 }), null);
  assert.equal(findReviewForRental(reviews, { id: 101, itemId: 0 }), null);
});

test("createReview sends only the server-derived payload through an injected request", async () => {
  let request;
  const response = { opaque: "unverified POST response" };

  const result = await createReview({
    currentUser,
    rentals: [returnedRental],
    reviews: [],
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
