"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { logoutAction } from "../actions/auth.js";
import { createReviewAction } from "../actions/reviews.js";
import { cancelRentalAction } from "../actions/rentals.js";
import {
  approveRentalAction,
  createItemAction,
  deleteItemAction,
  rejectRentalAction,
  updateItemAction,
  updateRentalStatusAction,
} from "../actions/owner.js";
import { formatRupiah } from "../../lib/format-currency.mjs";
import { getReviewPresentation } from "../../lib/review-adapter.mjs";
import { getAllowedRentalTransitions } from "../../lib/rental-transitions.mjs";
import {
  RENTAL_FILTERS,
  deriveRentalCounts,
  formatRentalPeriod,
  getAttentionGroups,
  getRentalStatusLabel,
  isHistoryRental,
  matchesRentalFilter,
} from "../../lib/rental-presentation.mjs";

import styles from "./page.module.css";

// ─── Shared helpers ───────────────────────────────────────────────

const statusStyles = {
  pending: styles.statusPending,
  approved: styles.statusApproved,
  ongoing: styles.statusOngoing,
  returned: styles.statusCompleted,
  rejected: styles.statusCompleted,
  cancelled: styles.statusCompleted,
};

const OWNER_STATUS_STYLES = {
  pending: styles.ownerStatusPending,
  approved: styles.ownerStatusApproved,
  ongoing: styles.ownerStatusOngoing,
  returned: styles.ownerStatusReturned,
  rejected: styles.ownerStatusRejected,
  cancelled: styles.ownerStatusCancelled,
};

