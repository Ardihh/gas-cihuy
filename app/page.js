import Link from "next/link";

import { getProductStatusLabel, products } from "./data/products";
import styles from "./page.module.css";

const categoryDescriptions = {
  Anime: "Kostum karakter dari dunia anime.",
  Game: "Kostum karakter dari dunia game.",
  Aksesoris: "Pelengkap untuk menyempurnakan penampilan.",
};

const catalogGroups = ["Anime", "Game", "Aksesoris"].map((category, index) => ({
  category,
  description: categoryDescriptions[category],
  index: String(index + 1).padStart(2, "0"),
  items: products.filter((item) => item.category === category),
  slug: category.toLowerCase(),
}));

const heroItems = [products[0], products[3], products[4]];

const steps = [
  {
    number: "01",
    title: "Pilih kostum",
    description: "Buka koleksi dan pilih item yang ingin kamu pinjam.",
  },
  {
    number: "02",
    title: "Masuk ke akun",
    description: "Rental membutuhkan akun pelanggan untuk dilanjutkan.",
  },
  {
    number: "03",
    title: "Tentukan periode rental",
    description: "Atur tanggal mulai, tanggal selesai, dan jumlah item.",
  },
  {
    number: "04",
    title: "Ajukan dan tunggu persetujuan",
    description: "Pemilik toko meninjau pengajuan sebelum rental berjalan.",
  },
];

function StatusLine({ item }) {
  const isLimited = item.status === "limited";

  return (
    <span className={isLimited ? styles.statusLimited : styles.statusAvailable}>
      {getProductStatusLabel(item)}
    </span>
  );
}

function MediaSlot({ item, variant }) {
  const variantClass = variant === "heroLarge"
    ? styles.mediaSlotHeroLarge
    : variant === "heroSmall"
      ? styles.mediaSlotHeroSmall
      : styles.mediaSlotCatalog;

  return (
    <div
      className={`${styles.mediaSlot} ${variantClass}`}
      data-category={item.category}
      aria-hidden="true"
    >
      <span className={styles.mediaSlotNumber}>{String(item.id).padStart(2, "0")}</span>
      <span className={styles.mediaSlotLabel}>Foto menyusul</span>
    </div>
  );
}

