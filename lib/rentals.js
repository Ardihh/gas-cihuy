import { apiFetch } from "./api.js";
import {
  RentalInputError,
  filterRentalsByUser,
  normalizeRentalCreateResponse,
  normalizeRentalList,
  validateRentalInput,
} from "./rental-adapter.mjs";
import { canTransitionRentalStatus } from "./rental-transitions.mjs";

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

export async function getRentals() {
  const response = await apiFetch("/rentals", {
    cache: "no-store",
  });

  return normalizeRentalList(response);
}

export async function getMyRentals(userId) {
  const normalizedUserId = validateUserId(userId);
  const rentals = await getRentals();

  return filterRentalsByUser(rentals, normalizedUserId);
}

export async function cancelRental(userId, rentalId) {
  const normalizedUserId = validateUserId(userId);

  if (!Number.isSafeInteger(rentalId) || rentalId <= 0) {
    throw new RentalInputError("must be a positive integer.", "rentalId");
  }

  const rental = (await getMyRentals(normalizedUserId)).find((record) => record.id === rentalId);

  if (!rental) {
    throw new RentalInputError("rental was not found for this user.", "rentalId");
  }

  if (!canTransitionRentalStatus(rental.status, "cancelled")) {
    throw new RentalInputError("cannot be cancelled in its current status.", "status");
  }

  return apiFetch(`/rentals/${rentalId}`, {
    method: "PUT",
    auth: true,
    cache: "no-store",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export {
  RENTAL_STATUSES,
  RentalInputError,
  RentalResponseError,
  filterRentalsByUser,
  normalizeRentalCreateResponse,
  normalizeRentalList,
  validateRentalInput,
} from "./rental-adapter.mjs";
