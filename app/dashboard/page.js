"use client";

import Link from "next/link";
import { useState } from "react";
import { products } from "../data/products";
import { rentals as initialRentals, formatRupiah } from "../data/rentals";
import styles from "./page.module.css";

// ── Status helpers ──────────────────────────────────────────

const statusLabels = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  ONGOING: "Sedang disewa",
  COMPLETED: "Selesai",
  REJECTED: "Ditolak",
};

const dotStyles = {
  PENDING: styles.dotPending,
  APPROVED: styles.dotApproved,
  ONGOING: styles.dotOngoing,
  COMPLETED: styles.dotCompleted,
  REJECTED: styles.dotRejected,
};

const filterDefs = [
  { key: "Semua",    match: () => true },
  { key: "Menunggu", match: (r) => r.status === "PENDING" },
  { key: "Aktif",    match: (r) => r.status === "APPROVED" || r.status === "ONGOING" },
  { key: "Selesai",  match: (r) => r.status === "COMPLETED" },
  { key: "Ditolak",  match: (r) => r.status === "REJECTED" },
];

// ── Stats computation ───────────────────────────────────────

function computeStats(list) {
  const thisMonth = list.filter(
    (r) => r.status === "COMPLETED" || r.status === "ONGOING" || r.status === "APPROVED",
  );
  const revenue = thisMonth
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + r.totalPrice, 0);
  const active = list.filter((r) => r.status === "APPROVED" || r.status === "ONGOING").length;
  const pending = list.filter((r) => r.status === "PENDING").length;
  const available = products.filter((p) => p.status === "available").length;

  return { revenue, active, pending, available };
}

// ── Components ──────────────────────────────────────────────

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">
      cosplay<span>asik.</span>
    </Link>
  );
}

