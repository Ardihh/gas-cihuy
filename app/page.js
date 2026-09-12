import Link from "next/link";
import styles from "./page.module.css";

const featuredCostumes = [
  {
    id: 1,
    name: "Costume Gojo Satoru",
    category: "Anime",
    price: "Rp100.000",
    status: "available",
  },
  {
    id: 2,
    name: "Costume Mikasa Ackerman",
    category: "Anime",
    price: "Rp120.000",
    status: "available",
  },
  {
    id: 3,
    name: "Costume Cloud Strife",
    category: "Game",
    price: "Rp150.000",
    status: "available",
  },
  {
    id: 4,
    name: "Wig Rem (Blue)",
    category: "Aksesoris",
    price: "Rp60.000",
    status: "limited",
  },
  {
    id: 5,
    name: "Props Nichirin Sword",
    category: "Aksesoris",
    price: "Rp50.000",
    status: "available",
  },
  {
    id: 6,
    name: "Costume Naruto Uzumaki",
    category: "Anime",
    price: "Rp90.000",
    status: "limited",
  },
];

const steps = [
  {
    number: "01",
    title: "Jelajahi katalog",
    description: "Temukan kostum dan aksesori cosplay dari koleksi yang tersedia.",
    cue: "Katalog",
  },
  {
    number: "02",
    title: "Atur detail sewa",
    description: "Tentukan item, jumlah, tanggal mulai, dan tanggal selesai.",
    cue: "Tanggal",
  },
  {
    number: "03",
    title: "Ajukan rental",
    description: "Kirim pengajuan setelah detail dan total harga sudah sesuai.",
    cue: "Pengajuan",
  },
  {
    number: "04",
    title: "Tunggu persetujuan",
    description: "Pemilik toko meninjau pengajuan sebelum rental berjalan.",
    cue: "Approval",
  },
];

const showcaseItems = [featuredCostumes[0], featuredCostumes[3], featuredCostumes[4]];

function PhotoPlaceholder({ item, compact = false }) {
  return (
    <div className={compact ? styles.railPlaceholder : styles.photoPlaceholder} aria-hidden="true">
      <span className={styles.placeholderLabel}>Slot foto</span>
      <span className={styles.placeholderTitle}>{item.name}</span>
      <span className={styles.placeholderNote}>Aset produk belum tersedia</span>
    </div>
  );
}

