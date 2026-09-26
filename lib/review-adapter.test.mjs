import assert from "node:assert/strict";
import test from "node:test";

import {
  ReviewInputError,
  ReviewResponseError,
  getReviewPresentation,
  normalizeReviewResource,
  validateReviewInput,
} from "./review-adapter.mjs";

const baseInput = {
  rentalId: 101,
  rating: 5,
  comment: "Kostumnya nyaman dan proses rentalnya mudah.",
};

const validReviewResource = {
  id: 501,
  rental_id: 101,
  user_id: 7,
  item_id: 41,
  rating: 5,
  comment: "Kostumnya nyaman.",
  created_at: "ignored",
};

test("normalizes a review resource to the internal camelCase shape", () => {
  assert.deepEqual(normalizeReviewResource(validReviewResource), {
    id: 501,
    rentalId: 101,
    userId: 7,
    itemId: 41,
    rating: 5,
    comment: "Kostumnya nyaman.",
  });
});

test("normalizes optional rental_id and comment null values", () => {
  assert.deepEqual(normalizeReviewResource({
    ...validReviewResource,
    rental_id: null,
    comment: null,
  }), {
    id: 501,
    rentalId: null,
    userId: 7,
    itemId: 41,
    rating: 5,
    comment: null,
  });

  assert.equal(normalizeReviewResource({
    ...validReviewResource,
    rental_id: undefined,
    comment: undefined,
  }).rentalId, null);
});

test("accepts numeric form values and normalizes required comment", () => {
  assert.deepEqual(validateReviewInput({
    rentalId: "101",
    rating: "5",
    comment: "  Feedback yang valid.  ",
  }), {
    rentalId: 101,
    rating: 5,
    comment: "Feedback yang valid.",
  });
});

test("enforces the documented rating boundaries", () => {
  assert.throws(() => validateReviewInput({ ...baseInput, rating: 0 }), ReviewInputError);
  assert.equal(validateReviewInput({ ...baseInput, rating: 1 }).rating, 1);
  assert.equal(validateReviewInput({ ...baseInput, rating: 5 }).rating, 5);
  assert.throws(() => validateReviewInput({ ...baseInput, rating: 6 }), ReviewInputError);
  assert.throws(() => validateReviewInput({ ...baseInput, rating: 2.5 }), ReviewInputError);
});

test("requires a non-empty comment and limits it to 500 characters", () => {
  assert.throws(() => validateReviewInput({ ...baseInput, comment: "" }), ReviewInputError);
  assert.throws(() => validateReviewInput({ ...baseInput, comment: "   " }), ReviewInputError);
  assert.equal(validateReviewInput({ ...baseInput, comment: "a".repeat(500) }).comment.length, 500);
  assert.throws(() => validateReviewInput({ ...baseInput, comment: "a".repeat(501) }), ReviewInputError);
});

test("rejects a missing or invalid rental ID", () => {
  for (const rentalId of [undefined, null, "", 0, -1, 1.5, "not-an-id"]) {
    assert.throws(
      () => validateReviewInput({ ...baseInput, rentalId }),
      ReviewInputError,
    );
  }
});

test("rejects malformed review resources", () => {
  for (const overrides of [
    { id: 0 },
    { rental_id: 0 },
    { user_id: 0 },
    { item_id: 0 },
    { rating: 0 },
    { rating: 6 },
    { rating: 1.5 },
    { comment: 42 },
  ]) {
    assert.throws(
      () => normalizeReviewResource({ ...validReviewResource, ...overrides }),
      ReviewResponseError,
    );
  }
});

test("matches persisted review by rental and item identity", () => {
  const rental = { id: 101, itemId: 41, status: "returned" };
  const review = { id: 501, rentalId: 101, itemId: 41, userId: 7, rating: 5, comment: "Bagus." };

  assert.deepEqual(getReviewPresentation(rental, [], "ready"), {
    status: "available",
    review: null,
  });
  assert.deepEqual(getReviewPresentation(rental, [review], "ready"), {
    status: "persisted",
    review,
  });
  assert.deepEqual(getReviewPresentation(
    rental,
    [{ ...review, rentalId: null }],
    "ready",
  ), {
    status: "available",
    review: null,
  });
});

test("does not attach a review when the rental id matches but item id differs", () => {
  const rental = { id: 101, itemId: 41, status: "returned" };
  const review = { id: 501, rentalId: 101, itemId: 42, userId: 7, rating: 5, comment: "Bagus." };

  assert.deepEqual(getReviewPresentation(rental, [review]), {
    status: "unavailable",
    review: null,
  });
});

test("does not attach a review for an unrelated rental", () => {
  const rental = { id: 101, itemId: 41, status: "returned" };
  const review = { id: 501, rentalId: 102, itemId: 41, userId: 7, rating: 5, comment: "Bagus." };

  assert.deepEqual(getReviewPresentation(rental, [review]), {
    status: "available",
    review: null,
  });
});

test("rejects malformed review associations during normalization", () => {
  for (const rentalId of [0, "101", -1]) {
    assert.throws(
      () => normalizeReviewResource({ ...validReviewResource, rental_id: rentalId }),
      ReviewResponseError,
    );
  }

  assert.throws(
    () => normalizeReviewResource({ ...validReviewResource, item_id: null }),
    ReviewResponseError,
  );
});

test("does not offer feedback for non-returned rentals or unavailable review data", () => {
  const review = { id: 501, rentalId: 101, itemId: 41, userId: 7, rating: 5, comment: "Bagus." };

  assert.deepEqual(getReviewPresentation({ id: 101, status: "ongoing" }, [review]), {
    status: "ineligible",
    review: null,
  });
  assert.deepEqual(getReviewPresentation({ id: 101, status: "returned" }, [], "unavailable"), {
    status: "unavailable",
    review: null,
  });
});
