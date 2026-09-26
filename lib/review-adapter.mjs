export const REVIEW_MAX_COMMENT_LENGTH = 500;

export class ReviewInputError extends TypeError {
  constructor(message, field) {
    super(`Invalid review input${field ? ` field "${field}"` : ""}: ${message}`);
    this.name = "ReviewInputError";
    this.field = field;
  }
}

export class ReviewResponseError extends TypeError {
  constructor(message, field) {
    super(`Invalid review response${field ? ` field "${field}"` : ""}: ${message}`);
    this.name = "ReviewResponseError";
    this.field = field;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function requirePositiveInteger(value, field, ErrorType) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ErrorType("must be a positive integer.", field);
  }

  return value;
}

function normalizePositiveInteger(value, field) {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  const numericValue = typeof normalizedValue === "number"
    ? normalizedValue
    : typeof normalizedValue === "string" && /^\d+$/.test(normalizedValue)
      ? Number(normalizedValue)
      : null;

  return requirePositiveInteger(numericValue, field, ReviewInputError);
}

function requireRating(value, field, ErrorType) {
  const rating = requirePositiveInteger(value, field, ErrorType);

  if (rating < 1 || rating > 5) {
    throw new ErrorType("must be an integer from 1 through 5.", field);
  }

  return rating;
}

function normalizeRating(value) {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  const numericValue = typeof normalizedValue === "number"
    ? normalizedValue
    : typeof normalizedValue === "string" && /^\d+$/.test(normalizedValue)
      ? Number(normalizedValue)
      : null;

  return requireRating(numericValue, "rating", ReviewInputError);
}

function requireInputComment(value) {
  if (typeof value !== "string") {
    throw new ReviewInputError("must be a non-empty string.", "comment");
  }

  if (value.length > REVIEW_MAX_COMMENT_LENGTH) {
    throw new ReviewInputError(
      `must be at most ${REVIEW_MAX_COMMENT_LENGTH} characters.`,
      "comment",
    );
  }

  const comment = value.trim();

  if (comment === "") {
    throw new ReviewInputError("must be a non-empty string.", "comment");
  }

  return comment;
}

function normalizeOptionalRentalId(payload) {
  if (!hasOwn(payload, "rental_id") || payload.rental_id === null || payload.rental_id === undefined) {
    return null;
  }

  return requirePositiveInteger(payload.rental_id, "rental_id", ReviewResponseError);
}

function normalizeOptionalComment(payload) {
  if (!hasOwn(payload, "comment") || payload.comment === null || payload.comment === undefined) {
    return null;
  }

  if (typeof payload.comment !== "string") {
    throw new ReviewResponseError("must be a string or null.", "comment");
  }

  return payload.comment;
}

export function validateReviewInput(input) {
  if (!isRecord(input)) {
    throw new ReviewInputError("must be an object.");
  }

  return {
    rentalId: normalizePositiveInteger(input.rentalId, "rentalId"),
    rating: normalizeRating(input.rating),
    comment: requireInputComment(input.comment),
  };
}

export function normalizeReviewResource(payload) {
  if (!isRecord(payload)) {
    throw new ReviewResponseError("must be an object.");
  }

  return {
    id: requirePositiveInteger(payload.id, "id", ReviewResponseError),
    rentalId: normalizeOptionalRentalId(payload),
    userId: requirePositiveInteger(payload.user_id, "user_id", ReviewResponseError),
    itemId: requirePositiveInteger(payload.item_id, "item_id", ReviewResponseError),
    rating: requireRating(payload.rating, "rating", ReviewResponseError),
    comment: normalizeOptionalComment(payload),
  };
}

export function findReviewForRental(reviews, rental) {
  if (
    !Array.isArray(reviews)
    || !Number.isSafeInteger(rental?.id)
    || rental.id <= 0
    || !Number.isSafeInteger(rental?.itemId)
    || rental.itemId <= 0
  ) {
    return null;
  }

  return reviews.find((review) => (
    Number.isSafeInteger(review?.rentalId)
    && review.rentalId === rental.id
    && Number.isSafeInteger(review?.itemId)
    && review.itemId === rental.itemId
  )) ?? null;
}

export function getReviewPresentation(rental, reviews, reviewState = "ready") {
  if (rental?.status !== "returned") {
    return { status: "ineligible", review: null };
  }

  if (reviewState !== "ready") {
    return { status: "unavailable", review: null };
  }

  if (
    !Array.isArray(reviews)
    || !Number.isSafeInteger(rental?.id)
    || rental.id <= 0
    || !Number.isSafeInteger(rental?.itemId)
    || rental.itemId <= 0
  ) {
    return { status: "unavailable", review: null };
  }

  const review = findReviewForRental(reviews, rental);
  if (review) {
    return { status: "persisted", review };
  }

  const hasRentalReview = reviews.some((candidate) => candidate?.rentalId === rental.id);
  return hasRentalReview
    ? { status: "unavailable", review: null }
    : { status: "available", review: null };
}
