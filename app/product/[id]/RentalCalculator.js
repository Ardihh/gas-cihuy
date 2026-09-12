"use client";

import { useState } from "react";

import {
  calculateEstimatedTotal,
  calculateInclusiveRentalDays,
  parseQuantity,
} from "../../../lib/rental-calculation.mjs";
import styles from "./page.module.css";

function formatRupiah(value) {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

export default function RentalCalculator({ priceLabel, pricePerDay }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");

  const duration = calculateInclusiveRentalDays(startDate, endDate);
  const quantity = parseQuantity(quantityInput);
  const dateError = startDate && endDate && duration === null
    ? "Tanggal selesai harus sama atau setelah tanggal mulai."
    : null;
  const quantityError = quantity === null
    ? "Jumlah harus berupa bilangan bulat minimal 1."
    : null;
  const total = duration !== null && quantity !== null
    ? calculateEstimatedTotal(pricePerDay, duration, quantity)
    : null;

  return (
    <section className={styles.calculatorSection} aria-labelledby="calculator-title">
      <div className={styles.calculatorIntro}>
        <div>
          <p className={styles.sectionLabel}>Rental</p>
          <h2 id="calculator-title">Atur periode rental</h2>
        </div>
        <p>
          Pilih tanggal dan jumlah item untuk melihat estimasi biaya per hari.
        </p>
      </div>

      <div className={styles.calculatorBody}>
        <div className={styles.calculatorForm}>
          <div className={styles.calculatorFields}>
            <div className={styles.calculatorField}>
              <label htmlFor="rental-start-date">Tanggal mulai</label>
              <input
                id="rental-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-describedby="rental-date-help"
              />
            </div>

            <div className={styles.calculatorField}>
              <label htmlFor="rental-end-date">Tanggal selesai</label>
              <input
                id="rental-end-date"
                type="date"
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
                type="number"
                min="1"
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
            Tanggal dihitung inklusif: tanggal yang sama berarti 1 hari sewa.
          </p>
          {dateError ? (
            <p id="rental-date-error" className={styles.errorMessage} role="alert">
              {dateError}
            </p>
          ) : null}
          <p id="rental-quantity-help" className={styles.calculatorHint}>
            Jumlah adalah simulasi unit dan belum memeriksa stok aktual.
          </p>
          {quantityError ? (
            <p id="rental-quantity-error" className={styles.errorMessage} role="alert">
              {quantityError}
            </p>
          ) : null}
        </div>

        <aside className={styles.estimate} aria-labelledby="estimate-title">
          <div className={styles.estimateHeader}>
            <h3 id="estimate-title">Rincian rental</h3>
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
            Ketersediaan aktual diperiksa saat pengajuan rental.
          </p>
        </aside>
      </div>
    </section>
  );
}
