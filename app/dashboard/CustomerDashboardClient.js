"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createReviewAction } from "../actions/reviews.js";
import { cancelRentalAction } from "../actions/rentals.js";
import { formatRupiah } from "../../lib/format-currency.mjs";
import { getReviewPresentation } from "../../lib/review-adapter.mjs";
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

const REVIEW_RATINGS = [1, 2, 3, 4, 5];
const initialReviewState = { status: "idle", error: "" };
const CANCELLATION_SUCCESS_VISIBLE_MS = 2000;
const REVIEW_SUCCESS_VISIBLE_MS = 2000;

const statusStyles = {
  pending: styles.statusPending,
  approved: styles.statusApproved,
  ongoing: styles.statusOngoing,
  returned: styles.statusCompleted,
  rejected: styles.statusCompleted,
  cancelled: styles.statusCompleted,
};

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

export default function CustomerDashboardClient({
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
          Lihat katalog <span aria-hidden="true">↗</span>
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
