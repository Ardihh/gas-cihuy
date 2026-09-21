const rupiahFormatter = new Intl.NumberFormat("id-ID");

export function formatRupiah(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("Rupiah value must be a finite number.");
  }

  return `Rp${rupiahFormatter.format(value)}`;
}
