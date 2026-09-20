const ALLOWED_STATUSES = new Set(["available", "unavailable"]);

export class CatalogItemError extends TypeError {
  constructor(message, field) {
    super(`Invalid catalog item${field ? ` field \"${field}\"` : ""}: ${message}`);
    this.name = "CatalogItemError";
    this.field = field;
  }
}

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function unwrapCatalogResponse(payload) {
  if (!isObject(payload) || !hasOwn(payload, "success") || !hasOwn(payload, "data")) {
    return payload;
  }

  if (payload.success !== true) {
    throw new TypeError("Catalog response did not indicate success.");
  }

  return payload.data;
}

function requireField(item, field) {
  if (!hasOwn(item, field) || item[field] === null || item[field] === undefined) {
    throw new CatalogItemError("is required.", field);
  }

  return item[field];
}

function requireText(item, field) {
  const value = requireField(item, field);

  if (typeof value !== "string" || value.trim() === "") {
    throw new CatalogItemError("must be a non-empty string.", field);
  }

  return value;
}

function requirePositiveInteger(item, field) {
  const value = requireField(item, field);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new CatalogItemError("must be a positive integer.", field);
  }

  return value;
}

function requireNonNegativeNumber(item, field) {
  const value = requireField(item, field);

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new CatalogItemError("must be a non-negative number.", field);
  }

  return value;
}

function requireNonNegativeInteger(item, field) {
  const value = requireField(item, field);

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CatalogItemError("must be a non-negative integer.", field);
  }

  return value;
}

function optionalText(item, field, fallback) {
  const value = item[field];

  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== "string") {
    throw new CatalogItemError("must be a string or null.", field);
  }

  return value;
}

function optionalImageUrl(item) {
  const value = item.image_url;

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new CatalogItemError("must be a string or null.", "image_url");
  }

  return value.trim() === "" ? null : value;
}

export function adaptItem(apiItem) {
  if (apiItem === null || typeof apiItem !== "object" || Array.isArray(apiItem)) {
    throw new CatalogItemError("must be an object.");
  }

  const id = requirePositiveInteger(apiItem, "id");
  const name = requireText(apiItem, "name");
  const category = requireText(apiItem, "category");
  const pricePerDay = requireNonNegativeNumber(apiItem, "price_per_day");
  const stock = requireNonNegativeInteger(apiItem, "stock");
  const status = requireText(apiItem, "status");

  if (!ALLOWED_STATUSES.has(status)) {
    throw new CatalogItemError("must be available or unavailable.", "status");
  }

  return {
    id,
    name,
    category,
    description: optionalText(apiItem, "description", ""),
    size: optionalText(apiItem, "size", null),
    pricePerDay,
    stock,
    imageUrl: optionalImageUrl(apiItem),
    status,
  };
}
