"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

// Data contoh untuk tampilan statis. Belum terhubung ke database.
const rentals = [
  {
    id: 1,
    name: "Costume Naruto Uzumaki",
    category: "Kostum / Anime",
    date: "10 Sep - 12 Sep 2026",
    price: "Rp270.000",
    status: "APPROVED",
    icon: "🍥",
    feedbackSubmitted: false,
  },
  {
    id: 2,
    name: "Wig Rem (Blue)",
    category: "Aksesoris / Wig",
    date: "18 Sep - 20 Sep 2026",
    price: "Rp120.000",
    status: "PENDING",
    icon: "💇",
    feedbackSubmitted: false,
  },
  {
    id: 3,
    name: "Props Nichirin Sword",
    category: "Aksesoris / Props",
    date: "25 Sep - 27 Sep 2026",
    price: "Rp150.000",
    status: "PENDING",
    icon: "🔥",
    feedbackSubmitted: false,
  },
  {
    id: 4,
    name: "Costume Gojo Satoru",
    category: "Kostum / Anime",
    date: "02 Sep - 04 Sep 2026",
    price: "Rp300.000",
    status: "COMPLETED",
    icon: "🧿",
    feedbackSubmitted: false,
  },
  {
    id: 5,
    name: "Costume Mikasa Ackerman",
    category: "Kostum / Anime",
    date: "20 Agu - 22 Agu 2026",
    price: "Rp360.000",
    status: "COMPLETED",
    icon: "⚔️",
    feedbackSubmitted: true,
  },
  {
    id: 6,
    name: "Costume Cloud Strife",
    category: "Kostum / Game",
    date: "12 Agu - 14 Agu 2026",
    price: "Rp450.000",
    status: "COMPLETED",
    icon: "🗡️",
    feedbackSubmitted: true,
  },
  {
    id: 7,
    name: "Wig Sakura",
    category: "Aksesoris / Wig",
    date: "05 Agu - 07 Agu 2026",
    price: "Rp180.000",
    status: "COMPLETED",
    icon: "🌸",
    feedbackSubmitted: true,
  },
  {
    id: 8,
    name: "Props Captain Shield",
    category: "Aksesoris / Props",
    date: "28 Jul - 30 Jul 2026",
    price: "Rp210.000",
    status: "COMPLETED",
    icon: "🛡️",
    feedbackSubmitted: true,
  },
];

const filters = ["Semua", "Aktif", "Menunggu", "Selesai"];

const statusLabels = {
  PENDING: "Menunggu persetujuan",
  APPROVED: "Disetujui",
  ONGOING: "Sedang disewa",
  COMPLETED: "Selesai",
};

const statusStyles = {
  PENDING: styles.statusPending,
  APPROVED: styles.statusApproved,
  ONGOING: styles.statusOngoing,
  COMPLETED: styles.statusCompleted,
};

const attentionStatuses = [
  { status: "PENDING", label: "Menunggu persetujuan" },
  { status: "APPROVED", label: "Sudah disetujui" },
  { status: "ONGOING", label: "Sedang disewa" },
];

function isActive(rental) {
  return rental.status === "APPROVED" || rental.status === "ONGOING";
}

function matchesFilter(rental, filter) {
  if (filter === "Aktif") return isActive(rental);
  if (filter === "Menunggu") return rental.status === "PENDING";
  if (filter === "Selesai") return rental.status === "COMPLETED";
  return true;
}

function isCompleted(rental) {
  return rental.status === "COMPLETED";
}

function getAttentionGroups() {
  return attentionStatuses
    .map(({ status, label }) => ({
      count: rentals.filter((rental) => rental.status === status).length,
      label,
    }))
    .filter((group) => group.count > 0);
}

