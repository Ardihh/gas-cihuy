import { validateReviewInput } from "./review-adapter.mjs";

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

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

async function requestReview(...args) {
  const { apiFetch } = await import("./api.js");
  return apiFetch(...args);
}

export function buildReviewCreatePayload({ currentUser, rentals, input }) {
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

  return {
    rental_id: rental.id,
    user_id: currentUser.user.id,
    item_id: rental.itemId,
    rating: normalizedInput.rating,
    comment: normalizedInput.comment,
  };
}

export async function createReview({ currentUser, rentals, input }, { request = requestReview } = {}) {
  if (typeof request !== "function") {
    throw new TypeError("Review request must be a function.");
  }

  const payload = buildReviewCreatePayload({ currentUser, rentals, input });

  // The POST response envelope is not verified yet; keep it opaque for API-5B2.
  return request("/reviews", {
    method: "POST",
    auth: true,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
}
