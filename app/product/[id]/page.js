import Link from "next/link";
import { notFound } from "next/navigation";

import { getCatalogItem } from "../../../lib/catalog.js";
import { formatRupiah } from "../../../lib/format-currency.mjs";
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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">
            cosplay<span>asik.</span>
          </Link>
          <Link href="/#katalog" className={styles.backLink}>
            <span aria-hidden="true">←</span>
            <span>Kembali ke koleksi</span>
          </Link>
        </div>
      </header>

      <main>
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
          <Link href="/#katalog">Kembali ke koleksi ↗</Link>
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
        <Link href="/#katalog" className={styles.textLink}>Kembali ke koleksi <span aria-hidden="true">↗</span></Link>
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
  const productIndex = String(product.id).padStart(2, "0");
  const isAvailable = product.status === "available";
  const statusLabel = isAvailable ? "Tersedia" : "Tidak tersedia";

  return (
    <ProductChrome>
      <nav className={styles.breadcrumb} aria-label="Lokasi halaman">
        <Link href="/#katalog">Koleksi</Link>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.productLayout}>
        <section className={styles.productInfo} aria-labelledby="product-title">
          <div className={styles.identityMeta}>
            <p className={styles.sectionLabel}>{product.category}</p>
            <span className={styles.productCode}>Spesimen {productIndex}</span>
          </div>
          <h1 id="product-title">{product.name}</h1>
          <p className={styles.productLead}>
            Lihat item, tarif harian, dan buat simulasi periode rental sebelum mengajukan.
          </p>

          <dl className={styles.productFacts}>
            <div>
              <dt>Tarif harian</dt>
              <dd className={styles.priceValue}>
                {priceLabel} <span>/ hari</span>
              </dd>
            </div>
            <div>
              <dt>Keterangan</dt>
              <dd className={isAvailable ? styles.statusAvailable : styles.statusUnavailable}>
                <span className={styles.statusDot} aria-hidden="true" />
                {statusLabel}
              </dd>
            </div>
          </dl>
        </section>

        <div className={styles.productMediaColumn}>
          <div className={styles.productMedia} data-category={product.category}>
            <div className={styles.mediaTopline}>
              <span>Ruang ganti / {productIndex}</span>
              <span>{product.category}</span>
            </div>
            <div
              className={styles.mediaVisual}
              role="img"
              aria-label={`Area spesimen untuk ${product.name}; foto produk belum tersedia`}
            >
              <div className={styles.mediaSpecimen}>
                <p className={styles.mediaName}>{product.name}</p>
                <span className={styles.mediaCategory}>{product.category}</span>
              </div>
              <span className={styles.mediaNote}>Foto menyusul</span>
            </div>
            <div className={styles.mediaFooter}>
              <span>Specimen placeholder</span>
              <span>Siap untuk foto produk</span>
            </div>
          </div>
        </div>

        <RentalCalculator priceLabel={priceLabel} pricePerDay={product.pricePerDay} />

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
