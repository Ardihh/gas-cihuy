import styles from "./page.module.css";

/* ───── static data ───── */
const featuredCostumes = [
  {
    id: 1,
    name: "Costume Gojo Satoru",
    category: "Anime",
    price: "Rp100.000",
    priceNote: "/ hari",
    status: "available",
    image: "🧿",
  },
  {
    id: 2,
    name: "Costume Mikasa Ackerman",
    category: "Anime",
    price: "Rp120.000",
    priceNote: "/ hari",
    status: "available",
    image: "⚔️",
  },
  {
    id: 3,
    name: "Costume Cloud Strife",
    category: "Game",
    price: "Rp150.000",
    priceNote: "/ hari",
    status: "available",
    image: "🗡️",
  },
  {
    id: 4,
    name: "Wig Rem (Blue)",
    category: "Aksesoris",
    price: "Rp60.000",
    priceNote: "/ hari",
    status: "limited",
    image: "💇",
  },
  {
    id: 5,
    name: "Props Nichirin Sword",
    category: "Aksesoris",
    price: "Rp50.000",
    priceNote: "/ hari",
    status: "available",
    image: "🔥",
  },
  {
    id: 6,
    name: "Costume Naruto Uzumaki",
    category: "Anime",
    price: "Rp90.000",
    priceNote: "/ hari",
    status: "limited",
    image: "🍥",
  },
];

const categories = [
  { name: "Anime", icon: "🎌", count: 24 },
  { name: "Game", icon: "🎮", count: 12 },
  { name: "Film", icon: "🎬", count: 8 },
  { name: "Character", icon: "👤", count: 6 },
  { name: "Wig", icon: "💇", count: 15 },
  { name: "Props", icon: "⚔️", count: 10 },
  { name: "Sepatu", icon: "👢", count: 8 },
  { name: "Senjata Cosplay", icon: "🗡️", count: 7 },
];

const steps = [
  {
    number: "01",
    title: "Jelajahi Katalog",
    desc: "Temukan kostum dan aksesoris cosplay favoritmu dari koleksi kami yang lengkap.",
    icon: "🔍",
  },
  {
    number: "02",
    title: "Pilih & Pesan",
    desc: "Tentukan tanggal sewa, jumlah, dan ajukan penyewaan dengan mudah.",
    icon: "📝",
  },
  {
    number: "03",
    title: "Tunggu Approval",
    desc: "Pemilik toko akan me-review dan menyetujui pengajuan rental kamu.",
    icon: "✅",
  },
  {
    number: "04",
    title: "Cosplay & Return",
    desc: "Tampil maksimal! Kembalikan setelah selesai dan berikan feedback.",
    icon: "🎭",
  },
];

const testimonials = [
  {
    id: 1,
    name: "AniKun",
    message:
      "Costume-nya masih bagus dan proses rental juga cukup mudah. Terima kasih!",
    costume: "Costume Gojo Satoru",
  },
  {
    id: 2,
    name: "CosplayQueen",
    message:
      "Wig-nya super halus, warnanya sesuai foto. Pasti sewa lagi!",
    costume: "Wig Rem (Blue)",
  },
  {
    id: 3,
    name: "DemonSlayerFan",
    message:
      "Props-nya detail banget, semua teman cosplay saya kagum. Recommended!",
    costume: "Props Nichirin Sword",
  },
];