const OWNER_STATUS_LABELS = {
  pending: "Menunggu",
  approved: "Disetujui",
  ongoing: "Berjalan",
  returned: "Dikembalikan",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const OWNER_RENTAL_FILTERS = ["Semua", "Menunggu", "Disetujui", "Berjalan", "Selesai", "Ditolak"];

function getUserInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function filterOwnerRentals(rentals, tab) {
  if (tab === "Semua") return rentals;
  if (tab === "Menunggu") return rentals.filter((r) => r.status === "pending");
  if (tab === "Disetujui") return rentals.filter((r) => r.status === "approved");
  if (tab === "Berjalan") return rentals.filter((r) => r.status === "ongoing");
  if (tab === "Selesai") return rentals.filter((r) => r.status === "returned" || r.status === "cancelled");
  if (tab === "Ditolak") return rentals.filter((r) => r.status === "rejected");
  return rentals;
}

const REVIEW_RATINGS = [1, 2, 3, 4, 5];
const initialReviewState = { status: "idle", error: "" };
const CANCELLATION_SUCCESS_VISIBLE_MS = 2000;
const REVIEW_SUCCESS_VISIBLE_MS = 2000;

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function FeedbackForm({ rental, action, actionState, pending }) {
  const saved = actionState?.status === "success";

  return (
    <div className={styles.feedbackForm} id={`feedback-form-${rental.id}`}>
      <p className={styles.formEyebrow}>Feedback untuk</p>
      <h4 id={`feedback-title-${rental.id}`}>{rental.itemName}</h4>
      <p className={styles.feedbackNote} id={`feedback-note-${rental.id}`}>
        Bagikan pengalamanmu agar tersimpan di akunmu.
      </p>
      <form
        action={action}
        aria-labelledby={`feedback-title-${rental.id}`}
        aria-describedby={actionState?.error ? `feedback-error-${rental.id} feedback-note-${rental.id}` : `feedback-note-${rental.id}`}
        aria-busy={pending}
      >
        <input name="rentalId" type="hidden" value={rental.id} />
        <fieldset className={styles.ratingFieldset} disabled={saved}>
          <legend className={styles.formLabel}>Rating</legend>
          <div className={styles.ratingOptions}>
            {REVIEW_RATINGS.map((rating) => (
              <label className={styles.ratingOption} key={rating}>
                <input
                  name="rating"
                  required={rating === 1}
                  type="radio"
                  value={rating}
                />
                <span>{rating}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className={styles.formLabel} htmlFor={`feedback-text-${rental.id}`}>
          Ceritakan pengalamanmu
        </label>
        <textarea
          className={styles.textarea}
          disabled={saved}
          id={`feedback-text-${rental.id}`}
          maxLength={500}
          name="comment"
          placeholder="Contoh: Costume-nya masih bagus dan proses rental juga mudah..."
          required
          rows={4}
        />
        {actionState?.error && (
          <p className={styles.errorMessage} id={`feedback-error-${rental.id}`} role="alert">
            {actionState.error}
          </p>
        )}
        {saved && (
          <p
            className={styles.reviewSuccessMessage}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Feedback berhasil disimpan.
          </p>
        )}
        <div className={styles.formFooter}>
          <span>Maksimal 500 karakter</span>
          <button className={styles.submitButton} disabled={pending || saved} type="submit">
            {pending ? "Menyimpan…" : saved ? "Tersimpan" : "Simpan feedback →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PersistedReview({ review }) {
  return (
    <div className={styles.persistedReview}>
      <span className={styles.feedbackDone}>Feedback tersimpan</span>
      <span className={styles.persistedRating}>Rating {review.rating} dari 5</span>
      {review.comment && <p>{review.comment}</p>}
    </div>
  );
}

function RentalRecord({
  rental,
  selectedRentalId,
  reviews,
  reviewState,
  onChooseFeedback,
}) {
  const router = useRouter();
  const [reviewActionState, reviewAction, reviewPending] = useActionState(
    createReviewAction,
    initialReviewState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelRentalAction,
    { status: "idle" },
  );
  const reviewPresentation = getReviewPresentation(rental, reviews, reviewState);
  const selected = selectedRentalId === rental.id;
  const feedbackAvailable = reviewPresentation.status !== "ineligible";
  const persistedReview = reviewPresentation.review;
  const feedbackReady = reviewPresentation.status === "available";
  const canCancel = rental.status === "pending" || rental.status === "approved";

  useEffect(() => {
    if (cancelState?.status !== "success") return;

    const refreshTimeout = window.setTimeout(
      () => router.refresh(),
      CANCELLATION_SUCCESS_VISIBLE_MS,
    );

    return () => window.clearTimeout(refreshTimeout);
  }, [cancelState?.status, router]);

  useEffect(() => {
    if (reviewActionState?.status === "success") {
      const refreshTimeout = window.setTimeout(
        () => router.refresh(),
        REVIEW_SUCCESS_VISIBLE_MS,
      );

      return () => window.clearTimeout(refreshTimeout);
    }
  }, [reviewActionState?.status, router]);

  return (
    <li className={`${styles.record} ${selected ? styles.recordSelected : ""}`}>
      <div className={styles.recordGrid}>
        <div className={styles.recordIdentity}>
          <h3>{rental.itemName}</h3>
          <p>{rental.itemCategory}</p>
        </div>

        <div className={styles.recordStatus}>
          <span
            className={`${styles.statusDot} ${statusStyles[rental.status] || ""}`}
            aria-hidden="true"
          />
          <span>{getRentalStatusLabel(rental.status)}</span>
        </div>

        <div className={styles.recordDate}>
          <span className={styles.recordLabel}>Periode rental</span>
          <span>{formatRentalPeriod(rental.startDate, rental.endDate)}</span>
        </div>

        <div className={styles.recordPrice}>
          <span className={styles.recordLabel}>Total rental</span>
          <strong>{formatRupiah(rental.totalPrice)}</strong>
        </div>

        <div className={styles.recordAction}>
          {feedbackAvailable && (
            persistedReview ? (
              <PersistedReview review={persistedReview} />
            ) : !feedbackReady ? (
              <span className={styles.feedbackUnavailable}>Feedback belum dapat dimuat</span>
            ) : (
              <button
                className={styles.feedbackButton}
                type="button"
                onClick={() => onChooseFeedback(rental.id)}
                aria-expanded={selected}
                aria-controls={`feedback-form-${rental.id}`}
              >
                {selected ? "Tutup feedback" : "Beri feedback"}
              </button>
            ))}
          {canCancel && (
            <form action={cancelAction}>
              <input name="rentalId" type="hidden" value={rental.id} />
              <button
                className={styles.cancelButton}
                disabled={cancelPending || cancelState?.status === "success"}
                onClick={(event) => {
                  if (!window.confirm("Batalkan pengajuan rental ini?")) event.preventDefault();
                }}
                type="submit"
              >
                {cancelPending ? "Membatalkan…" : "Batalkan rental"}
              </button>
            </form>
          )}
          {cancelState?.status === "error" && (
            <span className={styles.feedbackUnavailable} role="alert">{cancelState.error}</span>
          )}
          {cancelState?.status === "success" && (
            <span className={styles.cancelSuccessMessage} role="status" aria-live="polite">
              {cancelState.message}
            </span>
          )}
        </div>
      </div>

      {rental.adminNote ? (
        <p className={styles.recordAdminNote}>
          <span className={styles.recordLabel}>Catatan admin</span>
          {rental.adminNote}
        </p>
      ) : null}

      {selected && feedbackAvailable && feedbackReady && !persistedReview && (
        <FeedbackForm
          rental={rental}
          action={reviewAction}
          actionState={reviewActionState}
          pending={reviewPending}
        />
      )}
    </li>
  );
}

function RentalRecordList({ records, ...recordProps }) {
  return (
    <ul className={styles.recordList}>
      {records.map((rental) => (
        <RentalRecord key={rental.id} rental={rental} {...recordProps} />
      ))}
    </ul>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function OwnerStatusBadge({ status }) {
  return (
    <span className={`${styles.ownerStatusBadge} ${OWNER_STATUS_STYLES[status] || ""}`}>
      {OWNER_STATUS_LABELS[status] || status}
    </span>
  );
}

function OwnerRentalRow({ rental, expanded, onToggle }) {
  const router = useRouter();

  const [approveState, approveAction, approvePending] = useActionState(
    approveRentalAction,
    { status: "idle" },
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectRentalAction,
    { status: "idle" },
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateRentalStatusAction,
    { status: "idle" },
  );

  useEffect(() => {
    if (
      approveState?.status === "success" ||
      rejectState?.status === "success" ||
      updateState?.status === "success"
    ) {
      router.refresh();
    }
  }, [approveState?.status, rejectState?.status, updateState?.status, router]);

  const isPending = approvePending || rejectPending || updatePending;
  const canApproveReject = rental.status === "pending";
  const statusOptions = [rental.status, ...getAllowedRentalTransitions(rental.status)];

  return (
    <li>
      <div className={`${styles.ownerRentalRow} ${expanded ? styles.ownerRentalRowExpanded : ""}`}>
        <div className={styles.ownerRentalInfo}>
          <h3>{rental.itemName}</h3>
          <p>{rental.itemCategory} · #{rental.id} · User #{rental.userId}</p>
        </div>
        <OwnerStatusBadge status={rental.status} />
        <div className={styles.ownerRentalMeta}>
          {formatRentalPeriod(rental.startDate, rental.endDate)}
        </div>
        <div className={styles.ownerRentalPrice}>{formatRupiah(rental.totalPrice)}</div>
        <div className={styles.ownerRentalActions}>
          {canApproveReject && (
            <>
              <form action={approveAction}>
                <input type="hidden" name="rentalId" value={rental.id} />
                <button
                  className={styles.btnApprove}
                  type="submit"
                  disabled={isPending}
                >
                  {approvePending ? "…" : "Setujui"}
                </button>
              </form>
              <form action={rejectAction}>
                <input type="hidden" name="rentalId" value={rental.id} />
                <button
                  className={styles.btnReject}
                  type="submit"
                  disabled={isPending}
                >
                  {rejectPending ? "…" : "Tolak"}
                </button>
              </form>
            </>
          )}
          <button
            className={styles.btnDetail}
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.ownerRentalDetail}>
          <dl className={styles.ownerDetailGrid}>
            {[
              ["Rental ID", `#${rental.id}`],
              ["User ID", `#${rental.userId}`],
              ["Item", rental.itemName],
              ["Kategori", rental.itemCategory],
              ["Periode", formatRentalPeriod(rental.startDate, rental.endDate)],
              ["Jumlah", `${rental.quantity} pcs`],
              ["Total", formatRupiah(rental.totalPrice)],
              ...(rental.adminNote ? [["Catatan admin", rental.adminNote]] : []),
            ].map(([label, value]) => (
              <div className={styles.ownerDetailItem} key={label}>
                <dt className={styles.ownerDetailLabel}>{label}</dt>
                <dd className={styles.ownerDetailValue}>{value}</dd>
              </div>
            ))}
          </dl>

          <form action={updateAction} className={styles.ownerNoteForm}>
            <input type="hidden" name="rentalId" value={rental.id} />
            <label className={styles.ownerFormLabel} htmlFor={`note-${rental.id}`}>
              Catatan admin
            </label>
            <textarea
              className={styles.ownerNoteInput}
              id={`note-${rental.id}`}
              name="adminNote"
              defaultValue={rental.adminNote || ""}
              placeholder="Catatan untuk pelanggan (opsional)…"
              rows={2}
            />
            <div className={styles.ownerStatusRow}>
              <select
                className={styles.ownerStatusSelect}
                name="status"
                defaultValue={rental.status}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{OWNER_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button className={styles.btnUpdate} type="submit" disabled={updatePending}>
                {updatePending ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
            {(updateState?.status === "success" || approveState?.status === "error" || rejectState?.status === "error" || updateState?.status === "error") && (
              <p
                className={`${styles.ownerFeedback} ${updateState?.status === "success" || approveState?.status === "success" ? styles.ownerFeedbackSuccess : styles.ownerFeedbackError}`}
                role={updateState?.status === "error" ? "alert" : "status"}
              >
                {updateState?.message || updateState?.error || approveState?.error || rejectState?.error}
              </p>
            )}
          </form>
        </div>
      )}
    </li>
  );
}

function OwnerItemEditForm({ item, onSaveSuccess, onCancel }) {
  const router = useRouter();
  const [formState, formAction, formPending] = useActionState(
    updateItemAction,
    { status: "idle" },
  );

  useEffect(() => {
    if (formState?.status === "success") {
      onSaveSuccess(formState.message);
      router.refresh();
    }
  }, [formState?.message, formState?.status, onSaveSuccess, router]);

  return (
    <form action={formAction} className={styles.ownerItemEditForm} aria-label={`Edit ${item.name}`}>
      <input name="itemId" type="hidden" value={item.id} />
      <div className={styles.ownerFormGrid}>
        <div className={styles.ownerFormField}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-name-${item.id}`}>Nama kostum</label>
          <input className={styles.ownerFormInput} id={`edit-name-${item.id}`} name="name" required defaultValue={item.name} />
        </div>
        <div className={styles.ownerFormField}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-category-${item.id}`}>Kategori</label>
          <input className={styles.ownerFormInput} id={`edit-category-${item.id}`} name="category" required defaultValue={item.category} />
        </div>
        <div className={styles.ownerFormField}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-size-${item.id}`}>Ukuran</label>
          <input className={styles.ownerFormInput} id={`edit-size-${item.id}`} name="size" defaultValue={item.size} />
        </div>
        <div className={styles.ownerFormField}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-price-${item.id}`}>Harga/hari (Rp)</label>
          <input className={styles.ownerFormInput} id={`edit-price-${item.id}`} name="pricePerDay" type="number" min="1" step="any" required defaultValue={item.pricePerDay} />
        </div>
        <div className={styles.ownerFormField}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-stock-${item.id}`}>Stok</label>
          <input className={styles.ownerFormInput} id={`edit-stock-${item.id}`} name="stock" type="number" min="0" step="1" required defaultValue={item.stock} />
        </div>
        <div className={styles.ownerFormField}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-status-${item.id}`}>Ketersediaan</label>
          <select className={styles.ownerFormSelect} id={`edit-status-${item.id}`} name="status" defaultValue={item.stock === 0 ? "unavailable" : item.status}>
            <option value="available">Tersedia</option>
            <option value="unavailable">Tidak tersedia</option>
          </select>
        </div>
        <div className={`${styles.ownerFormField} ${styles.ownerFormFieldWide}`}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-image-${item.id}`}>URL gambar</label>
          <input className={styles.ownerFormInput} id={`edit-image-${item.id}`} name="imageUrl" type="url" defaultValue={item.imageUrl ?? ""} />
        </div>
        <div className={`${styles.ownerFormField} ${styles.ownerFormFieldWide}`}>
          <label className={styles.ownerFormLabel} htmlFor={`edit-description-${item.id}`}>Deskripsi</label>
          <textarea className={styles.ownerFormTextarea} id={`edit-description-${item.id}`} name="description" rows={3} defaultValue={item.description ?? ""} />
        </div>
      </div>
      <div className={styles.ownerAddItemFooter}>
        <button className={styles.btnAddItem} type="submit" disabled={formPending}>
          {formPending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        <button className={styles.btnCancelEdit} type="button" onClick={onCancel}>Batal</button>
        {formState?.status === "error" && <p className={`${styles.ownerFeedback} ${styles.ownerFeedbackError}`} role="alert">{formState.error}</p>}
      </div>
    </form>
  );
}

function OwnerItemCard({ item }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState("");
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteItemAction,
    { status: "idle" },
  );

  useEffect(() => {
    if (deleteState?.status === "success") router.refresh();
  }, [deleteState?.status, router]);

  return (
    <div className={styles.ownerItemCard}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.ownerItemImage} src={item.imageUrl} alt={item.name} loading="lazy" />
      ) : (
        <div className={styles.ownerItemImageEmpty}>Tanpa gambar</div>
      )}
      <div className={styles.ownerItemBody}>
        <span className={styles.ownerItemCategory}>{item.category}</span>
        <h3 className={styles.ownerItemName}>{item.name}</h3>
        <span className={styles.ownerItemMeta}>
          Ukuran: {item.size} · Stok: {item.stock} · {item.stock > 0 && item.status === "available" ? "Tersedia" : "Tidak tersedia"}
        </span>
        <span className={styles.ownerItemPrice}>{formatRupiah(item.pricePerDay)}/hari</span>
      </div>
      <div className={styles.ownerItemFooter}>
        <button
          className={styles.btnEditItem}
          type="button"
          aria-expanded={editing}
          aria-controls={`edit-item-${item.id}`}
          onClick={() => {
            setEditSuccessMessage("");
            setEditing((value) => !value);
          }}
        >
          {editing ? "Tutup" : "Edit"}
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button
            className={styles.btnDeleteItem}
            type="submit"
            disabled={deletePending}
            onClick={(e) => { if (!confirm(`Hapus "${item.name}" dari koleksi?`)) e.preventDefault(); }}
          >
            {deletePending ? "Menghapus…" : "Hapus"}
          </button>
        </form>
      </div>
      <div id={`edit-item-${item.id}`} hidden={!editing}>
        {editing && <OwnerItemEditForm
          item={item}
          onSaveSuccess={(message) => {
            setEditSuccessMessage(message);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />}
      </div>
      {editSuccessMessage && <p className={`${styles.ownerFeedback} ${styles.ownerFeedbackSuccess}`} role="status">{editSuccessMessage}</p>}
      {deleteState?.status === "error" && <p className={`${styles.ownerFeedback} ${styles.ownerFeedbackError}`} role="alert">{deleteState.error}</p>}
    </div>
  );
}

function OwnerAddItemForm() {
  const formRef = useRef(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formState, formAction, formPending] = useActionState(
    createItemAction,
    { status: "idle" },
  );

  useEffect(() => {
    if (formState?.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [formState?.status, router]);

  return (
    <div className={styles.ownerAddItem}>
      <button
        className={styles.ownerAddItemToggle}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>+ Tambah koleksi baru</span>
        <span className={open ? styles.toggleIconOpen : ""}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <form ref={formRef} action={formAction} className={styles.ownerAddItemForm} aria-label="Form tambah koleksi">
          <div className={styles.ownerFormGrid}>
            <div className={styles.ownerFormField}>
              <label className={styles.ownerFormLabel} htmlFor="add-name">Nama kostum *</label>
              <input className={styles.ownerFormInput} id="add-name" name="name" type="text" required placeholder="Contoh: Naruto Uzumaki — Shippuden" />
            </div>
            <div className={styles.ownerFormField}>
              <label className={styles.ownerFormLabel} htmlFor="add-category">Kategori *</label>
              <select className={styles.ownerFormSelect} id="add-category" name="category" required>
                <option value="">Pilih kategori</option>
                <option value="Anime">Anime</option>
                <option value="Game">Game</option>
                <option value="Aksesoris">Aksesoris</option>
              </select>
            </div>
            <div className={styles.ownerFormField}>
              <label className={styles.ownerFormLabel} htmlFor="add-size">Ukuran *</label>
              <input className={styles.ownerFormInput} id="add-size" name="size" type="text" required placeholder="S/M/L/XL" />
            </div>
            <div className={styles.ownerFormField}>
              <label className={styles.ownerFormLabel} htmlFor="add-price">Harga/hari (Rp) *</label>
              <input className={styles.ownerFormInput} id="add-price" name="pricePerDay" type="number" min="1000" step="1000" required placeholder="100000" />
            </div>
            <div className={styles.ownerFormField}>
              <label className={styles.ownerFormLabel} htmlFor="add-stock">Stok *</label>
              <input className={styles.ownerFormInput} id="add-stock" name="stock" type="number" min="0" required placeholder="3" />
            </div>
            <div className={`${styles.ownerFormField} ${styles.ownerFormFieldWide}`}>
              <label className={styles.ownerFormLabel} htmlFor="add-image">URL gambar *</label>
              <input className={styles.ownerFormInput} id="add-image" name="imageUrl" type="url" required placeholder="https://..." />
            </div>
            <div className={`${styles.ownerFormField} ${styles.ownerFormFieldWide}`}>
              <label className={styles.ownerFormLabel} htmlFor="add-desc">Deskripsi *</label>
              <textarea className={styles.ownerFormTextarea} id="add-desc" name="description" required rows={3} placeholder="Kelengkapan kostum, aksesori, detail bahan…" />
            </div>
          </div>

          <div className={styles.ownerAddItemFooter}>
            <button className={styles.btnAddItem} type="submit" disabled={formPending}>
              {formPending ? "Menyimpan…" : "Simpan ke koleksi →"}
            </button>
            {formState?.status === "success" && (
              <p className={`${styles.ownerFeedback} ${styles.ownerFeedbackSuccess}`} role="status">{formState.message}</p>
            )}
            {formState?.status === "error" && (
              <p className={`${styles.ownerFeedback} ${styles.ownerFeedbackError}`} role="alert">{formState.error}</p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════

function OwnerFeedbackView({ reviews, reviewState, rentals, items }) {
  return (
    <section className={styles.rentalSection} aria-labelledby="owner-feedback-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Suara penyewa</p>
          <h2 id="owner-feedback-title">Feedback pelanggan</h2>
        </div>
        <p className={styles.sectionCount} role="status" aria-live="polite">
          {reviewState === "ready" ? `${reviews.length} feedback` : "Tidak tersedia"}
        </p>
      </div>

      {reviewState === "unavailable" ? (
        <div className={styles.serviceState} role="alert">
          <strong>Feedback belum dapat dimuat.</strong>
          <span>Coba muat ulang halaman.</span>
        </div>
      ) : reviews.length === 0 ? (
        <p className={styles.emptyState} role="status">Belum ada feedback pelanggan.</p>
      ) : (
        <ul className={styles.ownerReviewList} aria-label="Feedback pelanggan tersimpan">
          {reviews.map((review) => {
            const linkedRental = rentals.find((rental) => (
              rental.id === review.rentalId && rental.itemId === review.itemId
            ));
            const item = items.find((record) => record.id === review.itemId);
            const itemName = linkedRental?.itemName ?? item?.name ?? `Item #${review.itemId}`;

            return (
              <li className={styles.ownerReview} key={review.id}>
                <div className={styles.ownerReviewMeta}>
                  <h3>{itemName}</h3>
                  <span>Pelanggan #{review.userId}</span>
                  <span>{review.rentalId ? `Rental #${review.rentalId}` : "Rental tidak terhubung"}</span>
                </div>
                <p className={styles.ownerReviewRating}>Rating {review.rating} dari 5</p>
                <p className={styles.ownerReviewComment}>{review.comment || "Tanpa komentar tertulis."}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function OwnerDashboardView({ rentalState, rentals, stats, items, itemsState, reviewState, reviews }) {
  const [activeView, setActiveView] = useState("rentals");
  const [activeTab, setActiveTab] = useState("Semua");
  const [expandedId, setExpandedId] = useState(null);

  const filteredRentals = filterOwnerRentals(rentals, activeTab);

  return (
    <>
      {/* Page intro */}
      <header className={styles.pageIntro} id="dashboard">
        <div>
          <p className={styles.eyebrow}>Panel operasional</p>
          <h1>
            {activeView === "rentals" ? "Kelola Rental" : activeView === "items" ? "Kelola Koleksi" : "Feedback Pelanggan"}
          </h1>
          <p className={styles.introDescription}>
            {activeView === "rentals"
              ? "Tinjau semua pengajuan, setujui atau tolak rental, dan perbarui status penyewaan."
              : activeView === "items"
                ? "Tambahkan, perbarui, atau hapus koleksi dan informasi stok."
                : "Baca ulasan dan pengalaman pelanggan setelah rental selesai."}
          </p>
        </div>

        {/* Tab switcher */}
        <div className={styles.ownerViewTabs} role="group" aria-label="Pilih tampilan">
          <button
            className={`${styles.ownerViewTab} ${activeView === "rentals" ? styles.ownerViewTabActive : ""}`}
            type="button"
            aria-pressed={activeView === "rentals"}
            onClick={() => setActiveView("rentals")}
          >
            Rental
            {rentalState === "ready" && stats.pending > 0 && <span className={styles.ownerBadge}>{stats.pending}</span>}
          </button>
          <button
            className={`${styles.ownerViewTab} ${activeView === "items" ? styles.ownerViewTabActive : ""}`}
            type="button"
            aria-pressed={activeView === "items"}
            onClick={() => setActiveView("items")}
          >
            Koleksi
          </button>
          <button
            className={`${styles.ownerViewTab} ${activeView === "feedback" ? styles.ownerViewTabActive : ""}`}
            type="button"
            aria-pressed={activeView === "feedback"}
            onClick={() => setActiveView("feedback")}
          >
            Feedback
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <section className={styles.ownerStats} aria-label="Ringkasan toko">
        {[
          { label: "Total Rental", value: rentalState === "ready" ? stats.total : "—" },
          { label: "Menunggu", value: rentalState === "ready" ? stats.pending : "—", warn: rentalState === "ready" && stats.pending > 0 },
          { label: "Disetujui", value: rentalState === "ready" ? stats.approved : "—", good: rentalState === "ready" },
          { label: "Berjalan", value: rentalState === "ready" ? stats.ongoing : "—" },
          { label: "Selesai", value: rentalState === "ready" ? stats.returned : "—" },
          { label: "Koleksi", value: itemsState === "ready" ? items.length : "—" },
        ].map(({ label, value, warn, good }) => (
          <div className={styles.ownerStat} key={label}>
            <span className={styles.ownerStatLabel}>{label}</span>
            <span className={`${styles.ownerStatValue} ${warn ? styles.ownerStatWarn : good ? styles.ownerStatGood : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </section>

      {/* ── Rental management ── */}
      {activeView === "rentals" && (
        <section className={styles.rentalSection} aria-labelledby="rental-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Semua pengajuan</p>
              <h2 id="rental-title">Daftar Rental</h2>
            </div>
            <p className={styles.sectionCount} role="status" aria-live="polite">
              {rentalState === "unavailable"
                ? "Tidak tersedia"
                : `${filteredRentals.length} dari ${rentals.length} rental`}
            </p>
          </div>

          <div className={styles.filterRow} role="group" aria-label="Filter rental">
            {OWNER_RENTAL_FILTERS.map((tab) => (
              <button
                key={tab}
                className={`${styles.filterButton} ${activeTab === tab ? styles.filterButtonActive : ""}`}
                type="button"
                aria-pressed={activeTab === tab}
                onClick={() => { setActiveTab(tab); setExpandedId(null); }}
              >
                {tab}{tab === "Menunggu" && stats.pending > 0 ? ` (${stats.pending})` : ""}
              </button>
            ))}
          </div>

          {rentalState === "unavailable" ? (
            <div className={styles.serviceState} role="alert">
              <strong>Data rental tidak dapat dimuat.</strong>
              <span>Coba muat ulang halaman.</span>
            </div>
          ) : filteredRentals.length === 0 ? (
            <p className={styles.emptyState} role="status">
              {activeTab === "Semua" ? "Belum ada rental masuk." : `Tidak ada rental "${activeTab}".`}
            </p>
          ) : (
            <ul className={styles.ownerRentalList} aria-label="Daftar rental">
              {filteredRentals.map((rental) => (
                <OwnerRentalRow
                  key={rental.id}
                  rental={rental}
                  expanded={expandedId === rental.id}
                  onToggle={() => setExpandedId((prev) => prev === rental.id ? null : rental.id)}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Items / Koleksi ── */}
      {activeView === "items" && (
        <section className={styles.rentalSection} aria-labelledby="items-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Manajemen koleksi</p>
              <h2 id="items-title">Koleksi Kostum</h2>
            </div>
            <p className={styles.sectionCount}>
              {itemsState === "ready" ? `${items.length} item` : "—"}
            </p>
          </div>

          <OwnerAddItemForm />

          {itemsState === "unavailable" ? (
            <div className={styles.serviceState} role="alert">
              <strong>Koleksi tidak dapat dimuat.</strong>
              <span>Coba muat ulang halaman.</span>
            </div>
          ) : items.length === 0 ? (
            <p className={styles.emptyState} role="status">
              Belum ada koleksi. Tambahkan kostum pertama menggunakan form di atas.
            </p>
          ) : (
            <div className={styles.ownerItemsGrid} aria-label="Koleksi kostum">
              {items.map((item) => (
                <OwnerItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <section className={styles.catalogContinuation} aria-labelledby="catalog-cont-title">
            <div>
              <p className={styles.eyebrow}>Lihat katalog</p>
              <h2 id="catalog-cont-title">Tampilan pelanggan</h2>
              <p>Lihat bagaimana pelanggan melihat koleksi kamu di halaman depan.</p>
            </div>
            <Link className={styles.secondaryAction} href="/katalog">
              Buka katalog <span aria-hidden="true">↗</span>
            </Link>
          </section>
        </section>
      )}

      {activeView === "feedback" && (
        <OwnerFeedbackView
          reviews={reviews}
          reviewState={reviewState}
          rentals={rentals}
          items={items}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════

function CustomerDashboardView({
  userName,
  rentalState,
  rentals,
  reviewState,
  reviews,
}) {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedRentalId, setSelectedRentalId] = useState(null);

  const filteredRentals = rentals.filter((rental) =>
    matchesRentalFilter(rental, activeFilter),
  );
  const currentRentals = filteredRentals.filter((rental) => !isHistoryRental(rental));
  const historyRentals = filteredRentals.filter(isHistoryRental);
  const counts = deriveRentalCounts(rentals);
  const attentionGroups = getAttentionGroups(rentals);
  const attentionCount = counts.pending + counts.active;

  function chooseFeedback(rentalId) {
    setSelectedRentalId((prev) => (prev === rentalId ? null : rentalId));
  }

  const recordProps = {
    selectedRentalId,
    reviews,
    reviewState,
    onChooseFeedback: chooseFeedback,
  };

  return (
    <>
      <header className={styles.pageIntro} id="dashboard">
        <div>
          <p className={styles.eyebrow}>Meja rental</p>
          <h1>Rental kamu, {userName}.</h1>
          <p className={styles.introDescription}>
            Pantau pengajuan, jadwal rental, dan feedback kamu di satu tempat.
          </p>
        </div>
        <Link className={styles.catalogLink} href="/katalog">
          Lihat koleksi <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.attention} aria-labelledby="attention-title">
        {rentalState === "unavailable" ? (
          <div className={styles.attentionCopy}>
            <p className={styles.attentionLabel}>Perlu perhatian</p>
            <h2 id="attention-title">Rental belum dapat dimuat.</h2>
            <p>Coba lagi nanti untuk melihat pengajuan terbaru kamu.</p>
          </div>
        ) : (
          <>
            <div className={styles.attentionCopy}>
              <p className={styles.attentionLabel}>Perlu perhatian</p>
              <h2 id="attention-title">
                {attentionCount > 0
                  ? `${attentionCount} rental perlu dipantau.`
                  : counts.total === 0
                    ? "Belum ada pengajuan sewa."
                    : "Tidak ada rental yang perlu dipantau."}
              </h2>
              <p>
                {attentionGroups.length > 0
                  ? attentionGroups
                      .map((group) => `${group.count} ${group.label.toLowerCase()}`)
                      .join(" · ")
                  : counts.total === 0
                    ? "Pilih item dari katalog untuk membuat pengajuan pertama."
                    : "Semua rental di daftar kamu sudah selesai."}
              </p>
            </div>

            {attentionGroups.length > 0 && (
              <dl className={styles.attentionDetails} aria-label="Ringkasan status rental">
                {attentionGroups.map((group) => (
                  <div className={styles.attentionDetail} key={group.label}>
                    <dt>{group.count}</dt>
                    <dd>{group.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
      </section>

      <section className={styles.rentalSection} id="rental" aria-labelledby="rental-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Aktivitas rental</p>
            <h2 id="rental-title">Rental kamu</h2>
          </div>
          <p className={styles.sectionCount} role="status" aria-live="polite" aria-atomic="true">
            {rentalState === "unavailable"
              ? "Rental tidak tersedia"
              : `${activeFilter === "Semua" ? counts.total : filteredRentals.length} rental${activeFilter === "Semua" ? "" : ` ${activeFilter.toLowerCase()}`} ditampilkan`}
          </p>
        </div>

        {rentalState === "unavailable" ? (
          <div className={styles.serviceState} role="alert">
            <strong>Rental belum dapat dimuat.</strong>
            <span>Layanan rental sedang tidak tersedia. Coba lagi nanti.</span>
          </div>
        ) : (
          <>
            <div className={styles.filterRow} role="group" aria-label="Filter rental">
              {RENTAL_FILTERS.map((filter) => (
                <button
                  className={`${styles.filterButton} ${activeFilter === filter ? styles.filterButtonActive : ""}`}
                  key={filter}
                  type="button"
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {activeFilter === "Aktif" && (
              <p className={styles.filterHint}>
                Aktif menampilkan rental yang sudah disetujui atau sedang disewa.
              </p>
            )}

            {activeFilter !== "Selesai" && (
              <>
                {currentRentals.length > 0 ? (
                  <RentalRecordList records={currentRentals} {...recordProps} />
                ) : (
                  <p className={styles.emptyState} role="status">
                    {counts.total === 0
                      ? "Belum ada pengajuan sewa."
                      : activeFilter === "Semua" && historyRentals.length > 0
                        ? "Belum ada rental aktif. Lihat riwayat terbaru di bawah."
                        : "Belum ada rental yang sesuai filter ini."}
                  </p>
                )}

                {activeFilter === "Semua" && historyRentals.length > 0 && (
                  <div className={styles.historyBlock}>
                    <div className={styles.historyHeading}>
                      <h3>Riwayat terbaru</h3>
                      <span>{historyRentals.length} rental dalam riwayat</span>
                    </div>
                    <RentalRecordList records={historyRentals} {...recordProps} />
                  </div>
                )}
              </>
            )}

            {activeFilter === "Selesai" && (
              <div className={styles.historyBlock}>
                <div className={styles.historyHeading}>
                  <h3>Riwayat terbaru</h3>
                  <span>{historyRentals.length} rental dalam riwayat</span>
                </div>
                {historyRentals.length > 0 ? (
                  <RentalRecordList records={historyRentals} {...recordProps} />
                ) : (
                  <p className={styles.emptyState} role="status">
                    {counts.total === 0
                      ? "Belum ada pengajuan sewa."
                      : "Belum ada rental dalam riwayat."}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className={styles.catalogContinuation} aria-labelledby="catalog-title">
        <div>
          <p className={styles.eyebrow}>Berikutnya</p>
          <h2 id="catalog-title">Cari kostum lagi</h2>
          <p>Jelajahi koleksi saat kamu siap menyiapkan karakter berikutnya.</p>
        </div>
        <Link className={styles.secondaryAction} href="/katalog">
          Buka koleksi <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT DASHBOARD CLIENT
// ═══════════════════════════════════════════════════════════════════

export default function DashboardClient({
  userName,
  role,
  rentalState,
  rentals,
  reviewState = "ready",
  reviews = [],
  stats,
  items = [],
  itemsState = "ready",
}) {
  const isOwner = role === "admin";

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/" className={styles.logo} aria-label="Cosplay Asik beranda">
            cosplay<span>asik.</span>
          </Link>

          {isOwner ? (
            <span className={styles.ownerRoleBadge}>Pemilik Toko</span>
          ) : (
            <nav className={styles.primaryNav} aria-label="Navigasi pelanggan">
              <a
                className={`${styles.navLink} ${styles.navLinkActive}`}
                href="#dashboard"
                aria-current="page"
              >
                Dashboard
              </a>
              <Link className={styles.navLink} href="/katalog">
                Katalog
              </Link>
              <a className={styles.navLink} href="#rental">
                Rental saya
              </a>
            </nav>
          )}

          <div className={styles.customerIdentity}>
            <span className={styles.customerMark} aria-hidden="true">
              {getUserInitials(userName)}
            </span>
            <span className={styles.customerDetails}>
              <strong>{userName}</strong>
              <span>{isOwner ? "Admin" : "Pelanggan"}</span>
            </span>
            <form className={styles.logoutForm} action={logoutAction}>
              <button className={styles.logoutButton} type="submit">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className={styles.pageInner}>
        {isOwner ? (
          <OwnerDashboardView
            rentalState={rentalState}
            rentals={rentals}
            stats={stats}
            items={items}
            itemsState={itemsState}
            reviewState={reviewState}
            reviews={reviews}
          />
        ) : (
          <CustomerDashboardView
            userName={userName}
            rentalState={rentalState}
            rentals={rentals}
            reviewState={reviewState}
            reviews={reviews}
          />
        )}
      </div>
    </main>
  );
}
