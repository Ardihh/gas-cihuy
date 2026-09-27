import { isRentalAvailable } from "./rental-adapter.mjs";
import { canTransitionRentalStatus } from "./rental-transitions.mjs";

const STOCK_RESTORE_TRANSITIONS = new Set([
  "pending:rejected",
  "pending:cancelled",
  "approved:cancelled",
  "ongoing:returned",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExplicitApiFailure(response) {
  if (!isRecord(response)) return false;
  if (response.success === false) return true;
  return isRecord(response.data) && response.data.success === false;
}

export class RentalAvailabilityError extends Error {
  constructor() {
    super("Item ini sedang tidak tersedia untuk disewa atau stok tidak mencukupi.");
    this.name = "RentalAvailabilityError";
  }
}

export class RentalStatusTransitionError extends Error {
  constructor() {
    super("Transisi status rental tidak valid.");
    this.name = "RentalStatusTransitionError";
  }
}

export class RentalStockSynchronizationError extends Error {
  constructor({ operation, itemId, rental, rentalId, cause }) {
    const message = operation === "decrement"
      ? `Rental berhasil dibuat, tetapi stok item #${itemId} gagal diperbarui. Jangan ajukan ulang; stok perlu disinkronkan manual.`
      : `Status rental #${rentalId} berhasil diperbarui, tetapi stok item #${itemId} gagal dipulihkan. Stok perlu disinkronkan manual.`;

    super(message, { cause });
    this.name = "RentalStockSynchronizationError";
    this.operation = operation;
    this.itemId = itemId;
    this.rental = rental ?? null;
    this.rentalId = rentalId ?? rental?.rental?.id ?? null;
  }
}

function buildItemUpdate(item, stock) {
  return {
    name: item.name,
    category: item.category,
    description: item.description ?? "",
    size: item.size ?? "",
    pricePerDay: item.pricePerDay,
    stock,
    imageUrl: item.imageUrl ?? "",
    status: stock === 0 ? "unavailable" : item.status,
  };
}

async function adjustLatestItemStock({ itemId, delta, getItem, updateItem }) {
  const item = await getItem(itemId);

  if (!item || item.id !== itemId) {
    throw new TypeError("Item API response did not match the requested item.");
  }

  const stock = item.stock + delta;

  if (!Number.isSafeInteger(item.stock)
    || item.stock < 0
    || !Number.isSafeInteger(stock)
    || stock < 0) {
    throw new RangeError("Item stock update would produce an invalid stock value.");
  }

  const response = await updateItem(itemId, buildItemUpdate(item, stock));
  if (hasExplicitApiFailure(response)) {
    throw new Error("Item API explicitly reported a failed stock update.");
  }
}

export async function createRentalWithStock({
  itemId,
  quantity,
  getItem,
  createRental,
  updateItem,
}) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError("Rental quantity must be a positive integer.");
  }

  const availableItem = await getItem(itemId);
  if (availableItem?.id !== itemId || !isRentalAvailable(availableItem, quantity)) {
    throw new RentalAvailabilityError();
  }

  const rental = await createRental();
  if (hasExplicitApiFailure(rental)) {
    throw new Error("Rental API explicitly reported a failed creation.");
  }

  try {
    await adjustLatestItemStock({
      itemId,
      delta: -quantity,
      getItem,
      updateItem,
    });
  } catch (cause) {
    throw new RentalStockSynchronizationError({
      operation: "decrement",
      itemId,
      rental,
      cause,
    });
  }

  return rental;
}

export async function updateRentalStatusWithStock({
  rental,
  nextStatus,
  adminNote,
  persistRentalStatus,
  getItem,
  updateItem,
}) {
  if (!canTransitionRentalStatus(rental.status, nextStatus, {
    adminNote,
    currentAdminNote: rental.adminNote,
  })) {
    throw new RentalStatusTransitionError();
  }

  const updatedRental = await persistRentalStatus();
  if (hasExplicitApiFailure(updatedRental)) {
    throw new Error("Rental API explicitly reported a failed status update.");
  }

  const transition = `${rental.status}:${nextStatus}`;
  if (!STOCK_RESTORE_TRANSITIONS.has(transition)) {
    return updatedRental;
  }

  try {
    await adjustLatestItemStock({
      itemId: rental.itemId,
      delta: rental.quantity,
      getItem,
      updateItem,
    });
  } catch (cause) {
    throw new RentalStockSynchronizationError({
      operation: "restore",
      itemId: rental.itemId,
      rentalId: rental.id,
      cause,
    });
  }

  return updatedRental;
}
