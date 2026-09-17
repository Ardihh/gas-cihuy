import { apiFetch } from "./api.js";
import { adaptItem } from "./catalog-adapter.mjs";

export { adaptItem, CatalogItemError } from "./catalog-adapter.mjs";

if (typeof window !== "undefined") {
  throw new Error("lib/catalog.js can only be imported from server code.");
}

function normalizeItemId(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) {
    const numericValue = Number(value);

    if (Number.isSafeInteger(numericValue)) {
      return numericValue;
    }
  }

  throw new TypeError("Catalog item id must be a positive integer.");
}

export async function getCatalogItems() {
  const response = await apiFetch("/items");

  if (!Array.isArray(response)) {
    throw new TypeError("Catalog items response must be an array.");
  }

  return response.map(adaptItem);
}

export async function getCatalogItem(itemId) {
  const id = normalizeItemId(itemId);
  const response = await apiFetch(`/items/${id}`);

  return adaptItem(response);
}
