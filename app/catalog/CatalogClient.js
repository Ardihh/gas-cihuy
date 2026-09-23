"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { formatRupiah } from "../../lib/format-currency.mjs";
import CatalogImage from "../CatalogImage";
import {
  buildCatalogSearchParams,
  canResetCatalogFilters,
  filterAndSortProducts,
  hasActiveCatalogFilters,
  parseCatalogSearchParams,
} from "./catalog-utils.mjs";
import styles from "./page.module.css";

const statusOptions = [
  ["Semua status", "Semua status"],
  ["Tersedia", "available"],
  ["Tidak tersedia", "unavailable"],
];

const sortOptions = ["Relevan", "Harga terendah", "Harga tertinggi"];
const defaultCatalogState = {
  query: "",
  category: "Semua",
  status: "Semua status",
  sort: "Relevan",
};

const statusLabels = {
  available: "Tersedia",
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
    <div className={styles.productImage} data-category={product.category}>
      <CatalogImage
        alt={`Foto produk ${product.name}`}
        className={styles.catalogImage}
        fallbackClassName={styles.imageNote}
        fallbackLabel="Foto menyusul"
        sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
        src={product.imageUrl}
      />
      <div className={styles.imageMeta}>
        <span>{String(product.id).padStart(2, "0")}</span>
        <span>{product.category}</span>
      </div>
      <p className={styles.imageName}>{product.name}</p>
    </div>
  );
}

function AvailabilityBadge({ status }) {
  return (
    <span className={styles.availabilityBadge} data-status={status}>
      <span className={styles.statusMark} aria-hidden="true">●</span>
      {statusLabels[status]}
    </span>
  );
}

