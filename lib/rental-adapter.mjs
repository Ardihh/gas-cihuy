import { calculateInclusiveRentalDays, parseCalendarDate } from "./rental-calculation.mjs";

export class RentalInputError extends TypeError {
  constructor(message, field) {
    super(`Invalid rental input${field ? ` field "${field}"` : ""}: ${message}`);
    this.name = "RentalInputError";
    this.field = field;
  }
}

export class RentalResponseError extends TypeError {
  constructor(message, field) {
    super(`Invalid rental response${field ? ` field "${field}"` : ""}: ${message}`);
    this.name = "RentalResponseError";
    this.field = field;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function requireField(record, field, ErrorType) {
  if (!hasOwn(record, field) || record[field] === null || record[field] === undefined) {
    throw new ErrorType("is required.", field);
  }

  return record[field];
}

function requireText(record, field, ErrorType) {
  const value = requireField(record, field, ErrorType);

  if (typeof value !== "string" || value.trim() === "") {
    throw new ErrorType("must be a non-empty string.", field);
  }

  return value;
}

function requirePositiveInteger(record, field, ErrorType) {
  const value = requireField(record, field, ErrorType);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ErrorType("must be a positive integer.", field);
  }

  return value;
}

function requireNonNegativeNumber(record, field, ErrorType) {
  const value = requireField(record, field, ErrorType);

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ErrorType("must be a non-negative number.", field);
  }

  return value;
}

function requireDate(record, field, ErrorType) {
  const value = requireField(record, field, ErrorType);

  if (typeof value !== "string" || parseCalendarDate(value) === null) {
    throw new ErrorType("must be a valid YYYY-MM-DD date.", field);
  }

  return value;
}

function requireAdminNote(record) {
  if (!hasOwn(record, "admin_note")) {
    throw new RentalResponseError("is required.", "admin_note");
  }

  const value = record.admin_note;

  if (value !== null && typeof value !== "string") {
    throw new RentalResponseError("must be a string or null.", "admin_note");
  }

  return value;
}

function normalizeInputPositiveInteger(value, field) {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  const numericValue = typeof normalizedValue === "number"
    ? normalizedValue
    : typeof normalizedValue === "string" && /^\d+$/.test(normalizedValue)
      ? Number(normalizedValue)
      : null;

  if (!Number.isSafeInteger(numericValue) || numericValue <= 0) {
    throw new RentalInputError("must be a positive integer.", field);
  }

  return numericValue;
}

function normalizeInputDate(value, field) {
  if (typeof value !== "string" || parseCalendarDate(value) === null) {
    throw new RentalInputError("must be a valid YYYY-MM-DD date.", field);
  }

  return value;
}

export function validateRentalInput(input) {
  if (!isRecord(input)) {
    throw new RentalInputError("must be an object.");
  }

  const itemId = normalizeInputPositiveInteger(input.itemId, "itemId");
  const startDate = normalizeInputDate(input.startDate, "startDate");
  const endDate = normalizeInputDate(input.endDate, "endDate");
  const quantity = normalizeInputPositiveInteger(input.quantity, "quantity");

  if (calculateInclusiveRentalDays(startDate, endDate) === null) {
    throw new RentalInputError("must end on or after the start date.", "endDate");
  }

  return {
    itemId,
    startDate,
    endDate,
    quantity,
  };
}

export function normalizeRentalCreateResponse(payload) {
  if (!isRecord(payload)) {
    throw new RentalResponseError("must be an object.");
  }

  const message = requireText(payload, "message", RentalResponseError);
  const rental = requireField(payload, "rental", RentalResponseError);
  const calculation = requireField(payload, "calculation", RentalResponseError);

  if (!isRecord(rental)) {
    throw new RentalResponseError("must be an object.", "rental");
  }

  if (!isRecord(calculation)) {
    throw new RentalResponseError("must be an object.", "calculation");
  }

  const rentalStartDate = requireDate(rental, "start_date", RentalResponseError);
  const rentalEndDate = requireDate(rental, "end_date", RentalResponseError);

  if (calculateInclusiveRentalDays(rentalStartDate, rentalEndDate) === null) {
    throw new RentalResponseError("must end on or after the start date.", "end_date");
  }

  const normalizedRental = {
    id: requirePositiveInteger(rental, "id", RentalResponseError),
    userId: requirePositiveInteger(rental, "user_id", RentalResponseError),
    itemId: requirePositiveInteger(rental, "item_id", RentalResponseError),
    itemName: requireText(rental, "item_name", RentalResponseError),
    startDate: rentalStartDate,
    endDate: rentalEndDate,
    quantity: requirePositiveInteger(rental, "quantity", RentalResponseError),
    totalPrice: requireNonNegativeNumber(rental, "total_price", RentalResponseError),
    status: requireText(rental, "status", RentalResponseError),
    adminNote: requireAdminNote(rental),
  };

  const normalizedCalculation = {
    pricePerDay: requireNonNegativeNumber(calculation, "price_per_day", RentalResponseError),
    days: requirePositiveInteger(calculation, "days", RentalResponseError),
    quantity: requirePositiveInteger(calculation, "quantity", RentalResponseError),
    totalPrice: requireNonNegativeNumber(calculation, "total_price", RentalResponseError),
  };

  if (normalizedRental.quantity !== normalizedCalculation.quantity) {
    throw new RentalResponseError("must match rental.quantity.", "calculation.quantity");
  }

  if (normalizedRental.totalPrice !== normalizedCalculation.totalPrice) {
    throw new RentalResponseError("must match rental.total_price.", "calculation.total_price");
  }

  return {
    message,
    rental: normalizedRental,
    calculation: normalizedCalculation,
  };
}
