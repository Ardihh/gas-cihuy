"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createRentalAction } from "../../../app/actions/rentals.js";
import { formatRupiah } from "../../../lib/format-currency.mjs";
import {
  calculateEstimatedTotal,
  calculateInclusiveRentalDays,
  parseQuantity,
} from "../../../lib/rental-calculation.mjs";
import styles from "./page.module.css";

const initialSubmissionState = {
  status: "idle",
  error: "",
  result: null,
};

function getTodayCalendarDate() {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, "0");
  const day = String(today.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRentalStatusLabel(status) {
  return status === "pending" ? "Menunggu persetujuan" : status;
}

export default function RentalCalculator({ canRent, itemId, priceLabel, pricePerDay, stock }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");
  const submitAction = useMemo(() => createRentalAction.bind(null, itemId), [itemId]);
  const [submissionState, formAction, pending] = useActionState(
    submitAction,
    initialSubmissionState,
  );
  const today = getTodayCalendarDate();

  const duration = calculateInclusiveRentalDays(startDate, endDate);
  const quantity = parseQuantity(quantityInput);
  const dateError = startDate && endDate && duration === null
    ? "Tanggal selesai harus sama atau setelah tanggal mulai."
    : null;
  const quantityError = quantity === null
    ? "Jumlah harus berupa bilangan bulat minimal 1."
    : quantity > stock
      ? `Jumlah melebihi stok tersedia (${stock} item).`
      : null;
  const total = duration !== null && quantity !== null && quantityError === null
    ? calculateEstimatedTotal(pricePerDay, duration, quantity)
    : null;

  if (!canRent) {
    return (
      <section className={styles.calculatorSection} aria-labelledby="calculator-title">
        <div className={styles.calculatorIntro}>
          <div>
            <p className={styles.sectionLabel}>Rental</p>
            <h2 id="calculator-title">Hitung estimasi rental</h2>
          </div>
        </div>
        <p className={styles.calculatorUnavailable} role="status">
          Item ini sedang tidak tersedia untuk disewa.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.calculatorSection} aria-labelledby="calculator-title">
      <div className={styles.calculatorIntro}>
        <div>
          <p className={styles.sectionLabel}>Rental</p>
          <h2 id="calculator-title">Hitung estimasi rental</h2>
        </div>
        <p>
          Masukkan periode dan jumlah item untuk melihat simulasi biaya.
        </p>
      </div>

      <form className={styles.calculatorBody} action={formAction} aria-busy={pending}>
        <div className={styles.calculatorForm}>
          <p className={styles.panelLabel}>Input</p>
          <div className={styles.calculatorFields}>
            <div className={styles.calculatorField}>
              <label htmlFor="rental-start-date">Tanggal mulai</label>
              <input
                id="rental-start-date"
                name="startDate"
                type="date"
                min={today}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-describedby="rental-date-help"
              />
            </div>

            <div className={styles.calculatorField}>
              <label htmlFor="rental-end-date">Tanggal selesai</label>
              <input
                id="rental-end-date"
                name="endDate"
                type="date"
                min={today}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                aria-invalid={Boolean(dateError)}
                aria-describedby={dateError ? "rental-date-help rental-date-error" : "rental-date-help"}
              />
            </div>

            <div className={styles.calculatorField}>
              <label htmlFor="rental-quantity">Jumlah</label>
              <input
                id="rental-quantity"
                name="quantity"
                type="number"
                min="1"
                max={stock}
                step="1"
                inputMode="numeric"
                value={quantityInput}
                onChange={(event) => setQuantityInput(event.target.value)}
                aria-invalid={Boolean(quantityError)}
                aria-describedby={quantityError ? "rental-quantity-help rental-quantity-error" : "rental-quantity-help"}
              />
            </div>
          </div>

          <p id="rental-date-help" className={styles.calculatorHint}>
            Rentang tanggal menghitung hari mulai dan hari selesai; tanggal yang sama berarti 1 hari sewa.
          </p>
          {dateError ? (
            <p id="rental-date-error" className={styles.errorMessage} role="alert">
              {dateError}
            </p>
          ) : null}
          <p id="rental-quantity-help" className={styles.calculatorHint}>
            Maksimal {stock} item sesuai stok saat ini; ketersediaan aktual diperiksa kembali saat pengajuan.
          </p>
          {quantityError ? (
            <p id="rental-quantity-error" className={styles.errorMessage} role="alert">
              {quantityError}
            </p>
          ) : null}
        </div>

        <aside className={styles.estimate} aria-labelledby="estimate-title">
          <div className={styles.estimateHeader}>
            <div>
              <p className={styles.panelLabel}>Hasil</p>
              <h3 id="estimate-title">Rincian rental</h3>
            </div>
            <span>{total === null ? "Belum lengkap" : "Simulasi"}</span>
          </div>
          <dl className={styles.estimateBreakdown}>
            <div>
              <dt>Harga / hari</dt>
              <dd>{priceLabel}</dd>
            </div>
            <div>
              <dt>Durasi</dt>
              <dd>{duration === null ? "—" : `${duration} hari`}</dd>
            </div>
            <div>
              <dt>Jumlah</dt>
              <dd>{quantity === null ? "—" : `${quantity} item`}</dd>
            </div>
            <div className={styles.estimateTotal}>
              <dt>Estimasi biaya</dt>
              <dd>{total === null ? "—" : formatRupiah(total)}</dd>
            </div>
          </dl>
          <p className={styles.estimateFormula} aria-live="polite">
            {total === null
              ? "Lengkapi tanggal dan jumlah untuk melihat estimasi."
              : `${priceLabel} × ${duration} hari × ${quantity}`}
          </p>
          <p className={styles.estimateAvailability}>
            Estimasi ini bukan konfirmasi rental.
          </p>
        </aside>

        <div className={styles.submissionArea}>
          <button
            className={styles.submitButton}
            disabled={pending || total === null}
            type="submit"
          >
            {pending ? "Mengajukan\u2026" : "Ajukan Sewa"}
            <span aria-hidden="true">{"\u2192"}</span>
          </button>
          <p className={styles.submissionHint}>
            Pengajuan akan diperiksa dan belum menjadi konfirmasi rental.
          </p>

          {submissionState?.error ? (
            <p className={styles.submissionError} role="alert">
              {submissionState.error}
              {submissionState.status === "unauthenticated" ? (
                <>
                  {" "}
                  <Link href="/login">Masuk ke akun</Link>
                </>
              ) : null}
            </p>
          ) : null}

          {submissionState?.status === "success" && submissionState.result ? (
            <div className={styles.submissionSuccess} role="status" aria-live="polite">
              <p className={styles.panelLabel}>Pengajuan terkirim</p>
              <p>{submissionState.result.message}</p>
              <dl className={styles.submissionDetails}>
                <div>
                  <dt>Status</dt>
                  <dd>{getRentalStatusLabel(submissionState.result.rental.status)}</dd>
                </div>
                <div>
                  <dt>Durasi terverifikasi</dt>
                  <dd>{submissionState.result.calculation.days} hari</dd>
                </div>
                <div>
                  <dt>Total rental</dt>
                  <dd>{formatRupiah(submissionState.result.calculation.totalPrice)}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </form>
    </section>
  );
}