function ProductCard({ item, index }) {
  const isLimited = item.status === "limited";

  return (
    <article className={styles.productCard}>
      <div className={styles.productMedia}>
        <span className={styles.productIndex}>0{index + 1}</span>
        <span className={isLimited ? styles.statusLimited : styles.statusAvailable}>
          {isLimited ? "Contoh · stok terbatas" : "Contoh · tersedia"}
        </span>
        <PhotoPlaceholder item={item} />
      </div>
      <div className={styles.productInfo}>
        <div className={styles.productKicker}>
          <span>{item.category}</span>
          <span>Per hari</span>
        </div>
        <h3 className={styles.productName}>{item.name}</h3>
        <p className={styles.productPrice}>
          {item.price} <span>/ hari</span>
        </p>
      </div>
    </article>
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
          <div className={`${styles.sectionInner} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Rental kostum &amp; aksesori cosplay</p>
              <h1>
                Sewa kostum.
                <span className={styles.heroTitleAccent}>Jadi karakter.</span>
              </h1>
              <p className={styles.heroDescription}>
                Pilih karakter anime, game, atau film favoritmu. Cek harga per hari dan
                ketersediaan item sebelum mengajukan rental.
              </p>
              <div className={styles.heroActions}>
                <a href="#katalog" className={styles.primaryButton}>
                  Jelajahi katalog <span aria-hidden="true">↗</span>
                </a>
                <a href="#cara-kerja" className={styles.secondaryButton}>
                  Lihat cara sewa
                </a>
              </div>
              <dl className={styles.heroFacts}>
                <div>
                  <dt>Yang bisa disewa</dt>
                  <dd>Kostum &amp; aksesori</dd>
                </div>
                <div>
                  <dt>Harga mulai</dt>
                  <dd>Rp50.000 <span>/ hari</span></dd>
                </div>
              </dl>
            </div>

            <div className={styles.heroShowcase} aria-label="Contoh koleksi">
              <div className={styles.showcaseHeader}>
                <span>Contoh koleksi</span>
                <span>Foto produk menyusul</span>
              </div>
              <div className={styles.showcaseCanvas}>
                <div className={styles.showcaseMain}>
                  <PhotoPlaceholder item={showcaseItems[0]} />
                  <div className={styles.showcaseCaption}>
                    <div>
                      <span className={styles.showcaseCategory}>{showcaseItems[0].category}</span>
                      <p>{showcaseItems[0].name}</p>
                    </div>
                    <strong>{showcaseItems[0].price}<span> / hari</span></strong>
                  </div>
                </div>
                <div className={styles.showcaseRail}>
                  {showcaseItems.slice(1).map((item) => (
                    <div className={styles.railItem} key={item.id}>
                      <PhotoPlaceholder item={item} compact />
                      <div className={styles.railCaption}>
                        <span>{item.category}</span>
                        <strong>{item.price}<small> / hari</small></strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className={styles.showcaseNote}>
                Struktur visual ini siap menerima foto produk saat aset tersedia.
              </p>
            </div>
          </div>
        </section>

        <section id="katalog" className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>01 / Katalog</p>
                <h2>Pilih item untuk penampilan berikutnya.</h2>
              </div>
              <p className={styles.sectionLead}>
                Lihat contoh koleksi, kategori, harga sewa per hari, dan status stok dalam
                satu pandangan.
              </p>
            </div>

            <div className={styles.catalogLegend} aria-label="Keterangan katalog">
              <span><i className={styles.legendDot} /> Contoh koleksi</span>
              <span>Harga / hari</span>
              <span>Status contoh</span>
            </div>

            <div className={styles.productGrid}>
              {featuredCostumes.map((item, index) => (
                <ProductCard item={item} index={index} key={item.id} />
              ))}
            </div>

            <p className={styles.implementationNote}>
              Catatan prototipe: foto produk dan pengajuan rental belum terhubung. Layout
              ini sengaja disiapkan untuk aset dan data asli.
            </p>
          </div>
        </section>

        <section id="cara-kerja" className={`${styles.section} ${styles.processSection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>02 / Cara sewa</p>
                <h2>Alurnya singkat dan jelas.</h2>
              </div>
              <p className={styles.sectionLead}>
                Mulai dari memilih item sampai pengajuan ditinjau oleh pemilik toko.
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
                  <span className={styles.processCue}>{step.cue}</span>
                </li>
              ))}
            </ol>

            <p className={styles.processNote}>
              Setelah disetujui, rental berjalan sesuai tanggal dan barang dikembalikan
              setelah selesai. Feedback bersifat opsional.
            </p>
          </div>
        </section>

        <section id="harga" className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>03 / Harga</p>
                <h2>Hitung dari harga per hari.</h2>
              </div>
              <p className={styles.sectionLead}>
                Total mengikuti harga item, jumlah hari, dan jumlah barang yang disewa.
              </p>
            </div>

            <div className={styles.pricingGrid}>
              <div className={styles.pricingFormula}>
                <span className={styles.formulaLabel}>Rumus rental</span>
                <p>Harga / hari × jumlah hari × jumlah barang</p>
                <span className={styles.formulaMinimum}>Item termurah di contoh koleksi: Rp50.000 / hari</span>
              </div>
              <div className={styles.pricingExample}>
                <div className={styles.exampleHeader}>
                  <span>Contoh kalkulasi</span>
                  <span>1 item · 3 hari</span>
                </div>
                <dl>
                  <div><dt>Kostum Gojo</dt><dd>Rp100.000 / hari</dd></div>
                  <div><dt>Jumlah</dt><dd>1 pcs</dd></div>
                  <div><dt>Durasi</dt><dd>3 hari</dd></div>
                  <div className={styles.exampleTotal}><dt>Total</dt><dd>Rp300.000</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.sectionInner}>
            <div className={styles.finalCtaInner}>
              <div>
                <p className={styles.eyebrow}>Mulai dari sini</p>
                <h2>Pilih karakter yang ingin kamu bawa ke dunia nyata.</h2>
              </div>
              <div className={styles.finalCtaActions}>
                <a href="#katalog" className={styles.primaryButton}>
                  Jelajahi katalog <span aria-hidden="true">↗</span>
                </a>
                <Link href="/dashboard" className={styles.secondaryButton}>
                  Buka dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.sectionInner}>
          <div className={styles.footerTop}>
            <div>
              <Link href="/" className={styles.logo} aria-label="Cosplay Asik beranda">
                <span className={styles.logoMark} aria-hidden="true">CA</span>
                <span>Cosplay Asik</span>
              </Link>
              <p className={styles.footerTagline}>Sistem penyewaan kostum dan aksesori cosplay.</p>
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