const stats = [
  { value: "500+", label: "Kostum & Aksesoris" },
  { value: "1.200+", label: "Rental Selesai" },
  { value: "98%", label: "Pelanggan Puas" },
  { value: "24jam", label: "Proses Approval" },
];

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ═══ NAVIGATION ═══ */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎭</span>
            <span className={styles.logoText}>COSPLAY ASIK</span>
          </a>

          <div className={styles.navLinks}>
            <a href="#katalog" className={styles.navLink}>
              Katalog
            </a>
            <a href="#cara-kerja" className={styles.navLink}>
              Cara Kerja
            </a>
            <a href="#kategori" className={styles.navLink}>
              Kategori
            </a>
            <a href="#testimoni" className={styles.navLink}>
              Testimoni
            </a>
          </div>

          <div className={styles.navActions}>
            <a href="#" className={styles.btnGhost}>
              Masuk
            </a>
            <a href="#" className={styles.btnPrimary}>
              Daftar Sekarang
              <span className={styles.btnArrow}>→</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>◂ RENTAL COSPLAY TERPERCAYA ▸</p>
          <h1 className={styles.heroTitle}>
            SEWA KOSTUM
            <br />
            <span className={styles.heroTitleAccent}>(JADI KARAKTER)</span>
          </h1>
          <p className={styles.heroDesc}>
            Wujudkan karakter anime, game, dan film favoritmu. Koleksi lengkap,
            harga terjangkau, proses mudah.
          </p>
          <div className={styles.heroCtas}>
            <a href="#katalog" className={styles.btnPrimary}>
              Jelajahi Katalog
              <span className={styles.btnArrow}>→</span>
            </a>
            <a href="#cara-kerja" className={styles.btnGhost}>
              <span className={styles.btnPinIcon}>▶</span>
              Cara Kerja
            </a>
          </div>
        </div>

        {/* Hero stats strip */}
        <div className={styles.heroStats}>
          {stats.map((s, i) => (
            <div key={i} className={styles.heroStatItem}>
              <span className={styles.heroStatValue}>{s.value}</span>
              <span className={styles.heroStatLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURED CATALOG ═══ */}
      <section id="katalog" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>◂ KOLEKSI TERBAIK ▸</p>
            <h2 className={styles.sectionTitle}>KOSTUM POPULER</h2>
            <p className={styles.sectionDesc}>
              Pilihan kostum dan aksesoris paling diminati oleh para cosplayer
            </p>
          </div>

          {/* Filter pills */}
          <div className={styles.filterPills}>
            <button className={`${styles.pill} ${styles.pillActive}`}>
              Semua
            </button>
            <button className={styles.pill}>Kostum</button>
            <button className={styles.pill}>Aksesoris</button>
            <button className={styles.pill}>Wig</button>
            <button className={styles.pill}>Props</button>
          </div>

          {/* Product grid */}
          <div className={styles.productGrid}>
            {featuredCostumes.map((item) => (
              <div key={item.id} className={styles.productCard}>
                <div className={styles.productImgWrap}>
                  <span className={styles.productEmoji}>{item.image}</span>
                  {item.status === "limited" && (
                    <span className={styles.productBadgeLimited}>
                      Stok Terbatas
                    </span>
                  )}
                  <span className={styles.productCategory}>{item.category}</span>
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{item.name}</h3>
                  <div className={styles.productPriceRow}>
                    <span className={styles.productPrice}>{item.price}</span>
                    <span className={styles.productPriceNote}>
                      {item.priceNote}
                    </span>
                  </div>
                  <div className={styles.productActions}>
                    <a href="#" className={styles.btnCardPrimary}>
                      Sewa Sekarang
                    </a>
                    <a href="#" className={styles.btnCardGhost}>
                      Detail
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.sectionCta}>
            <a href="#" className={styles.btnPrimary}>
              Lihat Semua Koleksi
              <span className={styles.btnArrow}>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="cara-kerja" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>◂ MUDAH & CEPAT ▸</p>
            <h2 className={styles.sectionTitle}>CARA KERJA</h2>
            <p className={styles.sectionDesc}>
              Empat langkah mudah untuk tampil sebagai karakter favoritmu
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {steps.map((step, i) => (
              <div key={i} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <span className={styles.stepIcon}>{step.icon}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className={styles.stepConnector}>
                    <span>→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section id="kategori" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>◂ JELAJAHI ▸</p>
            <h2 className={styles.sectionTitle}>KATEGORI</h2>
            <p className={styles.sectionDesc}>
              Temukan perlengkapan cosplay berdasarkan kategori
            </p>
          </div>

          <div className={styles.categoriesGrid}>
            {categories.map((cat, i) => (
              <a key={i} href="#" className={styles.categoryCard}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryCount}>{cat.count} item</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING HIGHLIGHT ═══ */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.pricingBanner}>
            <div className={styles.pricingLeft}>
              <p className={styles.eyebrow}>◂ HARGA TRANSPARAN ▸</p>
              <h2 className={styles.pricingTitle}>
                MULAI DARI
                <br />
                <span className={styles.pricingAmount}>RP50.000</span>
                <span className={styles.pricingUnit}>/ HARI</span>
              </h2>
              <p className={styles.pricingDesc}>
                Harga sewa dihitung per hari. Semakin lama sewa, semakin hemat.
                Tidak ada biaya tersembunyi.
              </p>
              <div className={styles.pricingFormula}>
                <code>Total = Harga/Hari × Jumlah Hari × Jumlah Barang</code>
              </div>
            </div>
            <div className={styles.pricingRight}>
              <div className={styles.pricingExample}>
                <p className={styles.pricingExTitle}>Contoh Kalkulasi</p>
                <div className={styles.pricingExRow}>
                  <span>Kostum Gojo</span>
                  <span>Rp100.000/hari</span>
                </div>
                <div className={styles.pricingExRow}>
                  <span>Jumlah</span>
                  <span>1 pcs</span>
                </div>
                <div className={styles.pricingExRow}>
                  <span>Durasi</span>
                  <span>3 hari</span>
                </div>
                <div className={`${styles.pricingExRow} ${styles.pricingExTotal}`}>
                  <span>Total</span>
                  <span>Rp300.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimoni" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>◂ KATA MEREKA ▸</p>
            <h2 className={styles.sectionTitle}>TESTIMONI</h2>
            <p className={styles.sectionDesc}>
              Cerita dari pelanggan yang sudah menggunakan layanan kami
            </p>
          </div>

          <div className={styles.testimonialGrid}>
            {testimonials.map((t) => (
              <div key={t.id} className={styles.testimonialCard}>
                <div className={styles.testimonialQuote}>"</div>
                <p className={styles.testimonialMsg}>{t.message}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className={styles.testimonialName}>{t.name}</p>
                    <p className={styles.testimonialCostume}>
                      Menyewa: {t.costume}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <div className={styles.ctaContent}>
            <p className={styles.eyebrow}>◂ GABUNG SEKARANG ▸</p>
            <h2 className={styles.ctaTitle}>
              SIAP JADI
              <br />
              KARAKTER FAVORITMU?
            </h2>
            <p className={styles.ctaDesc}>
              Daftar sekarang dan mulai jelajahi koleksi kostum cosplay terlengkap.
              Proses mudah, harga terjangkau.
            </p>
            <div className={styles.ctaButtons}>
              <a href="#" className={styles.btnPrimaryLg}>
                Daftar Gratis
                <span className={styles.btnArrow}>→</span>
              </a>
              <a href="#katalog" className={styles.btnGhostLg}>
                Lihat Katalog
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span>🎭</span>
              <span className={styles.footerLogoText}>COSPLAY ASIK</span>
            </div>
            <p className={styles.footerTagline}>
              Sistem penyewaan kostum dan aksesoris cosplay terpercaya.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>LAYANAN</h4>
              <a href="#">Katalog Kostum</a>
              <a href="#">Aksesoris</a>
              <a href="#">Paket Bundling</a>
              <a href="#">Custom Order</a>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>BANTUAN</h4>
              <a href="#">Cara Sewa</a>
              <a href="#">FAQ</a>
              <a href="#">Syarat & Ketentuan</a>
              <a href="#">Kontak Kami</a>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>IKUTI KAMI</h4>
              <a href="#">Instagram</a>
              <a href="#">Twitter / X</a>
              <a href="#">TikTok</a>
              <a href="#">Discord</a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2026 Cosplay Asik. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
