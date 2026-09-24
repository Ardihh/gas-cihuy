import {
  ReviewResponseError,
  findReviewForRental,
  validateReviewInput,
  normalizeReviewResource,
} from "./review-adapter.mjs";

export { findReviewForRental } from "./review-adapter.mjs";

if (typeof window !== "undefined") {
  throw new Error("lib/reviews.js can only be imported from server code.");
}

export class ReviewAuthorizationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "ReviewAuthorizationError";
    this.code = code;
  }
}

export class ReviewDuplicateError extends Error {
  constructor(message = "A review already exists for this rental.") {
    super(message);
    this.name = "ReviewDuplicateError";
    this.code = "DUPLICATE_REVIEW";
  }
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

async function requestReview(...args) {
  const { apiFetch } = await import("./api.js");
  return apiFetch(...args);
}

export async function getReviews({ request = requestReview } = {}) {
  if (typeof request !== "function") {
    throw new TypeError("Review request must be a function.");
  }

  const response = await request("/reviews", {
    auth: true,
    cache: "no-store",
  });

  if (!Array.isArray(response)) {
    throw new ReviewResponseError("the review list must be an array.");
  }

  return response.map(normalizeReviewResource);
}

export function filterReviewsForDashboard(reviews, userId, rentals) {
  if (!Array.isArray(reviews)) {
    throw new ReviewResponseError("the review list must be an array.");
  }

  if (!isPositiveInteger(userId)) {
    throw new ReviewAuthorizationError(
      "The authenticated user id is invalid.",
      "INVALID_USER",
    );
  }

  if (!Array.isArray(rentals)) {
    throw new ReviewAuthorizationError(
      "Authoritative rental data is unavailable.",
      "RENTALS_UNAVAILABLE",
    );
  }

  const currentUserRentalIds = new Set(
    rentals
      .filter((rental) => rental?.userId === userId && isPositiveInteger(rental.id))
      .map((rental) => rental.id),
  );

  return reviews.filter(
    (review) => review?.userId === userId
      && review.rentalId !== null
      && currentUserRentalIds.has(review.rentalId),
  );
}

export function buildReviewCreatePayload({ currentUser, rentals, reviews, input }) {
  if (currentUser?.status !== "authenticated" || !currentUser.user) {
    throw new ReviewAuthorizationError(
      "An authenticated user is required to create a review.",
      "UNAUTHENTICATED",
    );
  }

  if (!isPositiveInteger(currentUser.user.id)) {
    throw new ReviewAuthorizationError(
      "The authenticated user id is invalid.",
      "INVALID_USER",
    );
  }

  const normalizedInput = validateReviewInput(input);

  if (!Array.isArray(rentals)) {
    throw new ReviewAuthorizationError(
      "Authoritative rental data is unavailable.",
      "RENTALS_UNAVAILABLE",
    );
  }

  if (!Array.isArray(reviews)) {
    throw new ReviewAuthorizationError(
      "Authoritative review data is unavailable.",
      "REVIEWS_UNAVAILABLE",
    );
  }

  const rental = rentals.find((record) => record?.id === normalizedInput.rentalId);

  if (!rental) {
    throw new ReviewAuthorizationError("The rental was not found.", "RENTAL_NOT_FOUND");
  }

  if (rental.userId !== currentUser.user.id) {
    throw new ReviewAuthorizationError(
      "The rental does not belong to the authenticated user.",
      "RENTAL_NOT_OWNED",
    );
  }

  if (rental.status !== "returned") {
    throw new ReviewAuthorizationError(
      "Only returned rentals can receive a review.",
      "RENTAL_NOT_RETURNED",
    );
  }

  if (!isPositiveInteger(rental.itemId)) {
    throw new ReviewAuthorizationError("The rental item id is invalid.", "INVALID_ITEM");
  }

  if (reviews.some((review) => (
    review?.userId === currentUser.user.id
    && review.rentalId === rental.id
  ))) {
    throw new ReviewDuplicateError();
  }

  return {
    rental_id: rental.id,
    user_id: currentUser.user.id,
    item_id: rental.itemId,
    rating: normalizedInput.rating,
    comment: normalizedInput.comment,
  };
}

export async function createReview(
  { currentUser, rentals, reviews, input },
  { request = requestReview } = {},
) {
  if (typeof request !== "function") {
    throw new TypeError("Review request must be a function.");
  }

  const payload = buildReviewCreatePayload({ currentUser, rentals, reviews, input });

  return request("/reviews", {
    method: "POST",
    auth: true,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
}
