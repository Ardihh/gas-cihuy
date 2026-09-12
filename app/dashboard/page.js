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
  PENDING: "Menunggu",
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

function isActive(rental) {
  return rental.status === "APPROVED" || rental.status === "ONGOING";
}

function matchesFilter(rental, filter) {
  if (filter === "Aktif") return isActive(rental);
  if (filter === "Menunggu") return rental.status === "PENDING";
  if (filter === "Selesai") return rental.status === "COMPLETED";
  return true;
}

function getSummary() {
  return [
    {
      label: "Rental Aktif",
      value: rentals.filter(isActive).length,
      icon: "🎭",
      note: "Sedang berjalan",
    },
    {
      label: "Menunggu Approval",
      value: rentals.filter((rental) => rental.status === "PENDING").length,
      icon: "⏳",
      note: "Perlu ditinjau",
    },
    {
      label: "Selesai",
      value: rentals.filter((rental) => rental.status === "COMPLETED").length,
      icon: "✓",
      note: "Total rental selesai",
    },
  ];
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
  const completedRentals = rentals.filter(
    (rental) => rental.status === "COMPLETED",
  );
  const selectedRental = completedRentals.find(
    (rental) => rental.id === selectedRentalId,
  );

  function chooseFeedback(rentalId) {
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
    setSuccessMessage("Feedback berhasil disimpan untuk rental kamu.");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎭</span>
            <span className={styles.logoText}>COSPLAY ASIK</span>
          </Link>

          <p className={styles.menuTitle}>Menu pelanggan</p>
          <nav className={styles.nav} aria-label="Menu pelanggan">
            <a className={`${styles.navItem} ${styles.navItemActive}`} href="#dashboard">
              <span>⌂</span>
              <span>Dashboard</span>
            </a>
            <Link className={styles.navItem} href="/#katalog">
              <span>▦</span>
              <span>Katalog</span>
            </Link>
            <a className={styles.navItem} href="#rental">
              <span>▣</span>
              <span>Rental Saya</span>
            </a>
            <a className={styles.navItem} href="#rental">
              <span>↺</span>
              <span>Riwayat Rental</span>
            </a>
            <a className={styles.navItem} href="#feedback">
              <span>💬</span>
              <span>Feedback</span>
            </a>
            <a className={styles.navItem} href="#profile">
              <span>◎</span>
              <span>Profile</span>
            </a>
          </nav>

          <div className={styles.sidebarBottom} id="profile">
            <div className={styles.avatar}>A</div>
            <div className={styles.profileInfo}>
              <strong>AniKun</strong>
              <span>Pelanggan</span>
            </div>
            <span className={styles.profileMore}>•••</span>
          </div>
        </aside>

        <section className={styles.content}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>AREA PELANGGAN</p>
              <h1 id="dashboard">Dashboard Pelanggan</h1>
              <p className={styles.headerDesc}>
                Pantau rental dan bagikan pengalaman cosplay kamu.
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.notification} type="button" aria-label="Notifikasi">
                ♢<span className={styles.notificationDot} />
              </button>
              <div className={styles.headerAvatar}>AK</div>
            </div>
          </header>

          <div className={styles.mainContent}>
            <section className={styles.summaryGrid} aria-label="Ringkasan rental">
              {getSummary().map((item) => (
                <article className={styles.summaryCard} key={item.label}>
                  <div className={styles.summaryIcon}>{item.icon}</div>
                  <div>
                    <p className={styles.summaryLabel}>{item.label}</p>
                    <strong className={styles.summaryValue}>{item.value}</strong>
                    <span className={styles.summaryNote}>{item.note}</span>
                  </div>
                </article>
              ))}
            </section>

            <section className={styles.section} id="rental">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>AKTIVITAS KAMU</p>
                  <h2>Rental Saya</h2>
                </div>
                <a className={styles.textLink} href="#feedback">
                  Lihat feedback →
                </a>
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

              <div className={styles.rentalList}>
                {filteredRentals.length > 0 ? (
                  filteredRentals.map((rental) => (
                    <article className={styles.rentalCard} key={rental.id}>
                      <div className={styles.rentalIcon}>{rental.icon}</div>
                      <div className={styles.rentalMain}>
                        <div className={styles.rentalTop}>
                          <div>
                            <h3>{rental.name}</h3>
                            <p>{rental.category}</p>
                          </div>
                          <span className={`${styles.status} ${statusStyles[rental.status]}`}>
                            {statusLabels[rental.status]}
                          </span>
                        </div>
                        <div className={styles.rentalBottom}>
                          <span>▣ {rental.date}</span>
                          <strong>{rental.price}</strong>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className={styles.emptyState}>Belum ada rental di filter ini.</p>
                )}
              </div>
            </section>

            <section className={`${styles.section} ${styles.feedbackSection}`} id="feedback">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>CERITAKAN PENGALAMANMU</p>
                  <h2>Customer Feedback</h2>
                </div>
                <span className={styles.optionalLabel}>Opsional · Tanpa rating bintang</span>
              </div>

              {successMessage && (
                <p className={styles.successMessage} aria-live="polite">
                  ✓ {successMessage}
                </p>
              )}

              <div className={styles.feedbackGrid}>
                <div className={styles.feedbackList}>
                  <p className={styles.feedbackIntro}>
                    Feedback hanya tersedia untuk rental yang sudah selesai.
                  </p>
                  {completedRentals.map((rental) => {
                    const hasFeedback =
                      rental.feedbackSubmitted || sentFeedback.includes(rental.id);

                    return (
                      <article className={styles.feedbackItem} key={rental.id}>
                        <div className={styles.feedbackItemIcon}>{rental.icon}</div>
                        <div className={styles.feedbackItemInfo}>
                          <strong>{rental.name}</strong>
                          <span>{rental.date}</span>
                        </div>
                        {hasFeedback ? (
                          <span className={styles.feedbackDone}>Sudah dikirim</span>
                        ) : (
                          <button
                            className={styles.feedbackButton}
                            type="button"
                            onClick={() => chooseFeedback(rental.id)}
                          >
                            {selectedRentalId === rental.id ? "Dipilih" : "Beri feedback"}
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className={styles.formCard}>
                  {selectedRental ? (
                    <form onSubmit={submitFeedback}>
                      <p className={styles.formEyebrow}>FEEDBACK UNTUK</p>
                      <h3>{selectedRental.name}</h3>
                      <label className={styles.formLabel} htmlFor="feedbackText">
                        Ceritakan pengalamanmu
                      </label>
                      <textarea
                        className={styles.textarea}
                        id="feedbackText"
                        maxLength={500}
                        onChange={(event) => setFeedbackText(event.target.value)}
                        placeholder="Contoh: Costume-nya masih bagus dan proses rental juga mudah..."
                        required
                        rows={5}
                        value={feedbackText}
                      />
                      <div className={styles.formFooter}>
                        <span>{feedbackText.length}/500</span>
                        <button className={styles.submitButton} type="submit">
                          Kirim Feedback →
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.formEmpty}>
                      <span className={styles.formEmptyIcon}>💬</span>
                      <h3>Punya cerita?</h3>
                      <p>Pilih rental selesai di samping untuk menulis feedback.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
