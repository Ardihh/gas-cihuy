const NEW_ITEM_CATEGORIES = new Set(["Anime", "Game", "Aksesoris"]);
const ITEM_STATUSES = new Set(["available", "unavailable"]);
const FIELD_LABELS = Object.freeze({
  item: "Data koleksi",
  name: "Nama kostum",
  category: "Kategori",
  description: "Deskripsi",
  size: "Ukuran",
  imageUrl: "URL gambar",
  pricePerDay: "Harga per hari",
  stock: "Stok",
  status: "Ketersediaan",
});

export class OwnerItemInputError extends TypeError {
  constructor(field, message) {
    super(`${FIELD_LABELS[field] ?? "Data koleksi"} ${message}`);
    this.name = "OwnerItemInputError";
    this.field = field;
  }
}

function readText(input, field, { required = false } = {}) {
  if (typeof input !== "string") {
    throw new OwnerItemInputError(field, "harus berupa teks.");
  }

  const value = input.trim();
  if (required && value === "") {
    throw new OwnerItemInputError(field, "wajib diisi.");
  }

  return value;
}

function readNumber(input, field) {
  const value = typeof input === "string" ? input.trim() : input;
  if ((typeof value !== "number" && typeof value !== "string") || value === "") {
    throw new OwnerItemInputError(field, "harus berupa angka.");
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new OwnerItemInputError(field, "harus berupa angka.");
  }

  return number;
}

export function normalizeOwnerItemInput(input, { mode = "create" } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new OwnerItemInputError("item", "must be an object.");
  }
  if (mode !== "create" && mode !== "update") {
    throw new TypeError("Owner item mode must be create or update.");
  }

  const name = readText(input.name, "name", { required: true });
  const category = readText(input.category, "category", { required: true });
  if (mode === "create" && !NEW_ITEM_CATEGORIES.has(category)) {
    throw new OwnerItemInputError("category", "tidak didukung.");
  }

  const description = readText(input.description ?? "", "description", { required: mode === "create" });
  const size = readText(input.size ?? "", "size", { required: mode === "create" });
  const imageUrl = readText(input.imageUrl ?? "", "imageUrl", { required: mode === "create" });

  const pricePerDay = readNumber(input.pricePerDay, "pricePerDay");
  if (pricePerDay <= 0) {
    throw new OwnerItemInputError("pricePerDay", "harus lebih besar dari nol.");
  }

  const stock = readNumber(input.stock, "stock");
  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw new OwnerItemInputError("stock", "harus bilangan bulat nol atau lebih.");
  }

  let status = "available";
  if (mode === "update") {
    status = readText(input.status, "status", { required: true });
    if (!ITEM_STATUSES.has(status)) {
      throw new OwnerItemInputError("status", "tidak didukung.");
    }
  }

  return {
    name,
    category,
    description,
    size,
    price_per_day: pricePerDay,
    stock,
    image_url: imageUrl,
    status: stock === 0 ? "unavailable" : status,
  };
}
