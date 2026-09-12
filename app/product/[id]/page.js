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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo} aria-label="Cosplay Asik beranda">
            <span className={styles.logoMark} aria-hidden="true">
              CA
            </span>
            <span>Cosplay Asik</span>
          </Link>
          <Link href="/#katalog" className={styles.backLink}>
            ← Kembali ke katalog
          </Link>
        </div>
      </header>

      <main>
        <div className={styles.detailInner}>
          <nav className={styles.breadcrumb} aria-label="Lokasi halaman">
            <Link href="/#katalog">Katalog</Link>
            <span aria-hidden="true">/</span>
            <span>{product.category}</span>
          </nav>

          <div className={styles.productLayout}>
            <div className={styles.productMediaColumn}>
              <div className={styles.productMedia} data-category={product.category} aria-hidden="true">
                <span className={styles.mediaNumber}>{String(product.id).padStart(2, "0")}</span>
                <span className={styles.mediaLabel}>Foto produk menyusul</span>
              </div>
              <p className={styles.mediaNote}>Foto produk belum tersedia di prototipe ini.</p>
            </div>

            <section className={styles.productInfo} aria-labelledby="product-title">
              <p className={styles.sectionLabel}>{product.category}</p>
              <h1 id="product-title">{product.name}</h1>

              <dl className={styles.productFacts}>
                <div>
                  <dt>Harga sewa</dt>
                  <dd className={styles.priceValue}>
                    {product.price} <span>/ hari</span>
                  </dd>
                </div>
                <div>
                  <dt>Status contoh</dt>
                  <dd className={isLimited ? styles.statusLimited : styles.statusAvailable}>
                    {getProductStatusLabel(product)}
                  </dd>
                </div>
              </dl>

              <p className={styles.prototypeNote}>
                Pengajuan rental belum terhubung dalam prototipe ini.
              </p>
            </section>
          </div>

          <RentalCalculator priceLabel={product.price} pricePerDay={pricePerDay} />
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.detailInner}>
          <span>Rental kostum &amp; aksesori cosplay</span>
          <Link href="/#katalog">Kembali ke katalog ↗</Link>
        </div>
      </footer>
    </div>
  );
}