function ProductCard({ product }) {
  const statusLabel = statusLabels[product.status];
  const priceLabel = formatRupiah(product.pricePerDay);
  const unavailable = product.status === "unavailable";

  return (
    <li>
      <Link
        href={`/product/${product.id}`}
        className={styles.productCard}
        data-status={product.status}
        aria-label={`${product.name}, ${priceLabel} per hari, ${statusLabel}`}
      >
        <div className={styles.cardMedia}>
          <ProductImage product={product} />
          <AvailabilityBadge status={product.status} />
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardCategory}>{product.category}</p>
          <h2 className={styles.productName}>{product.name}</h2>
          <p className={styles.productPrice}>
            <strong>{priceLabel}</strong>
            <span>/ hari</span>
          </p>
          <div className={styles.cardFooter}>
            <span className={styles.cardAvailability}>
              <span className={styles.inlineStatus} data-status={product.status} aria-hidden="true">●</span>
              {statusLabel}
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

function EmptyState({ hasProducts, canReset, onReset }) {
  return (
    <div className={styles.emptyState} role="status">
      <p className={styles.eyebrow}>{hasProducts ? "Koleksi tidak ditemukan" : "Koleksi live"}</p>
      <h2>{hasProducts ? "Coba kata kunci atau filter lain." : "Belum ada item live."}</h2>
      <p>{hasProducts ? "Tidak ada item yang cocok dengan pencarian atau filter yang dipilih." : "Item akan tampil setelah tersedia di katalog."}</p>
      {canReset && (
        <button type="button" className={styles.resetButton} onClick={onReset}>
          Reset filter
        </button>
      )}
    </div>
  );
}

function ServiceUnavailable({ onRetry }) {
  return (
    <div className={styles.serviceMessage} role="alert">
      <p className={styles.eyebrow}>Koleksi live</p>
      <h2>Koleksi sedang tidak dapat dimuat.</h2>
      <p>Coba lagi sebentar untuk melihat katalog terbaru.</p>
      <button type="button" className={styles.resetButton} onClick={onRetry}>
        Coba lagi
      </button>
    </div>
  );
}

function replaceCatalogSearchParams(searchParams) {
  const nextUrl = new URL(window.location.href);
  nextUrl.search = searchParams.toString();
  window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

export default function CatalogClient({ products = [], catalogState = "ready" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();

  const categories = useMemo(
    () => ["Semua", ...new Set(products.map((item) => item.category))],
    [products],
  );
  const urlState = useMemo(
    () => parseCatalogSearchParams(new URLSearchParams(searchParamString), categories),
    [categories, searchParamString],
  );
  const { query, category, status, sort } = urlState;

  useEffect(() => {
    if (catalogState === "error") return;

    const canonicalParams = buildCatalogSearchParams(urlState, categories);

    if (canonicalParams.toString() !== searchParamString) {
      replaceCatalogSearchParams(canonicalParams);
    }
  }, [catalogState, categories, searchParamString, urlState]);

  function updateCatalogState(patch) {
    const nextState = { ...urlState, ...patch };
    const nextParams = buildCatalogSearchParams(nextState, categories);
    replaceCatalogSearchParams(nextParams);
  }

  const visibleProducts = useMemo(
    () => filterAndSortProducts(products, { query, category, status, sort }),
    [category, products, query, sort, status],
  );
  const hasFilters = hasActiveCatalogFilters({ query, category, status, sort });
  const hasProducts = products.length > 0;
  const canResetFilters = canResetCatalogFilters({ hasProducts, hasFilters });

  function resetFilters() {
    updateCatalogState(defaultCatalogState);
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
            <Link href="/dashboard">Dashboard</Link>
          </nav>
          <details className={styles.mobileMenu}>
            <summary>Menu <span aria-hidden="true">+</span></summary>
            <nav aria-label="Navigasi seluler">
              <Link href="/">Beranda <span aria-hidden="true">↗</span></Link>
              <Link href="/catalog" aria-current="page">Koleksi <span aria-hidden="true">↗</span></Link>
              <Link href="/dashboard">Dashboard <span aria-hidden="true">↗</span></Link>
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
                Jelajahi kostum dan aksesori live, cek harga sewa per hari, lalu buka detail item yang paling cocok.
              </p>
            </div>
            <p className={styles.introNote}>
              <strong>{catalogState === "error" ? "Koleksi live" : `${products.length} item`}</strong>
              <span>{catalogState === "error" ? "Data katalog sedang tidak tersedia." : "Harga ditampilkan per hari. Ketersediaan aktual diperiksa saat pengajuan."}</span>
            </p>
          </div>
        </section>

        <section className={styles.catalogBody} aria-labelledby="discovery-title">
          <h2 id="discovery-title" className={styles.visuallyHidden}>Cari dan saring koleksi</h2>
          {catalogState === "error" ? <ServiceUnavailable onRetry={() => router.refresh()} /> : (
            <>
              <div className={styles.controls}>
                <label className={styles.searchField}>
                  <span>Cari produk</span>
                  <span className={styles.inputShell}>
                    <span className={styles.searchIcon} aria-hidden="true">⌕</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => updateCatalogState({ query: event.target.value })}
                      placeholder="Nama kostum atau aksesori"
                      aria-label="Cari berdasarkan nama produk"
                    />
                  </span>
                </label>
                <label className={styles.selectField}>
                  <span>Ketersediaan</span>
                  <select value={status} onChange={(event) => updateCatalogState({ status: event.target.value })}>
                    {statusOptions.map(([label, value]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <label className={styles.selectField}>
                  <span>Urutkan</span>
                  <select value={sort} onChange={(event) => updateCatalogState({ sort: event.target.value })}>
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
                    onClick={() => updateCatalogState({ category: item })}
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
                {canResetFilters && visibleProducts.length > 0 && (
                  <button type="button" onClick={resetFilters}>Reset filter</button>
                )}
              </div>

              {visibleProducts.length > 0 ? (
                <ul className={styles.productGrid} aria-label="Daftar produk cosplay">
                  {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </ul>
              ) : (
                <EmptyState
                  hasProducts={hasProducts}
                  canReset={canResetFilters}
                  onReset={resetFilters}
                />
              )}
            </>
          )}
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
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <p className={styles.copyright}>© 2026 Cosplay Asik</p>
      </footer>
    </div>
  );
}

