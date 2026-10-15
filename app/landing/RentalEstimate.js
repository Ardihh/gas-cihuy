"use client";

import Link from "next/link";
import { useState } from "react";

import { formatRupiah } from "../../lib/format-currency.mjs";
import styles from "../page.module.css";

export default function RentalEstimate({ item }) {
  const [days, setDays] = useState(3);

  return (
    <div className={styles.estimate}>
      <p className={styles.estimateLabel}><span>Catatan sewa</span><span aria-hidden="true">CA / 01</span></p>
      <h3>{item.name}</h3>
      <dl className={styles.estimateLines}>
        <div><dt>Harga per hari</dt><dd>{formatRupiah(item.pricePerDay)}</dd></div>
        <div><dt>Jumlah contoh</dt><dd>1 item</dd></div>
      </dl>
      <div className={styles.durationChoice} role="group" aria-label="Durasi contoh estimasi">
        {[1, 3, 7].map((value) => (
          <button type="button" key={value} aria-pressed={days === value} onClick={() => setDays(value)}>
            {value} hari
          </button>
        ))}
      </div>
      <p className={styles.estimateTotal} role="status" aria-live="polite" aria-atomic="true">
        <span>Estimasi {days} hari</span>
        <strong>{formatRupiah(item.pricePerDay * days)}</strong>
      </p>
      <p className={styles.estimateNote}>Simulasi, bukan konfirmasi rental. Total final dan ketersediaan ditentukan saat pengajuan.</p>
      <Link href={"/product/" + item.id + "#calculator-title"} className={styles.textLink}>
        Atur tanggal di detail item <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
