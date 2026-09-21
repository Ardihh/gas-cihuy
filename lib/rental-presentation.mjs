export const RENTAL_FILTERS = Object.freeze(["Semua", "Aktif", "Menunggu", "Selesai"]);

const ACTIVE_STATUSES = new Set(["approved", "ongoing"]);
const HISTORY_STATUSES = new Set(["returned", "rejected", "cancelled"]);

const STATUS_LABELS = Object.freeze({
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  ongoing: "Berlangsung",
  returned: "Selesai",
  cancelled: "Dibatalkan",
});

const ATTENTION_GROUPS = Object.freeze([
  { status: "pending", label: "Menunggu persetujuan" },
  { status: "approved", label: "Sudah disetujui" },
  { status: "ongoing", label: "Sedang disewa" },
]);

const rentalDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export function getRentalStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function isActiveRental(rental) {
  return ACTIVE_STATUSES.has(rental.status);
}

export function isHistoryRental(rental) {
  return HISTORY_STATUSES.has(rental.status);
}

export function isFeedbackEligible(rental) {
  return rental.status === "returned";
}

export function matchesRentalFilter(rental, filter) {
  if (filter === "Semua") {
    return true;
  }

  if (filter === "Aktif") {
    return isActiveRental(rental);
  }

  if (filter === "Menunggu") {
    return rental.status === "pending";
  }

  if (filter === "Selesai") {
    return isHistoryRental(rental);
  }

  return false;
}

export function deriveRentalCounts(rentals) {
  return rentals.reduce(
    (counts, rental) => {
      counts.total += 1;

      if (isActiveRental(rental)) {
        counts.active += 1;
      }

      if (rental.status === "pending") {
        counts.pending += 1;
      }

      if (isHistoryRental(rental)) {
        counts.history += 1;
      }

      return counts;
    },
    { total: 0, active: 0, pending: 0, history: 0 },
  );
}

export function getAttentionGroups(rentals) {
  return ATTENTION_GROUPS
    .map((group) => ({
      ...group,
      count: rentals.filter((rental) => rental.status === group.status).length,
    }))
    .filter((group) => group.count > 0);
}

export function formatRentalPeriod(startDate, endDate) {
  const start = rentalDateFormatter.format(new Date(`${startDate}T00:00:00Z`));
  const end = rentalDateFormatter.format(new Date(`${endDate}T00:00:00Z`));

  return `${start} – ${end}`;
}
