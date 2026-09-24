const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function calculateInclusiveRentalDays(startDate, endDate) {
  const start = parseCalendarDate(startDate);
  const end = parseCalendarDate(endDate);

  if (!start || !end || end < start) {
    return null;
  }

  return Math.floor((end - start) / MILLISECONDS_PER_DAY) + 1;
}

export function parseQuantity(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const quantity = Number(normalizedValue);

  return Number.isSafeInteger(quantity) && quantity >= 1 ? quantity : null;
}

export function calculateEstimatedTotal(pricePerDay, durationDays, quantity) {
  if (
    !Number.isSafeInteger(pricePerDay) ||
    !Number.isSafeInteger(durationDays) ||
    !Number.isSafeInteger(quantity) ||
    pricePerDay < 0 ||
    durationDays < 1 ||
    quantity < 1
  ) {
    return null;
  }

  const total = pricePerDay * durationDays * quantity;

  return Number.isSafeInteger(total) ? total : null;
}
