import Link from "next/link";
import styles from "./page.module.css";

import { getProductStatusLabel, products } from "./data/products";

const catalogGroups = ["Anime", "Game", "Aksesoris"].map((category) => ({
  category,
  items: products.filter((item) => item.category === category),
}));

const heroItems = [products[0], products[3], products[4]];

const steps = [
  {
    number: "01",
    title: "Jelajahi katalog",
    description: "Temukan kostum dan aksesori cosplay dari koleksi yang tersedia.",
  },
  {
    number: "02",
    title: "Atur detail sewa",
    description: "Tentukan item, jumlah, tanggal mulai, dan tanggal selesai.",
  },
  {
    number: "03",
    title: "Ajukan rental",
    description: "Kirim pengajuan setelah detail dan total harga sudah sesuai.",
  },
  {
    number: "04",
    title: "Tunggu persetujuan",
    description: "Pemilik toko meninjau pengajuan sebelum rental berjalan.",
  },
];

function StatusLabel({ item }) {
  const isLimited = item.status === "limited";

  return (
    <span className={isLimited ? styles.statusLimited : styles.statusAvailable}>
      {getProductStatusLabel(item)}
    </span>
  );
}

function MediaSlot({ item, variant }) {
  return (
    <div
      className={variant === "hero" ? styles.heroMediaSlot : styles.catalogMediaSlot}
      data-category={item.category}
      aria-hidden="true"
    >
      <span className={styles.mediaSlotNumber}>{String(item.id).padStart(2, "0")}</span>
      <span className={styles.mediaSlotLabel}>Foto menyusul</span>
    </div>
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
            <a href="#katalog">Katalog</a>
            <a href="#cara-kerja">Cara sewa</a>
            <a href="#harga">Harga</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/dashboard" className={styles.navTextLink}>
              Dashboard
            </Link>
            <a href="#katalog" className={styles.navCta}>
              Jelajahi katalog
            </a>
          </div>

          <details className={styles.mobileMenu}>
            <summary>Menu</summary>
            <div className={styles.mobileMenuPanel}>
              <a href="#katalog">Katalog</a>
              <a href="#cara-kerja">Cara sewa</a>
              <a href="#harga">Harga</a>
              <Link href="/dashboard">Dashboard</Link>
            </div>
          </details>
        </div>
      </nav>

      <main>
        <section className={styles.hero}>
          <div className={`${styles.sectionInner} ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className={styles.heroKicker}>
                <span aria-hidden="true">CA</span> Rental kostum &amp; aksesori cosplay
              </p>
              <h1>
                Sewa kostum.
                <span className={styles.heroTitleAccent}>Jadi karakter.</span>
              </h1>
              <p className={styles.heroDescription}>
                Pilih karakter anime, game, atau film favoritmu. Cek harga per hari dan
                status item sebelum mengajukan rental.
              </p>
              <div className={styles.heroActions}>
                <a href="#katalog" className={styles.primaryButton}>
                  Jelajahi katalog <span aria-hidden="true">↗</span>
                </a>
                <a href="#cara-kerja" className={styles.heroTextLink}>
                  Lihat alurnya <span aria-hidden="true">→</span>
                </a>
              </div>
              <dl className={styles.heroFacts}>
                <div>
                  <dt>Yang disewa</dt>
                  <dd>Kostum &amp; aksesori</dd>
                </div>
                <div>
                  <dt>Harga mulai</dt>
                  <dd>
                    Rp50.000 <span>/ hari</span>
                  </dd>
                </div>
              </dl>
            </div>

            <aside className={styles.heroInventory} aria-labelledby="hero-inventory-title">
              <div className={styles.inventoryHeading}>
                <div>
                  <p className={styles.sectionLabel}>Contoh rak</p>
                  <h2 id="hero-inventory-title">Item untuk mulai.</h2>
                </div>
                <a href="#katalog" className={styles.inventoryLink}>
                  Lihat katalog <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className={styles.inventoryRows}>
                {heroItems.map((item) => (
                  <Link
                    href={`/product/${item.id}`}
                    className={`${styles.inventoryRow} ${styles.productRowLink}`}
                    key={item.id}
                  >
                    <MediaSlot item={item} variant="hero" />
                    <div className={styles.inventoryIdentity}>
                      <span>{item.category}</span>
                      <h3>{item.name}</h3>
                    </div>
                    <div className={styles.inventoryDetails}>
                      <strong>{item.price}</strong>
                      <span>/ hari</span>
                      <StatusLabel item={item} />
                    </div>
                  </Link>
                ))}
              </div>
              <p className={styles.inventoryNote}>
                Data contoh dari koleksi saat ini. Foto produk menyusul.
              </p>
            </aside>
          </div>
        </section>

        <section id="katalog" className={`${styles.section} ${styles.catalogSection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.catalogIntro}>
              <div>
                <p className={styles.sectionLabel}>01 / Katalog</p>
                <h2>Pilih item untuk penampilan berikutnya.</h2>
              </div>
              <div className={styles.catalogContext}>
                <p>
                  Susunan contoh koleksi berdasarkan karakter, kategori, harga sewa per hari,
                  dan status item.
                </p>
                <a href="#harga" className={styles.inlineLink}>
                  Lihat cara hitung <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>

            <div className={styles.catalogMeta} aria-label="Keterangan katalog">
              <span>Koleksi contoh</span>
              <span>Harga / hari</span>
              <span>Status contoh</span>
            </div>

            <div className={styles.rack}>
              {catalogGroups.map((group) => (
                <div className={styles.rackGroup} key={group.category}>
                  <div className={styles.rackGroupHeader}>
                    <h3>{group.category}</h3>
                    <span>Contoh item</span>
                  </div>
                  <div className={styles.rackRows}>
                    {group.items.map((item) => (
                      <Link
                        href={`/product/${item.id}`}
                        className={`${styles.rackRow} ${styles.productRowLink}`}
                        key={item.id}
                      >
                        <MediaSlot item={item} variant="catalog" />
                        <div className={styles.rackIdentity}>
                          <span>{item.category}</span>
                          <h4>{item.name}</h4>
                        </div>
                        <div className={styles.rackPrice}>
                          <strong>{item.price}</strong>
                          <span>/ hari</span>
                        </div>
                        <div className={styles.rackStatus}>
                          <StatusLabel item={item} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className={styles.implementationNote}>
              Catatan prototipe: foto produk dan pengajuan rental belum terhubung. Status di
              atas adalah contoh dari data yang ada.
            </p>
          </div>
        </section>

        <section id="cara-kerja" className={`${styles.section} ${styles.processSection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.processIntro}>
              <div>
                <p className={styles.sectionLabel}>02 / Cara sewa</p>
                <h2>Alurnya singkat dan jelas.</h2>
              </div>
              <p>
                Pilih item, atur tanggal, lalu tunggu pengajuan ditinjau oleh pemilik toko.
              </p>
            </div>

            <ol className={styles.processList}>
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

            <p className={styles.processNote}>
              Setelah disetujui, rental berjalan sesuai tanggal dan barang dikembalikan setelah
              selesai. Feedback bersifat opsional.
            </p>
          </div>
        </section>

        <section id="harga" className={`${styles.section} ${styles.pricingSection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.pricingIntro}>
              <div>
                <p className={styles.sectionLabel}>03 / Harga</p>
                <h2>Harga per hari.</h2>
              </div>
              <p>Total mengikuti harga item, jumlah hari, dan jumlah barang yang disewa.</p>
            </div>

            <div className={styles.pricingGrid}>
              <div className={styles.pricingFormula}>
                <span className={styles.formulaLabel}>Rumus rental</span>
                <p>Harga / hari × jumlah hari × jumlah barang</p>
                <span className={styles.formulaMinimum}>
                  Item termurah di contoh koleksi: Rp50.000 / hari
                </span>
              </div>
              <div className={styles.pricingExample}>
                <div className={styles.exampleHeader}>
                  <span>Contoh kalkulasi</span>
                  <span>1 item · 3 hari</span>
                </div>
                <dl>
                  <div>
                    <dt>Kostum Gojo</dt>
                    <dd>Rp100.000 / hari</dd>
                  </div>
                  <div>
                    <dt>Jumlah</dt>
                    <dd>1 pcs</dd>
                  </div>
                  <div>
                    <dt>Durasi</dt>
                    <dd>3 hari</dd>
                  </div>
                  <div className={styles.exampleTotal}>
                    <dt>Total</dt>
                    <dd>Rp300.000</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.sectionInner}>
            <div className={styles.finalCtaInner}>
              <div>
                <p className={styles.sectionLabel}>Berikutnya</p>
                <h2>Mulai dari katalog.</h2>
              </div>
              <a href="#katalog" className={styles.primaryButton}>
                Jelajahi katalog <span aria-hidden="true">↗</span>
              </a>
            </div>
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
                Sistem penyewaan kostum dan aksesori cosplay.
              </p>
            </div>
            <nav className={styles.footerNav} aria-label="Navigasi footer">
              <a href="#katalog">Katalog</a>
              <a href="#cara-kerja">Cara sewa</a>
              <a href="#harga">Harga</a>
              <Link href="/dashboard">Dashboard</Link>
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
