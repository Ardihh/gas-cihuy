import { apiFetch } from "./api.js";
import { OwnerItemInputError, normalizeOwnerItemInput } from "./owner-item-adapter.mjs";
import { normalizeRentalList, RENTAL_STATUSES } from "./rental-adapter.mjs";
import { canTransitionRentalStatus } from "./rental-transitions.mjs";

if (typeof window !== "undefined") {
  throw new Error("lib/owner.js can only be imported from server code.");
}

export class OwnerServiceError extends Error {
  constructor(message, { code = "OWNER_ERROR", status = null, cause } = {}) {
    super(message);
    this.name = "OwnerServiceError";
    this.code = code;
    this.status = status;
    if (cause !== undefined) this.cause = cause;
  }
}

export async function getAllRentals() {
  const response = await apiFetch("/rentals", { cache: "no-store" });
  return normalizeRentalList(response);
}

export async function updateRentalStatus(rentalId, status, adminNote = null) {
  if (!Number.isSafeInteger(rentalId) || rentalId <= 0) {
    throw new OwnerServiceError("ID rental tidak valid.", { code: "INVALID_INPUT" });
  }

  if (!RENTAL_STATUSES.includes(status)) {
    throw new OwnerServiceError("Status tidak valid.", { code: "INVALID_INPUT" });
  }

  const currentRental = (await getAllRentals()).find((rental) => rental.id === rentalId);

  if (!currentRental) {
    throw new OwnerServiceError("Rental tidak ditemukan.", { code: "NOT_FOUND" });
  }

  const normalizedAdminNote = typeof adminNote === "string" ? adminNote.trim() : "";

  if (!canTransitionRentalStatus(currentRental.status, status, {
    adminNote: normalizedAdminNote,
    currentAdminNote: currentRental.adminNote,
  })) {
    throw new OwnerServiceError("Transisi status rental tidak valid.", { code: "INVALID_TRANSITION" });
  }

  const body = { status };
  if (normalizedAdminNote) {
    body.admin_note = normalizedAdminNote;
  }

  const data = await apiFetch(`/rentals/${rentalId}`, {
    method: "PUT",
    cache: "no-store",
    body: JSON.stringify(body),
  });

  return data;
}

export async function createItem({ name, category, description, size, pricePerDay, stock, imageUrl }) {
  let payload;
  try {
    payload = normalizeOwnerItemInput({ name, category, description, size, pricePerDay, stock, imageUrl });
  } catch (error) {
    if (error instanceof OwnerItemInputError) {
      throw new OwnerServiceError(error.message, { code: "INVALID_INPUT", cause: error });
    }
    throw error;
  }

  const data = await apiFetch("/items", {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  return data;
}

export async function updateItem(itemId, input) {
  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    throw new OwnerServiceError("ID item tidak valid.", { code: "INVALID_INPUT" });
  }

  let payload;
  try {
    payload = normalizeOwnerItemInput(input, { mode: "update" });
  } catch (error) {
    if (error instanceof OwnerItemInputError) {
      throw new OwnerServiceError(error.message, { code: "INVALID_INPUT", cause: error });
    }
    throw error;
  }

  return apiFetch(`/items/${itemId}`, {
    method: "PUT",
    cache: "no-store",
    body: JSON.stringify(payload),
  });
}

export async function deleteItem(itemId) {
  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    throw new OwnerServiceError("ID item tidak valid.", { code: "INVALID_INPUT" });
  }

  const data = await apiFetch(`/items/${itemId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  return data;
}

export async function getOwnerStats(rentals) {
  const total = rentals.length;
  const pending = rentals.filter((r) => r.status === "pending").length;
  const ongoing = rentals.filter((r) => r.status === "ongoing").length;
  const returned = rentals.filter((r) => r.status === "returned").length;
  const approved = rentals.filter((r) => r.status === "approved").length;
  const totalRevenue = rentals
    .filter((r) => r.status === "returned" || r.status === "ongoing")
    .reduce((sum, r) => sum + r.totalPrice, 0);

  return { total, pending, ongoing, returned, approved, totalRevenue };
}
