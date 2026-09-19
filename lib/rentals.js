import { apiFetch } from "./api.js";
import {
  RentalInputError,
  normalizeRentalCreateResponse,
  validateRentalInput,
} from "./rental-adapter.mjs";

if (typeof window !== "undefined") {
  throw new Error("lib/rentals.js can only be imported from server code.");
}

function validateUserId(userId) {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new RentalInputError("must be a positive integer.", "userId");
  }

  return userId;
}

export async function createRental({ userId, itemId, startDate, endDate, quantity }) {
  const normalizedUserId = validateUserId(userId);
  const normalizedInput = validateRentalInput({
    itemId,
    startDate,
    endDate,
    quantity,
  });

  const response = await apiFetch("/rentals", {
    method: "POST",
    auth: true,
    cache: "no-store",
    body: JSON.stringify({
      user_id: normalizedUserId,
      item_id: normalizedInput.itemId,
      start_date: normalizedInput.startDate,
      end_date: normalizedInput.endDate,
      quantity: normalizedInput.quantity,
      status: "pending",
    }),
  });

  return normalizeRentalCreateResponse(response);
}

export {
  RentalInputError,
  RentalResponseError,
  normalizeRentalCreateResponse,
  validateRentalInput,
} from "./rental-adapter.mjs";
