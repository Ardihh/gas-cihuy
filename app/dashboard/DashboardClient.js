"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { logoutAction } from "../actions/auth.js";
import {
  approveRentalAction,
  createItemAction,
  deleteItemAction,
  rejectRentalAction,
  updateItemAction,
  updateRentalStatusAction,
} from "../actions/owner.js";
import { formatRupiah } from "../../lib/format-currency.mjs";
import { getAllowedRentalTransitions } from "../../lib/rental-transitions.mjs";
import { formatRentalPeriod } from "../../lib/rental-presentation.mjs";

import CustomerDashboardClient from "./CustomerDashboardClient";
import styles from "./page.module.css";

// ─── Shared helpers ───────────────────────────────────────────────

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
      <a className={styles.skipLink} href="#dashboard-content">
        Lewati ke konten utama
      </a>
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
                Ringkasan
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

      <div className={styles.pageInner} id="dashboard-content" tabIndex={-1}>
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
          <CustomerDashboardClient
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