function StatCard({ label, value, note, accent }) {
  return (
    <div className={`${styles.statCard} ${accent || ""}`}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {note && <p className={styles.statNote}>{note}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <div className={styles.recordStatus}>
      <span className={`${styles.statusDot} ${dotStyles[status] || ""}`} aria-hidden="true" />
      <span>{statusLabels[status] || status}</span>
    </div>
  );
}

function RentalRecord({ rental, onApprove, onReject, decisions }) {
  const decision = decisions[rental.id];
  const isPending = rental.status === "PENDING" && !decision;

  return (
    <li className={styles.record}>
      <div className={styles.recordGrid}>
        <div className={styles.recordCustomer}>
          <h3>{rental.customerName}</h3>
          <p>Diajukan {rental.submittedAt}</p>
        </div>

        <div className={styles.recordItem}>
          <strong>{rental.item}</strong>
          <span>{rental.category} · {rental.quantity}×</span>
        </div>

        <div className={styles.recordPeriod}>
          <span className={styles.recordLabel}>Periode</span>
          <span>{rental.period}</span>
        </div>

        <div className={styles.recordPrice}>
          <span className={styles.recordLabel}>Total</span>
          <strong>{formatRupiah(rental.totalPrice)}</strong>
        </div>

        {!decision && <StatusBadge status={rental.status} />}

        {decision === "APPROVED" && (
          <span className={`${styles.actionDone} ${styles.actionDoneApproved}`}>✓ Disetujui</span>
        )}

        {decision === "REJECTED" && (
          <span className={`${styles.actionDone} ${styles.actionDoneRejected}`}>✗ Ditolak</span>
        )}

        {isPending && (
          <div className={styles.recordActions}>
            <button
              className={styles.btnApprove}
              type="button"
              onClick={() => onApprove(rental.id)}
            >
              Terima
            </button>
            <button
              className={styles.btnReject}
              type="button"
              onClick={() => onReject(rental.id)}
            >
              Tolak
            </button>
          </div>
        )}
      </div>

      {rental.notes && (
        <div className={styles.noteRow}>
          <strong>Catatan:</strong>{rental.notes}
        </div>
      )}
    </li>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function OwnerDashboard() {
  const [filter, setFilter] = useState("Semua");
  const [decisions, setDecisions] = useState({});
  const [toast, setToast] = useState(null);

  // Apply local decisions on top of initial data
  const rentals = initialRentals.map((r) => {
    if (decisions[r.id]) return { ...r, status: decisions[r.id] };
    return r;
  });

  const stats = computeStats(rentals);
  const currentFilter = filterDefs.find((f) => f.key === filter) || filterDefs[0];
  const filtered = rentals.filter(currentFilter.match);

  function approve(id) {
    setDecisions((prev) => ({ ...prev, [id]: "APPROVED" }));
    setToast({ type: "success", text: "Permintaan rental telah disetujui." });
  }

  function reject(id) {
    setDecisions((prev) => ({ ...prev, [id]: "REJECTED" }));
    setToast({ type: "reject", text: "Permintaan rental ditolak." });
  }

  // Split filtered into sections
  const pendingList = filtered.filter((r) => r.status === "PENDING" && !decisions[r.id]);
  const activeList = filtered.filter((r) => r.status === "APPROVED" || r.status === "ONGOING");
  const historyList = filtered.filter((r) => r.status === "COMPLETED" || r.status === "REJECTED");

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Brand />
          <nav className={styles.ownerNav} aria-label="Navigasi pemilik toko">
            <a href="#dashboard" className={styles.navActive} aria-current="page">Dashboard</a>
            <a href="#permintaan">Permintaan</a>
            <a href="#riwayat">Riwayat</a>
          </nav>
          <div className={styles.ownerBadge}>
            <span className={styles.ownerAvatar} aria-hidden="true">CA</span>
            <span className={styles.ownerInfo}>
              <strong>CosplayAsik</strong>
              <span>Pemilik Toko</span>
            </span>
          </div>
        </div>
      </header>

      <div className={styles.pageBody}>
        {/* ── Intro ── */}
        <header className={styles.intro} id="dashboard">
          <div>
            <p className={styles.eyebrow}>Panel pemilik toko</p>
            <h1>Dashboard Toko</h1>
            <p className={styles.introDesc}>
              Kelola permintaan penyewaan, pantau rental aktif, dan lihat riwayat transaksi dari satu tempat.
            </p>
          </div>
          <Link href="/" className={styles.backLink}>
            ← Kembali ke beranda
          </Link>
        </header>

        {/* ── Stats ── */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Pendapatan (selesai)"
            value={formatRupiah(stats.revenue)}
            note="Dari rental berstatus selesai"
            accent={styles.statAccent}
          />
          <StatCard
            label="Rental aktif"
            value={stats.active}
            note="Disetujui & sedang disewa"
            accent={styles.statGood}
          />
          <StatCard
            label="Menunggu persetujuan"
            value={stats.pending}
            note="Perlu ditinjau"
            accent={styles.statWarn}
          />
          <StatCard
            label="Item tersedia"
            value={stats.available}
            note={`Dari ${products.length} total item`}
          />
        </div>

        {/* ── Toast ── */}
        {toast && (
          <p
            className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastReject}`}
            role="status"
            aria-live="polite"
          >
            {toast.text}
          </p>
        )}

        {/* ── Permintaan Masuk ── */}
        <section className={styles.section} id="permintaan" aria-labelledby="pending-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Perlu ditinjau</p>
              <h2 id="pending-title">Permintaan masuk</h2>
            </div>
            <p className={styles.sectionCount}>
              {pendingList.length} permintaan menunggu
            </p>
          </div>

          {pendingList.length > 0 ? (
            <ul className={styles.recordList}>
              {pendingList.map((rental) => (
                <RentalRecord
                  key={rental.id}
                  rental={rental}
                  onApprove={approve}
                  onReject={reject}
                  decisions={decisions}
                />
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>Tidak ada permintaan yang menunggu persetujuan.</p>
          )}
        </section>

        {/* ── Rental Aktif ── */}
        <section className={styles.section} aria-labelledby="active-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Sedang berlangsung</p>
              <h2 id="active-title">Rental aktif</h2>
            </div>
            <p className={styles.sectionCount}>
              {activeList.length} rental
            </p>
          </div>

          {activeList.length > 0 ? (
            <ul className={styles.recordList}>
              {activeList.map((rental) => (
                <RentalRecord
                  key={rental.id}
                  rental={rental}
                  onApprove={approve}
                  onReject={reject}
                  decisions={decisions}
                />
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>Belum ada rental aktif saat ini.</p>
          )}
        </section>

        {/* ── Riwayat Transaksi ── */}
        <section className={styles.section} id="riwayat" aria-labelledby="history-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Catatan transaksi</p>
              <h2 id="history-title">Riwayat transaksi</h2>
            </div>
          </div>

          <div className={styles.filterRow} role="group" aria-label="Filter riwayat">
            {filterDefs.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ""}`}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.key}
                <span>{String(rentals.filter(f.match).length).padStart(2, "0")}</span>
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <ul className={styles.recordList}>
              {filtered.map((rental) => (
                <RentalRecord
                  key={rental.id}
                  rental={rental}
                  onApprove={approve}
                  onReject={reject}
                  decisions={decisions}
                />
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>Tidak ada transaksi yang cocok dengan filter ini.</p>
          )}
        </section>

        {/* ── Closing CTA ── */}
        <div className={styles.closing}>
          <div>
            <h2>Kelola inventori</h2>
            <p>Tambah, edit, atau hapus item kostum dan aksesori di katalog toko kamu.</p>
          </div>
          <Link href="/" className={styles.primaryAction}>
            Buka katalog <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
