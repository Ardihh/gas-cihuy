const ALLOWED_TRANSITIONS = Object.freeze({
  pending: Object.freeze(["approved", "rejected", "cancelled"]),
  approved: Object.freeze(["ongoing", "cancelled"]),
  ongoing: Object.freeze(["returned"]),
  returned: Object.freeze([]),
  rejected: Object.freeze([]),
  cancelled: Object.freeze([]),
});

export function getAllowedRentalTransitions(currentStatus) {
  return [...(ALLOWED_TRANSITIONS[currentStatus] ?? [])];
}

export function canTransitionRentalStatus(
  currentStatus,
  nextStatus,
  { adminNote = "", currentAdminNote = "" } = {},
) {
  if (!Object.hasOwn(ALLOWED_TRANSITIONS, currentStatus)
    || !Object.hasOwn(ALLOWED_TRANSITIONS, nextStatus)) {
    return false;
  }

  if (currentStatus === nextStatus) {
    return typeof adminNote === "string"
      && adminNote.trim() !== ""
      && adminNote.trim() !== String(currentAdminNote ?? "").trim();
  }

  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}
