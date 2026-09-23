import Link from "next/link";
import { notFound } from "next/navigation";

import { getCatalogItem } from "../../../lib/catalog.js";
import { formatRupiah } from "../../../lib/format-currency.mjs";
import CatalogImage from "../../CatalogImage";
import RentalCalculator from "./RentalCalculator";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function isValidProductId(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return false;
  }

  return Number.isSafeInteger(Number(value));
}

async function loadCatalogProduct(id) {
  if (!isValidProductId(id)) {
    return { state: "missing" };
  }

  try {
    return { state: "ready", product: await getCatalogItem(id) };
  } catch (error) {
    if (error?.status === 404) {
      return { state: "missing" };
    }

    return { state: "unavailable" };
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = await loadCatalogProduct(id);

  if (result.state !== "ready") {
    return {
      title: "Produk tidak tersedia | Cosplay Asik",
      description: "Produk yang diminta tidak tersedia saat ini.",
    };
  }

  return {
    title: `${result.product.name} | Cosplay Asik`,
    description: `${result.product.category} · ${formatRupiah(result.product.pricePerDay)} / hari`,
  };
}

function ProductChrome({ children }) {
  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skipLink}>Lewati navigasi</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">
            cosplay<span>asik.</span>
          </Link>
          <Link href="/catalog" className={styles.backLink}>
            <span aria-hidden="true">←</span>
            <span>Kembali ke koleksi</span>
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <div className={styles.detailInner}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.detailInner}>
          <div>
            <Link href="/" className={styles.footerBrand} aria-label="Cosplay Asik beranda">
              cosplay<span>asik.</span>
            </Link>
            <p>Rental kostum &amp; aksesori cosplay per hari.</p>
          </div>
          <Link href="/catalog">Kembali ke koleksi ↗</Link>
        </div>
      </footer>
    </div>
  );
}

function ProductUnavailable() {
  return (
    <ProductChrome>
      <section className={styles.productUnavailable} aria-labelledby="product-unavailable-title">
        <p className={styles.sectionLabel}>Koleksi live</p>
        <h1 id="product-unavailable-title">Produk sedang tidak dapat dimuat.</h1>
        <p>
          Coba lagi sebentar atau kembali ke koleksi untuk memilih item lain.
        </p>
        <Link href="/catalog" className={styles.textLink}>Kembali ke koleksi <span aria-hidden="true">↗</span></Link>
      </section>
    </ProductChrome>
  );
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const result = await loadCatalogProduct(id);

  if (result.state === "missing") {
    notFound();
  }

  if (result.state === "unavailable") {
    return <ProductUnavailable />;
  }

  const product = result.product;
  const priceLabel = formatRupiah(product.pricePerDay);
  const isAvailable = product.status === "available";
  const statusLabel = isAvailable ? "Tersedia" : "Tidak tersedia";
  const hasSize = product.size?.trim().length > 0;
  const hasDescription = product.description?.trim().length > 0;

  return (
    <ProductChrome>
      <nav className={styles.breadcrumb} aria-label="Lokasi halaman">
        <Link href="/catalog">Koleksi</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={hasDescription ? styles.productLayout : `${styles.productLayout} ${styles.withoutDescription}`}>
        <section className={styles.productInfo} aria-labelledby="product-title">
          <div className={styles.identityMeta}>
            <p className={styles.sectionLabel}>{product.category}</p>
          </div>
          <h1 id="product-title">{product.name}</h1>

          <dl className={styles.productFacts}>
            <div className={styles.priceFact}>
              <dt>Tarif harian</dt>
              <dd className={styles.priceValue}>
                {priceLabel} <span>/ hari</span>
              </dd>
            </div>
            <div className={styles.availabilityFacts}>
              <dt className={styles.statusTerm}>Status</dt>
              <dd className={`${isAvailable ? styles.statusAvailable : styles.statusUnavailable} ${styles.statusValue}`}>
                <span className={styles.statusDot} aria-hidden="true" />
                {statusLabel}
              </dd>
              <dt className={styles.stockTerm}>Stok</dt>
              <dd className={`${styles.factValue} ${styles.stockValue}`}>{product.stock} item</dd>
            </div>
            {hasSize ? (
              <div className={styles.sizeFact}>
                <dt>Ukuran</dt>
                <dd className={styles.factValue}>{product.size}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className={styles.productMediaColumn}>
          <div className={styles.productMedia} data-category={product.category}>
            <div className={styles.mediaVisual}>
              <CatalogImage
                alt={`Foto produk ${product.name}`}
                className={styles.catalogImage}
                fallbackClassName={styles.mediaNote}
                fallbackLabel="Foto menyusul"
                priority
                sizes="(max-width: 900px) min(100vw - 40px, 600px), 46vw"
                src={product.imageUrl}
              />
            </div>
          </div>
        </div>

        {hasDescription ? (
          <section className={styles.productDescription} aria-labelledby="product-description-title">
            <h2 id="product-description-title">Deskripsi</h2>
            <p>{product.description}</p>
          </section>
        ) : null}

        <RentalCalculator
          itemId={product.id}
          priceLabel={priceLabel}
          pricePerDay={product.pricePerDay}
        />

        <aside className={styles.accessNote} aria-label="Langkah setelah estimasi">
          <p className={styles.sectionLabel}>Setelah estimasi</p>
          <p>
            Ini simulasi biaya, bukan konfirmasi rental. Pengajuan membutuhkan akses akun pelanggan dan persetujuan pemilik toko.
          </p>
        </aside>
      </div>
    </ProductChrome>
  );
}
