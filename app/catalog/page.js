"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { products } from "../data/products";
import catalogUtils from "./catalog-utils.js";
import styles from "./page.module.css";

const { filterAndSortProducts } = catalogUtils;

const categories = ["Semua", ...new Set(products.map((item) => item.category))];
const statusOptions = [
  ["Semua status", "Semua status"],
  ["Tersedia", "available"],
  ["Terbatas", "limited"],
  ["Tidak tersedia", "unavailable"],
];
const sortOptions = ["Relevan", "Harga terendah", "Harga tertinggi"];
const statusLabels = {
  available: "Tersedia",
  limited: "Stok terbatas",
  unavailable: "Tidak tersedia",
};

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">
      cosplay<span>asik.</span>
    </Link>
  );
}

function ProductImage({ product }) {
  return (
    <div
      className={styles.productImage}
      data-category={product.category}
      role="img"
      aria-label={`Foto ${product.name} belum tersedia`}
    >
      <div className={styles.imageMeta}>
        <span>{String(product.id).padStart(2, "0")}</span>
        <span>{product.category}</span>
      </div>
      <p className={styles.imageName}>{product.name}</p>
      <span className={styles.imageNote}>Foto produk belum tersedia</span>
    </div>
  );
}

function AvailabilityBadge({ status }) {
  return (
    <span className={styles.availabilityBadge} data-status={status}>
      <span className={styles.statusMark} aria-hidden="true">●</span>
      {statusLabels[status] || "Status belum tersedia"}
    </span>
  );
}

function ProductCard({ product }) {
  const unavailable = product.status === "unavailable";

  return (
    <li>
      <Link
        href={`/product/${product.id}`}
        className={styles.productCard}
        data-status={product.status}
        aria-label={`${product.name}, ${product.price} per hari, ${statusLabels[product.status]}`}
      >
        <div className={styles.cardMedia}>
          <ProductImage product={product} />
          <AvailabilityBadge status={product.status} />
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardCategory}>{product.category}</p>
          <h2 className={styles.productName}>{product.name}</h2>
          <p className={styles.productPrice}>
            <strong>{product.price}</strong>
            <span>/ hari</span>
          </p>
          <div className={styles.cardFooter}>
            <span className={styles.cardAvailability}>
              <span className={styles.inlineStatus} data-status={product.status} aria-hidden="true">●</span>
              {statusLabels[product.status] || "Status belum tersedia"}
            </span>
            <span className={styles.cardAction}>
              {unavailable ? "Lihat detail · tidak tersedia" : "Lihat detail"}
              <span aria-hidden="true">↗</span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className={styles.emptyState} role="status">
      <p className={styles.eyebrow}>Koleksi tidak ditemukan</p>
      <h2>Coba kata kunci atau filter lain.</h2>
      <p>Belum ada item contoh yang cocok dengan pencarianmu.</p>
      <button type="button" className={styles.resetButton} onClick={onReset}>
        Hapus semua filter <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}

export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [status, setStatus] = useState("Semua status");
  const [sort, setSort] = useState("Relevan");

  const visibleProducts = useMemo(
    () => filterAndSortProducts(products, { query, category, status, sort }),
    [category, query, sort, status],
  );

  const hasFilters = Boolean(query || category !== "Semua" || status !== "Semua status" || sort !== "Relevan");

  function resetFilters() {
    setQuery("");
    setCategory("Semua");
    setStatus("Semua status");
    setSort("Relevan");
  }

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main">Lewati navigasi</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Brand />
          <nav className={styles.desktopNav} aria-label="Navigasi utama">
            <Link href="/">Beranda</Link>
            <Link href="/catalog" aria-current="page">Koleksi</Link>
            <Link href="/dashboard">Dashboard <span>demo</span></Link>
          </nav>
          <details className={styles.mobileMenu}>
            <summary>Menu <span aria-hidden="true">+</span></summary>
            <nav aria-label="Navigasi seluler">
              <Link href="/">Beranda <span aria-hidden="true">↗</span></Link>
              <Link href="/catalog" aria-current="page">Koleksi <span aria-hidden="true">↗</span></Link>
              <Link href="/dashboard">Dashboard demo <span aria-hidden="true">↗</span></Link>
            </nav>
          </details>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className={styles.catalogIntro} aria-labelledby="catalog-title">
          <nav className={styles.breadcrumb} aria-label="Lokasi halaman">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Koleksi</span>
          </nav>
          <div className={styles.introGrid}>
            <div>
              <p className={styles.eyebrow}>Koleksi cosplay</p>
              <h1 id="catalog-title">Temukan karakter berikutnya.</h1>
              <p className={styles.introDescription}>
                Jelajahi kostum dan aksesori contoh, cek harga sewa per hari, lalu buka detail item yang paling cocok.
              </p>
            </div>
            <p className={styles.introNote}>
              <strong>{products.length} item contoh</strong>
              <span>Harga ditampilkan per hari. Ketersediaan aktual diperiksa saat pengajuan.</span>
            </p>
          </div>
        </section>

        <section className={styles.catalogBody} aria-labelledby="discovery-title">
          <h2 id="discovery-title" className={styles.visuallyHidden}>Cari dan saring koleksi</h2>
          <div className={styles.controls}>
            <label className={styles.searchField}>
              <span>Cari produk</span>
              <span className={styles.inputShell}>
                <span className={styles.searchIcon} aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nama kostum atau aksesori"
                  aria-label="Cari berdasarkan nama produk"
                />
              </span>
            </label>
            <label className={styles.selectField}>
              <span>Ketersediaan</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statusOptions.map(([label, value]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className={styles.selectField}>
              <span>Urutkan</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                {sortOptions.map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <div className={styles.categoryHeader}>
            <p className={styles.controlLabel}>Jelajahi berdasarkan kategori</p>
            <span className={styles.categoryRule} aria-hidden="true" />
          </div>
          <div className={styles.categoryRail} role="group" aria-label="Filter kategori">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
                <span>{String(item === "Semua" ? products.length : products.filter((product) => product.category === item).length).padStart(2, "0")}</span>
              </button>
            ))}
          </div>

          <div className={styles.resultsBar}>
            <p role="status" aria-live="polite" aria-atomic="true">
              <strong>{visibleProducts.length}</strong> item ditampilkan
              {category !== "Semua" && <> <span aria-hidden="true">/</span> {category}</>}
            </p>
            {hasFilters && <button type="button" onClick={resetFilters}>Reset filter</button>}
          </div>

          {visibleProducts.length > 0 ? (
            <ul className={styles.productGrid} aria-label="Daftar produk cosplay">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </ul>
          ) : <EmptyState onReset={resetFilters} />}
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <Brand />
          <p>Sewa kostum &amp; aksesori cosplay per hari.</p>
        </div>
        <nav aria-label="Navigasi footer">
          <Link href="/">Beranda</Link>
          <Link href="/catalog">Koleksi</Link>
          <Link href="/dashboard">Dashboard demo</Link>
        </nav>
        <p className={styles.copyright}>© 2026 Cosplay Asik</p>
      </footer>
    </div>
  );
}
