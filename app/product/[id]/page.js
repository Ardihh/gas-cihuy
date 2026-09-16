import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductById, getProductStatusLabel, products } from "../../data/products";
import RentalCalculator from "./RentalCalculator";
import styles from "./page.module.css";

export function generateStaticParams() {
  return products.map(({ id }) => ({ id: String(id) }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return {
      title: "Produk tidak ditemukan | Cosplay Asik",
      description: "Produk yang diminta tidak ditemukan.",
    };
  }

  return {
    title: `${product.name} | Cosplay Asik`,
    description: `${product.category} · ${product.price} / hari`,
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const isLimited = product.status === "limited";
  const pricePerDay = Number(product.price.replace(/\D/g, ""));
  const productIndex = String(product.id).padStart(2, "0");

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
        <div className={styles.detailInner}>
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
                    {product.price} <span>/ hari</span>
                  </dd>
                </div>
                <div>
                  <dt>Keterangan</dt>
                  <dd className={isLimited ? styles.statusLimited : styles.statusAvailable}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {getProductStatusLabel(product)}
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

            <RentalCalculator priceLabel={product.price} pricePerDay={pricePerDay} />

            <aside className={styles.accessNote} aria-label="Langkah setelah estimasi">
              <p className={styles.sectionLabel}>Setelah estimasi</p>
              <p>
                Ini simulasi biaya, bukan konfirmasi rental. Pengajuan membutuhkan akses akun pelanggan dan persetujuan pemilik toko.
              </p>
            </aside>
          </div>
        </div>
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