function ProductTile({ item }) {
  return (
    <Link href={`/product/${item.id}`} className={styles.productTile}>
      <MediaSlot item={item} variant="catalog" />
      <div className={styles.productTileInfo}>
        <div className={styles.productTileMeta}>
          <span>{item.category}</span>
          <StatusLine item={item} />
        </div>
        <h4>{item.name}</h4>
        <p className={styles.productTilePrice}>
          <strong>{item.price}</strong>
          <span>/ hari</span>
        </p>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.navbar} aria-label="Navigasi utama">
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo} aria-label="Cosplay Asik beranda">
            <span className={styles.logoMark} aria-hidden="true">
              CA
            </span>
            <span>Cosplay Asik</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#katalog">Koleksi</a>
            <a href="#cara-kerja">Cara Rental</a>
            <a href="#harga">Harga</a>
          </div>

          <Link href="/dashboard" className={styles.accountLink}>
            Masuk <span aria-hidden="true">↗</span>
          </Link>

          <details className={styles.mobileMenu}>
            <summary>Menu</summary>
            <div className={styles.mobileMenuPanel}>
              <a href="#katalog">Koleksi</a>
              <a href="#cara-kerja">Cara Rental</a>
              <a href="#harga">Harga</a>
              <Link href="/dashboard">Masuk</Link>
            </div>
          </details>
        </div>
      </nav>

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={`${styles.sectionInner} ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}>
                <span>Cosplay Asik</span>
                <span aria-hidden="true">/</span>
                <span>Rental kostum &amp; aksesori</span>
              </p>
              <h1 id="hero-title">
                Jadi karakter <span>favoritmu.</span>
              </h1>
              <p className={styles.heroDescription}>
                Temukan kostum dan aksesori untuk penampilan berikutnya. Pilih item, cek harga
                per hari, lalu lanjutkan rental setelah masuk ke akun.
              </p>
              <div className={styles.heroActions}>
                <a href="#katalog" className={styles.primaryButton}>
                  Jelajahi koleksi <span aria-hidden="true">↗</span>
                </a>
                <Link href="/dashboard" className={styles.secondaryButton}>
                  Masuk untuk rental <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <p className={styles.heroMeta}>
                Harga per hari <span aria-hidden="true">·</span> Status contoh <span aria-hidden="true">·</span> Foto produk menyusul
              </p>
            </div>

            <aside className={styles.heroShowcase} aria-labelledby="showcase-title">
              <div className={styles.showcaseHeader}>
                <div>
                  <p className={styles.sectionLabel}>Pilihan karakter</p>
                  <h2 id="showcase-title">Mulai dari sini.</h2>
                </div>
                <span>01—03</span>
              </div>
              <div className={styles.heroProductGrid}>
                {heroItems.map((item, index) => (
                  <Link
                    href={`/product/${item.id}`}
                    className={`${styles.heroProduct} ${index === 0 ? styles.heroProductMain : ""}`}
                    key={item.id}
                  >
                    <MediaSlot item={item} variant={index === 0 ? "heroLarge" : "heroSmall"} />
                    <div className={styles.heroProductInfo}>
                      <span>{item.category}</span>
                      <h3>{item.name}</h3>
                      <p>{item.price} / hari</p>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="katalog" className={`${styles.section} ${styles.catalogSection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionLabel}>Koleksi</p>
                <h2>Kostum untuk karakter favoritmu.</h2>
              </div>
              <p>
                Jelajahi kostum dan aksesori dari koleksi contoh Cosplay Asik. Setiap item
                menampilkan harga sewa per hari dan status contoh.
              </p>
            </div>

            <div className={styles.catalogGroups}>
              {catalogGroups.map((group) => (
                <section
                  id={`kategori-${group.slug}`}
                  className={styles.categoryGroup}
                  key={group.category}
                  aria-labelledby={`category-${group.slug}`}
                >
                  <div className={styles.categoryGroupHeader}>
                    <div>
                      <p>{group.index}</p>
                      <h3 id={`category-${group.slug}`}>{group.category}</h3>
                    </div>
                    <span>{group.description}</span>
                  </div>
                  <div className={styles.productGrid}>
                    {group.items.map((item) => (
                      <ProductTile item={item} key={item.id} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <p className={styles.collectionNote}>
              Foto produk menyusul. Placeholder ini akan digantikan media koleksi saat aset
              tersedia.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.categorySection}`} aria-labelledby="category-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionLabel}>Dunia karakter</p>
                <h2 id="category-title">Mulai dari dunianya.</h2>
              </div>
              <p>
                Pilih kategori untuk langsung menuju bagian koleksi yang paling dekat dengan
                karakter yang kamu cari.
              </p>
            </div>

            <div className={styles.categoryTiles}>
              {catalogGroups.map((group) => (
                <Link
                  href={`#kategori-${group.slug}`}
                  className={styles.categoryTile}
                  key={group.category}
                >
                  <div className={styles.categoryTileVisual} data-category={group.category}>
                    <span>{group.index}</span>
                    <strong>{group.items[0].name}</strong>
                    {group.items[1] ? <small>{group.items[1].name}</small> : null}
                  </div>
                  <div className={styles.categoryTileInfo}>
                    <h3>{group.category}</h3>
                    <p>{group.description}</p>
                    <span>Lihat koleksi <span aria-hidden="true">↗</span></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className={`${styles.section} ${styles.processSection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionLabel}>Cara rental</p>
                <h2>Jelas dari pilih sampai disetujui.</h2>
              </div>
              <p>
                Landing ini membantu kamu menemukan item. Proses rental dilanjutkan setelah
                masuk ke akun pelanggan.
              </p>
            </div>

            <ol className={styles.processFlow}>
              {steps.map((step) => (
                <li key={step.number}>
                  <span className={styles.processNumber}>{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="harga" className={`${styles.section} ${styles.pricingSection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionLabel}>Harga</p>
                <h2>Jelas sejak awal.</h2>
              </div>
              <p>Harga item ditampilkan per hari dan menjadi dasar estimasi rental.</p>
            </div>

            <div className={styles.pricingLayout}>
              <div className={styles.pricingFormula}>
                <span>Rumus rental</span>
                <p>
                  Harga per hari <b aria-hidden="true">×</b> durasi <b aria-hidden="true">×</b> jumlah
                </p>
              </div>
              <div className={styles.pricingExample}>
                <div className={styles.exampleHeader}>
                  <span>Contoh estimasi</span>
                  <span>1 item · 3 hari</span>
                </div>
                <dl>
                  <div>
                    <dt>Costume Gojo Satoru</dt>
                    <dd>Rp100.000 / hari</dd>
                  </div>
                  <div>
                    <dt>Jumlah</dt>
                    <dd>1 item</dd>
                  </div>
                  <div>
                    <dt>Durasi</dt>
                    <dd>3 hari</dd>
                  </div>
                  <div className={styles.exampleTotal}>
                    <dt>Estimasi biaya</dt>
                    <dd>Rp300.000</dd>
                  </div>
                </dl>
                <p>Contoh perhitungan, bukan harga final atau konfirmasi rental.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.closingCta} aria-labelledby="closing-title">
          <div className={`${styles.sectionInner} ${styles.closingInner}`}>
            <div>
              <p className={styles.sectionLabel}>Langkah berikutnya</p>
              <h2 id="closing-title">Sudah tahu ingin jadi siapa?</h2>
            </div>
            <Link href="/dashboard" className={styles.primaryButton}>
              Masuk untuk mulai rental <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.sectionInner}>
          <div className={styles.footerTop}>
            <div>
              <Link href="/" className={styles.logo} aria-label="Cosplay Asik beranda">
                <span className={styles.logoMark} aria-hidden="true">
                  CA
                </span>
                <span>Cosplay Asik</span>
              </Link>
              <p className={styles.footerTagline}>
                Rental kostum dan aksesori cosplay.
              </p>
            </div>
            <nav className={styles.footerNav} aria-label="Navigasi footer">
              <a href="#katalog">Koleksi</a>
              <a href="#cara-kerja">Cara Rental</a>
              <a href="#harga">Harga</a>
              <Link href="/dashboard">Masuk</Link>
            </nav>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 Cosplay Asik</span>
            <span>Rental kostum &amp; aksesori cosplay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
