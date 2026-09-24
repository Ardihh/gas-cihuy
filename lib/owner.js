import { apiFetch } from "./api.js";
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

const ALLOWED_CATEGORIES = ["Anime", "Game", "Aksesoris"];

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
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new OwnerServiceError("Kategori tidak valid.", { code: "INVALID_INPUT" });
  }

  const parsedPrice = Number(pricePerDay);
  const parsedStock = Number(stock);

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new OwnerServiceError("Harga per hari tidak valid.", { code: "INVALID_INPUT" });
  }

  if (!Number.isSafeInteger(parsedStock) || parsedStock < 0) {
    throw new OwnerServiceError("Stok tidak valid.", { code: "INVALID_INPUT" });
  }

  const data = await apiFetch("/items", {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({
      name: String(name).trim(),
      category,
      description: String(description).trim(),
      size: String(size).trim(),
      price_per_day: parsedPrice,
      stock: parsedStock,
      image_url: String(imageUrl).trim(),
      status: "available",
    }),
  });

  return data;
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
