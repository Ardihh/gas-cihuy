"use server";

import { ApiError } from "../../lib/api.js";
import { AuthServiceError, getCurrentUser } from "../../lib/auth.js";
import { getRentals } from "../../lib/rentals.js";
import {
  ReviewAuthorizationError,
  createReview,
} from "../../lib/reviews.js";
import { ReviewInputError, validateReviewInput } from "../../lib/review-adapter.mjs";

const VALIDATION_ERROR = "Isi rating dan feedback dengan benar.";
const ACCESS_ERROR = "Feedback hanya dapat diberikan untuk rental selesai milikmu.";
const REQUEST_ERROR = "Feedback tidak dapat disimpan. Periksa kembali rental dan coba lagi.";
const SERVICE_ERROR = "Layanan feedback sedang tidak tersedia. Coba lagi nanti.";
const UNAUTHENTICATED_ERROR = "Silakan masuk untuk mengirim feedback.";

function readFormValue(formData, field) {
  const value = formData?.get(field);
  return typeof value === "string" ? value : "";
}

function unauthenticatedState() {
  return {
    status: "unauthenticated",
    error: UNAUTHENTICATED_ERROR,
  };
}

function serviceUnavailableState() {
  return {
    status: "service_unavailable",
    error: SERVICE_ERROR,
  };
}

function mapReviewRequestError(error) {
  if (error instanceof ReviewAuthorizationError) {
    if (error.code === "UNAUTHENTICATED") {
      return unauthenticatedState();
    }

    if (["RENTAL_NOT_FOUND", "RENTAL_NOT_OWNED", "RENTAL_NOT_RETURNED"].includes(error.code)) {
      return {
        status: "request_error",
        error: ACCESS_ERROR,
      };
    }

    return serviceUnavailableState();
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return unauthenticatedState();
    }

    if (error.status === 400 || error.status === 403 || error.status === 404 || error.status === 409 || error.status === 422) {
      return {
        status: "request_error",
        error: REQUEST_ERROR,
      };
    }

    return serviceUnavailableState();
  }

  if (error instanceof AuthServiceError) {
    return serviceUnavailableState();
  }

  return serviceUnavailableState();
}

export async function createReviewAction(_previousState, formData) {
  const input = {
    rentalId: readFormValue(formData, "rentalId"),
    rating: readFormValue(formData, "rating"),
    comment: readFormValue(formData, "comment"),
  };

  let normalizedInput;

  try {
    normalizedInput = validateReviewInput(input);
  } catch (error) {
    if (error instanceof ReviewInputError) {
      return {
        status: "validation",
        error: VALIDATION_ERROR,
      };
    }

    return serviceUnavailableState();
  }

  let currentUser;

  try {
    currentUser = await getCurrentUser();
  } catch {
    return serviceUnavailableState();
  }

  if (currentUser.status !== "authenticated" || !currentUser.user) {
    return unauthenticatedState();
  }

  let rentals;

  try {
    rentals = await getRentals();
  } catch (error) {
    return mapReviewRequestError(error);
  }

  try {
    await createReview({
      currentUser,
      rentals,
      input: normalizedInput,
    });

    // The external POST response envelope is still unverified; expose no raw response yet.
    return { status: "success" };
  } catch (error) {
    return mapReviewRequestError(error);
  }
}