function FeedbackForm({ rental, feedbackText, onChange, onSubmit }) {
  return (
    <div className={styles.feedbackForm} id={`feedback-form-${rental.id}`}>
      <p className={styles.formEyebrow}>Feedback untuk</p>
      <h4 id={`feedback-title-${rental.id}`}>{rental.name}</h4>
      <form onSubmit={onSubmit} aria-labelledby={`feedback-title-${rental.id}`}>
        <label className={styles.formLabel} htmlFor="feedbackText">
          Ceritakan pengalamanmu
        </label>
        <textarea
          className={styles.textarea}
          id="feedbackText"
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
            Kirim feedback →
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
  const completed = isCompleted(rental);
  const selected = selectedRentalId === rental.id;
  const hasFeedback = rental.feedbackSubmitted || sentFeedback.includes(rental.id);

  return (
    <li className={`${styles.record} ${selected ? styles.recordSelected : ""}`}>
      <div className={styles.recordGrid}>
        <div className={styles.recordIdentity}>
          <h3>{rental.name}</h3>
          <p>{rental.category}</p>
        </div>

        <div className={styles.recordStatus}>
          <span
            className={`${styles.statusDot} ${statusStyles[rental.status] || ""}`}
            aria-hidden="true"
          />
          <span>{statusLabels[rental.status] || rental.status}</span>
        </div>

        <div className={styles.recordDate}>
          <span className={styles.recordLabel}>Periode rental</span>
          <span>{rental.date}</span>
        </div>

        <div className={styles.recordPrice}>
          <span className={styles.recordLabel}>Total rental</span>
          <strong>{rental.price}</strong>
        </div>

        {completed && (
          <div className={styles.recordAction}>
            {hasFeedback ? (
              <span className={styles.feedbackDone}>Feedback sudah dikirim</span>
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

export default function CustomerDashboard() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedRentalId, setSelectedRentalId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [sentFeedback, setSentFeedback] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const filteredRentals = rentals.filter((rental) =>
    matchesFilter(rental, activeFilter),
  );
  const currentRentals = filteredRentals.filter((rental) => !isCompleted(rental));
  const historyRentals = filteredRentals.filter(isCompleted);
  const attentionGroups = getAttentionGroups();
  const attentionCount = attentionGroups.reduce(
    (total, group) => total + group.count,
    0,
  );

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
    setSuccessMessage("Feedback sudah dikirim untuk rental kamu.");
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
            <span className={styles.logoMark} aria-hidden="true">
              CA
            </span>
            <span>Cosplay Asik</span>
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
              AK
            </span>
            <span className={styles.customerDetails}>
              <strong>AniKun</strong>
              <span>Pelanggan</span>
            </span>
          </div>
        </div>
      </header>

      <div className={styles.pageInner}>
        <header className={styles.pageIntro} id="dashboard">
          <div>
            <p className={styles.eyebrow}>Ruang pelanggan</p>
            <h1>Halo, AniKun.</h1>
            <p className={styles.introDescription}>
              Pantau pengajuan, jadwal rental, dan feedback kamu di satu tempat.
            </p>
          </div>
          <Link className={styles.catalogLink} href="/#katalog">
            Cari kostum lagi <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <section className={styles.attention} aria-labelledby="attention-title">
          <div className={styles.attentionCopy}>
            <p className={styles.attentionLabel}>Perlu perhatian</p>
            <h2 id="attention-title">
              {attentionCount > 0
                ? `${attentionCount} rental perlu dipantau.`
                : "Tidak ada rental yang perlu dipantau."}
            </h2>
            <p>
              {attentionGroups.length > 0
                ? attentionGroups
                    .map((group) => `${group.count} ${group.label.toLowerCase()}`)
                    .join(" · ")
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
        </section>

        <section className={styles.rentalSection} id="rental" aria-labelledby="rental-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Aktivitas rental</p>
              <h2 id="rental-title">Rental kamu</h2>
            </div>
            <p className={styles.sectionCount}>
              {filteredRentals.length} rental di tampilan ini
            </p>
          </div>

          <div className={styles.filterRow} role="group" aria-label="Filter rental">
            {filters.map((filter) => (
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
                <p className={styles.emptyState}>Belum ada rental yang sesuai filter ini.</p>
              )}

              {activeFilter === "Semua" && historyRentals.length > 0 && (
                <div className={styles.historyBlock}>
                  <div className={styles.historyHeading}>
                    <h3>Riwayat terbaru</h3>
                    <span>{historyRentals.length} rental selesai</span>
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
                <span>{historyRentals.length} rental selesai</span>
              </div>
              {historyRentals.length > 0 ? (
                <RentalRecordList records={historyRentals} {...recordProps} />
              ) : (
                <p className={styles.emptyState}>Belum ada rental yang selesai.</p>
              )}
            </div>
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
