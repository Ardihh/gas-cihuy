import { apiFetch } from "./api.js";
import { getCatalogItem } from "./catalog.js";
import { updateItem } from "./owner.js";
import {
  RentalInputError,
  RentalResponseError,
  filterRentalsByUser,
  normalizeRentalCreateResponse,
  normalizeRentalList,
  validateRentalInput,
} from "./rental-adapter.mjs";
import {
  RentalStatusTransitionError,
  createRentalWithStock,
  updateRentalStatusWithStock,
} from "./rental-stock.mjs";

if (typeof window !== "undefined") {
  throw new Error("lib/rentals.js can only be imported from server code.");
}

function validateUserId(userId) {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new RentalInputError("must be a positive integer.", "userId");
  }

  return userId;
}

function hasExplicitApiFailure(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  if (response.success === false) {
    return true;
  }

  return response.data !== null
    && typeof response.data === "object"
    && !Array.isArray(response.data)
    && response.data.success === false;
}

export async function createRental({ userId, itemId, startDate, endDate, quantity }) {
  const normalizedUserId = validateUserId(userId);
  const normalizedInput = validateRentalInput({
    itemId,
    startDate,
    endDate,
    quantity,
  });

  return createRentalWithStock({
    itemId: normalizedInput.itemId,
    quantity: normalizedInput.quantity,
    getItem: (id) => getCatalogItem(id, { cache: "no-store" }),
    createRental: async () => {
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

      if (hasExplicitApiFailure(response)) {
        throw new RentalResponseError("API did not confirm rental creation.", "success");
      }

      return normalizeRentalCreateResponse(response);
    },
    updateItem,
  });
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

  try {
    return await updateRentalStatusWithStock({
      rental,
      nextStatus: "cancelled",
      persistRentalStatus: () => apiFetch(`/rentals/${rentalId}`, {
        method: "PUT",
        auth: true,
        cache: "no-store",
        body: JSON.stringify({ status: "cancelled" }),
      }),
      getItem: (id) => getCatalogItem(id, { cache: "no-store" }),
      updateItem,
    });
  } catch (error) {
    if (error instanceof RentalStatusTransitionError) {
      throw new RentalInputError("cannot be cancelled in its current status.", "status");
    }

    throw error;
  }
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
