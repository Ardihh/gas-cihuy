"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { formatRupiah } from "../../lib/format-currency.mjs";
import { filterAndSortProducts } from "../katalog/catalog-utils.mjs";
import ProductVisual from "./ProductVisual";
import styles from "../page.module.css";

export default function CollectionPreview({ products, catalogState }) {
  const [category, setCategory] = useState("Semua");
  const [retryPending, startRetry] = useTransition();
  const router = useRouter();
  const categories = ["Semua", ...new Set(products.map((item) => item.category))];
  const visibleProducts = filterAndSortProducts(products, { category });

  if (catalogState === "error") {
    return (
      <div className={styles.collectionEmpty} role="alert" aria-busy={retryPending}>
        <span className={styles.emptyMark} aria-hidden="true">CA</span>
        <div>
          <h3>Koleksi belum dapat dimuat.</h3>
          <p>Coba lagi sebentar. Kostum dan harga akan tampil saat koleksi tersedia.</p>
          <button type="button" disabled={retryPending} onClick={() => startRetry(() => router.refresh())}>
            {retryPending ? "Memuat ulang…" : "Muat ulang koleksi"} <span aria-hidden="true">↻</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.categoryIndex} role="group" aria-label="Pilih kategori koleksi">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            aria-controls="collection-products"
            onClick={() => setCategory(name)}
          >
            <span className={styles.categoryName}>{name}</span>
            <span className={styles.categoryCount}>{String(name === "Semua" ? products.length : products.filter((item) => item.category === name).length).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
      <p className={styles.collectionStatus} role="status" aria-live="polite" aria-atomic="true">
        {category === "Semua" ? "Pilihan koleksi" : category} — {visibleProducts.length} item di preview
      </p>
      <ul className={styles.productRack} id="collection-products" key={category}>
        {visibleProducts.map((item, index) => (
          <li key={item.id}>
            <Link href={"/product/" + item.id} className={styles.product}>
              <ProductVisual item={item} sizes="(max-width: 380px) 104px, (max-width: 700px) 45vw, (max-width: 1024px) 44vw, 22vw" />
              <div className={styles.productCaption}>
                <p className={styles.productMeta}><span>{item.category}</span><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></p>
                <h3>{item.name}<span className={styles.productArrow} aria-hidden="true">↗</span></h3>
                <div className={styles.productDetails}>
                  <p className={styles.price}><strong>{formatRupiah(item.pricePerDay)}</strong><span> / hari</span></p>
                  <p className={item.status === "available" ? styles.available : styles.unavailable}>
                    {item.status === "available" ? "Tersedia" : "Tidak tersedia"}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {visibleProducts.length === 0 && (
        <p className={styles.collectionNote} role="status">
          {products.length ? "Belum ada item di kategori " + category + "." : "Koleksi belum memiliki item."}
        </p>
      )}
    </>
  );
}
