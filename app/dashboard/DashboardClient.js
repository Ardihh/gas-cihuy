"use client";

import Link from "next/link";
import { useState } from "react";

import { logoutAction } from "../actions/auth.js";
import { formatRupiah } from "../../lib/format-currency.mjs";
import {
  RENTAL_FILTERS,
  deriveRentalCounts,
  formatRentalPeriod,
  getAttentionGroups,
  getRentalStatusLabel,
  isFeedbackEligible,
  isHistoryRental,
  matchesRentalFilter,
} from "../../lib/rental-presentation.mjs";

import styles from "./page.module.css";

const statusStyles = {
  pending: styles.statusPending,
  approved: styles.statusApproved,
  ongoing: styles.statusOngoing,
  returned: styles.statusCompleted,
  rejected: styles.statusCompleted,
  cancelled: styles.statusCompleted,
};

function getUserInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function FeedbackForm({ rental, feedbackText, onChange, onSubmit }) {
  return (
    <div className={styles.feedbackForm} id={`feedback-form-${rental.id}`}>
      <p className={styles.formEyebrow}>Feedback untuk</p>
      <h4 id={`feedback-title-${rental.id}`}>{rental.itemName}</h4>
      <p className={styles.feedbackNote} id={`feedback-note-${rental.id}`}>
        Feedback hanya tersimpan selama sesi demo ini.
      </p>
      <form
        onSubmit={onSubmit}
        aria-labelledby={`feedback-title-${rental.id}`}
        aria-describedby={`feedback-note-${rental.id}`}
      >
        <label className={styles.formLabel} htmlFor={`feedback-text-${rental.id}`}>
          Ceritakan pengalamanmu
        </label>
        <textarea
          className={styles.textarea}
          id={`feedback-text-${rental.id}`}
          maxLength={500}
          onChange={onChange}
          placeholder="Contoh: Costume-nya masih bagus dan proses rental juga mudah..."
          required
          rows={4}
          value={feedbackText}
        />
        <div className={styles.formFooter}>
          <span>{feedbackText.length}/500</span>
          <button className={styles.submitButton} type="submit">
            Simpan feedback →
          </button>
        </div>
      </form>
    </div>
  );
}

function RentalRecord({
  rental,
  selectedRentalId,
  sentFeedback,
  onChooseFeedback,
  feedbackText,
  onFeedbackChange,
  onFeedbackSubmit,
}) {
  const selected = selectedRentalId === rental.id;
  const hasFeedback = sentFeedback.includes(rental.id);
  const feedbackAvailable = isFeedbackEligible(rental);

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

        {feedbackAvailable && (
          <div className={styles.recordAction}>
            {hasFeedback ? (
              <span className={styles.feedbackDone}>Feedback tercatat di sesi ini</span>
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
            )}
          </div>
        )}
      </div>

      {selected && (
        <FeedbackForm
          rental={rental}
          feedbackText={feedbackText}
          onChange={onFeedbackChange}
          onSubmit={onFeedbackSubmit}
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

export default function DashboardClient({ currentUser, rentalState, rentals }) {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedRentalId, setSelectedRentalId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [sentFeedback, setSentFeedback] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const filteredRentals = rentals.filter((rental) =>
    matchesRentalFilter(rental, activeFilter),
  );
  const currentRentals = filteredRentals.filter((rental) => !isHistoryRental(rental));
  const historyRentals = filteredRentals.filter(isHistoryRental);
  const counts = deriveRentalCounts(rentals);
  const attentionGroups = getAttentionGroups(rentals);
  const attentionCount = counts.pending + counts.active;

  function chooseFeedback(rentalId) {
    if (selectedRentalId === rentalId) {
      setSelectedRentalId(null);
      setFeedbackText("");
      return;
    }

    setSelectedRentalId(rentalId);
    setFeedbackText("");
    setSuccessMessage("");
  }

  function submitFeedback(event) {
    event.preventDefault();
    if (!feedbackText.trim() || !selectedRentalId) return;

    setSentFeedback((current) => [...current, selectedRentalId]);
    setSelectedRentalId(null);
    setFeedbackText("");
    setSuccessMessage("Feedback tersimpan di sesi demo ini.");
  }

  const recordProps = {
    selectedRentalId,
    sentFeedback,
    onChooseFeedback: chooseFeedback,
    feedbackText,
    onFeedbackChange: (event) => setFeedbackText(event.target.value),
    onFeedbackSubmit: submitFeedback,
  };

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/" className={styles.logo} aria-label="Cosplay Asik beranda">
            cosplay<span>asik.</span>
          </Link>

          <nav className={styles.primaryNav} aria-label="Navigasi pelanggan">
            <a
              className={`${styles.navLink} ${styles.navLinkActive}`}
              href="#dashboard"
              aria-current="page"
            >
              Dashboard
            </a>
            <Link className={styles.navLink} href="/#katalog">
              Katalog
            </Link>
            <a className={styles.navLink} href="#rental">
              Rental saya
            </a>
          </nav>

          <div className={styles.customerIdentity}>
            <span className={styles.customerMark} aria-hidden="true">
              {getUserInitials(currentUser.name)}
            </span>
            <span className={styles.customerDetails}>
              <strong>{currentUser.name}</strong>
              <span>Pelanggan</span>
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
        <header className={styles.pageIntro} id="dashboard">
          <div>
            <p className={styles.eyebrow}>Meja rental</p>
            <h1>Rental kamu, {currentUser.name}.</h1>
            <p className={styles.introDescription}>
              Pantau pengajuan, jadwal rental, dan feedback kamu di satu tempat.
            </p>
            <p className={styles.sessionNote}>
              Data rental berasal dari layanan live; feedback hanya tersimpan di sesi ini.
            </p>
          </div>
          <Link className={styles.catalogLink} href="/#katalog">
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
            <p
              className={styles.sectionCount}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
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

          {successMessage && (
            <p className={styles.successMessage} aria-live="polite">
              ✓ {successMessage}
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
          <Link className={styles.secondaryAction} href="/#katalog">
            Buka koleksi <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
