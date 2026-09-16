"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { products } from "./data/products";
import styles from "./page.module.css";

const featured = products[0];
const categories = ["Semua", ...new Set(products.map((item) => item.category))];
const journey = [
  ["Pilih", "Temukan kostum atau aksesori yang ingin kamu pakai."],
  ["Atur tanggal", "Masuk ke akun, tentukan periode sewa dan jumlah item."],
  ["Ajukan", "Kirim pengajuan. Tunggu persetujuan pemilik toko."],
  ["Pakai", "Jadi karakter pilihanmu selama periode rental yang disetujui."],
  ["Kembalikan", "Kembalikan item setelah periode rental selesai."],
];
const navigation = [["#katalog", "Koleksi"], ["#cara-kerja", "Cara rental"], ["#harga", "Harga"]];

function Brand() {
  return <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">cosplay<span>asik.</span></Link>;
}

// Replace only this specimen with a real portrait image; retain the adjacent caption.
function Specimen({ item }) {
  return (
    <div className={styles.specimen} aria-hidden="true">
      <span className={styles.specimenIndex}>{String(item.id).padStart(2, "0")}</span>
      <span className={styles.specimenName}>{item.name}</span>
      <span className={styles.photoNote}>Foto menyusul</span>
    </div>
  );
}

export default function LandingPage() {
  const [category, setCategory] = useState("Semua");
  const menu = useRef(null);
  const visibleProducts = products.filter((item) => category === "Semua" || item.category === category);

  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }

  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skipLink}>Lewati navigasi</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Brand />
          <nav className={styles.desktopNav} aria-label="Navigasi utama">
            {navigation.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
          </nav>
          <Link href="/dashboard" className={styles.accountLink}>Lihat dashboard <span>demo</span></Link>
          <details ref={menu} className={styles.mobileMenu} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
          }} onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeMenu();
              menu.current?.querySelector("summary")?.focus();
            }
          }}>
            <summary>Menu <span aria-hidden="true">+</span></summary>
            <nav aria-label="Navigasi seluler" onClick={closeMenu}>
              {navigation.map(([href, label]) => <a href={href} key={href}>{label}<span aria-hidden="true">↗</span></a>)}
              <Link href="/dashboard">Lihat dashboard demo <span aria-hidden="true">↗</span></Link>
            </nav>
          </details>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div>
            <p className={styles.eyebrow}>Ruang ganti karakter</p>
            <h1 id="hero-title">Karakter pilihanmu.<br /><span>Giliranmu<br className={styles.desktopBreak} /> memakainya.</span></h1>
            <p className={styles.heroDescription}>Sewa kostum &amp; aksesori cosplay per hari.</p>
            <a href="#katalog" className={styles.primaryAction}>Jelajahi kostum <span aria-hidden="true">↗</span></a>
          </div>
          <Link href={`/product/${featured.id}`} className={styles.featured}>
            <div className={styles.featuredMedia}><Specimen item={featured} /></div>
            <div className={styles.featuredCaption}>
              <div><span className={styles.eyebrow}>{featured.category}</span><h2>{featured.name}</h2></div>
              <p><strong>{featured.price}</strong><span> / hari <span aria-hidden="true">↗</span></span></p>
            </div>
          </Link>
          <p className={styles.heroFootnote}><span>Kostum. Kamu. Karaktermu.</span><span>Koleksi contoh · foto menyusul</span></p>
        </section>

        <section id="katalog" tabIndex={-1} className={styles.collection} aria-labelledby="collection-title">
          <div className={styles.collectionHeading}>
            <h2 id="collection-title">Mau jadi siapa?</h2>
            <p>Pilih dunianya. Temukan kostumnya.</p>
          </div>
          <div className={styles.categoryIndex} role="group" aria-label="Pilih kategori koleksi">
            {categories.map((name) => (
              <button key={name} type="button" aria-pressed={category === name} aria-controls="collection-products" onClick={() => setCategory(name)}>
                {name}<span>{String(name === "Semua" ? products.length : products.filter((item) => item.category === name).length).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <p className={styles.collectionStatus} role="status" aria-live="polite" aria-atomic="true">{category === "Semua" ? "Seluruh koleksi" : category} <span aria-hidden="true">/</span> {visibleProducts.length} item contoh</p>
          <ul className={styles.productRack} id="collection-products">
            {visibleProducts.map((item) => (
              <li key={item.id}>
                <Link href={`/product/${item.id}`} className={styles.product}>
                  <Specimen item={item} />
                  <div className={styles.productCaption}>
                    <h3>{item.name}<span className={styles.productArrow} aria-hidden="true">↗</span></h3>
                    <p className={styles.productCategory}>{item.category}</p>
                    <p className={styles.price}><strong>{item.price}</strong><span> / hari</span></p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.collectionNote}>Koleksi ini menggunakan data contoh. Buka item untuk melihat detail dan mencoba estimasi rental.</p>
        </section>

        <section id="cara-kerja" tabIndex={-1} className={styles.journey} aria-labelledby="journey-title">
          <div className={styles.journeyIntro}><p className={styles.eyebrow}>Dari pilihan jadi penampilan</p><h2 id="journey-title">Pinjam. Pakai.<br />Jadi karaktermu.</h2><p>Rental membutuhkan akun dan persetujuan pemilik toko.</p></div>
          <ol className={styles.journeyList}>{journey.map(([title, description], index) => <li key={title}><span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
        </section>

        <section id="harga" tabIndex={-1} className={styles.pricing} aria-labelledby="price-title">
          <div><p className={styles.eyebrow}>Sesuai lama kamu memakainya</p><h2 id="price-title">Sewa per hari.<br />Hitung sebelum pilih tanggal.</h2><p>Harga per hari × hari sewa × jumlah item. Tanggal mulai dan selesai ikut dihitung; tanggal yang sama berarti satu hari.</p><a href={`/product/${featured.id}#calculator-title`} className={styles.textLink}>Coba estimasi {featured.name} <span aria-hidden="true">↗</span></a></div>
          <div className={styles.estimate}>
            <p className={styles.estimateLabel}>Contoh estimasi <span>01</span></p>
            <h3>{featured.name}</h3>
            <p>{featured.price} / hari <span aria-hidden="true">×</span> 3 hari <span aria-hidden="true">×</span> 1 item</p>
            <div className={styles.estimateTotal}><span>Estimasi biaya</span><strong>Rp{new Intl.NumberFormat("id-ID").format(Number(featured.price.replace(/\D/g, "")) * 3)}</strong></div>
            <p className={styles.estimateNote}>Simulasi biaya, bukan konfirmasi rental. Ketersediaan aktual diperiksa saat pengajuan.</p>
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title"><h2 id="closing-title">Sudah tahu<br />ingin jadi siapa?</h2><a href="#katalog" className={styles.primaryAction}>Temukan kostummu <span aria-hidden="true">↗</span></a></section>
      </main>

      <footer className={styles.footer}><div><Brand /><p>Sewa kostum &amp; aksesori cosplay per hari.</p></div><nav aria-label="Navigasi footer">{navigation.map(([href, label]) => <a href={href} key={href}>{label}</a>)}<Link href="/dashboard">Lihat dashboard demo</Link></nav><p className={styles.copyright}>© 2026 Cosplay Asik</p></footer>
    </div>
  );
}
