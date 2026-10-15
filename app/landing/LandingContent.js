import Link from "next/link";

import { formatRupiah } from "../../lib/format-currency.mjs";
import CollectionPreview from "./CollectionPreview";
import ProductVisual from "./ProductVisual";
import RentalEstimate from "./RentalEstimate";
import { getLandingFeature } from "./landing-presentation.mjs";
import styles from "../page.module.css";

const journey = [
  ["Temukan karaktermu", "Jelajahi kostum dan aksesori. Buka detail untuk melihat ukuran, deskripsi, dan harga per hari."],
  ["Tentukan tanggal", "Masuk ke akun, pilih periode rental dan jumlah item. Cek estimasi sebelum mengajukan."],
  ["Ajukan rental", "Kirim pengajuan dan tunggu persetujuan pemilik toko. Pantau statusnya di dashboard."],
  ["Pakai. Jadi karaktermu.", "Nikmati kostum selama periode rental yang disetujui."],
  ["Kembalikan & ceritakan", "Kembalikan item setelah rental selesai. Bagikan pengalamanmu setelah status rental dikembalikan."],
];

const questions = [
  ["Perlu akun untuk mulai?", "Preview koleksi dan detail item bisa dilihat tanpa akun. Masuk atau daftar untuk membuka katalog lengkap dan mengajukan rental."],
  ["Bagaimana memilih ukuran?", "Lihat ukuran dan deskripsi di halaman detail setiap item. Periksa informasi tersebut sebelum memilih tanggal dan mengirim pengajuan."],
  ["Apakah pengajuan langsung disetujui?", "Pengajuan menunggu persetujuan pemilik toko. Dashboard menampilkan status, periode sewa, dan catatan admin jika ada."],
];

export default function LandingContent({ products, catalogState }) {
  const featured = getLandingFeature(products);

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><svg className={styles.studioMark} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 1v22M1 12h22M4 4l16 16M4 20 20 4" /></svg> Ruang ganti karakter</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            <span>Karakter</span><span>pilihanmu.</span>
            <span className={styles.heroAccent}>Giliranmu<br />memakainya.</span>
          </h1>
          <p className={styles.heroDescription}>Sewa kostum &amp; aksesori cosplay per hari.<br />Dari karakter favorit jadi penampilanmu.</p>
          <div className={styles.heroActions}>
            <a href="#katalog" className={styles.primaryAction}>Jelajahi koleksi <span aria-hidden="true">↗</span></a>
            <a href="#cara-kerja" className={styles.secondaryAction}>Cara rental <span aria-hidden="true">↓</span></a>
          </div>
          <p className={styles.heroHint}>Pilih kostumnya. Tentukan harinya. Jadi karaktermu.</p>
        </div>

        <div className={styles.heroScene}>
          <p className={styles.sceneAnnotation} aria-hidden="true">Sebelum masuk karakter / 01</p>
          <div className={styles.heroVisual}>
            <div className={styles.sceneHeader}><span>Cosplay Asik / Studio rental</span><span aria-hidden="true">↙</span></div>
            {featured ? (
              <Link href={"/product/" + featured.id} className={styles.featured}>
                <ProductVisual item={featured} priority sizes="(max-width: 700px) 90vw, (max-width: 1024px) 44vw, 440px" />
                <div className={styles.featuredCaption}>
                  <div>
                    <p className={styles.eyebrow}>{featured.category}{featured.size && <> <span aria-hidden="true">/</span> Ukuran {featured.size}</>}</p>
                    <h2>{featured.name}</h2>
                  </div>
                  <p className={styles.featuredPrice}><strong>{formatRupiah(featured.pricePerDay)}</strong><span> / hari <span aria-hidden="true">↗</span></span></p>
                </div>
              </Link>
            ) : (
              <div className={styles.featured}>
                <ProductVisual sizes="440px" />
                <div className={styles.featuredCaption}>
                  <div><p className={styles.eyebrow}>Kostum. Kamu. Karaktermu.</p><h2>Sebuah peran baru menantimu.</h2></div>
                  <span className={styles.featuredArrow} aria-hidden="true">↗</span>
                </div>
              </div>
            )}
            <span className={styles.garmentTag} aria-hidden="true">PILIH<br />PAKAI<br /><strong>JADI.</strong></span>
          </div>
        </div>
        <div className={styles.heroFootnote}>
          <p>Kostum &amp; aksesori <span aria-hidden="true">/</span> Sewa per hari</p>
          <a href="#katalog">Temukan peran berikutnya <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section id="katalog" tabIndex={-1} className={styles.collection} aria-labelledby="collection-title">
        <div className={styles.collectionHeading} data-reveal="">
          <div><p className={styles.eyebrow}>01 / Pilihan koleksi</p><h2 id="collection-title">Mau jadi <span>siapa?</span></h2></div>
          <p>Karakter yang kamu kenal.<br />Kesempatan untuk memakainya.</p>
        </div>
        <CollectionPreview products={products} catalogState={catalogState} />
        <div className={styles.collectionFooter}>
          <p>Ini baru perkenalan.<br />Temukan lebih banyak pilihan di katalog.</p>
          <Link href="/katalog" className={styles.textLink}>Lihat katalog lengkap <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section id="cara-kerja" tabIndex={-1} className={styles.journey} aria-labelledby="journey-title">
        <div className={styles.journeyInner}>
          <div className={styles.journeyIntro} data-reveal="">
            <p className={styles.eyebrow}>02 / Dari pilihan jadi penampilan</p>
            <h2 id="journey-title">Pinjam.<br />Pakai.<br /><span>Jadi karaktermu.</span></h2>
            <p>Lima langkah dari menemukan kostum sampai kembali menjadi kamu. Rental membutuhkan akun dan persetujuan pemilik toko.</p>
            <Link href="/katalog" className={styles.textLink}>Mulai dari katalog <span aria-hidden="true">↗</span></Link>
          </div>
          <ol className={styles.journeyList}>
            {journey.map(([title, description], index) => (
              <li key={title} data-reveal="">
                <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="harga" tabIndex={-1} className={styles.pricing} aria-labelledby="price-title">
        <div className={styles.pricingCopy} data-reveal="">
          <p className={styles.eyebrow}>03 / Sesuai lama kamu memakainya</p>
          <h2 id="price-title">Lama pakai,<br /><span>jelas biayanya.</span></h2>
          <p>Harga sewa per hari. Kamu pilih periode dan jumlah item, lalu lihat estimasinya sebelum mengajukan.</p>
          <p className={styles.pricingRule}>Harga per hari <span aria-hidden="true">×</span> hari sewa <span aria-hidden="true">×</span> jumlah item</p>
          <p className={styles.pricingNote}>Tanggal mulai dan selesai ikut dihitung.<br />Tanggal yang sama = 1 hari sewa.</p>
        </div>
        {featured ? <RentalEstimate item={featured} /> : (
          <div className={styles.estimate}>
            <p className={styles.estimateLabel}><span>Catatan sewa</span><span aria-hidden="true">CA / 01</span></p>
            <h3>Kostumnya pilihanmu.<br />Periode sewanya juga.</h3>
            <dl className={styles.estimateLines}><div><dt>Harga</dt><dd>Mengikuti item</dd></div><div><dt>Durasi</dt><dd>Per hari</dd></div><div><dt>Total</dt><dd>Dihitung saat pengajuan</dd></div></dl>
            <p className={styles.estimateNote}>Contoh estimasi dengan harga item akan tersedia setelah koleksi berhasil dimuat.</p>
            <Link href="/katalog" className={styles.textLink}>Temukan item di katalog <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </section>

      <section className={styles.fittingNotes} aria-labelledby="fitting-title">
        <div data-reveal=""><p className={styles.eyebrow}>Sebelum masuk ruang ganti</p><h2 id="fitting-title">Biar lebih<br /><span>pas.</span></h2></div>
        <div className={styles.questions}>{questions.map(([question, answer]) => (
          <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>
        ))}</div>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <p className={styles.eyebrow}>Peran berikutnya, pilihanmu.</p>
        <div data-reveal=""><h2 id="closing-title">Giliranmu<br /><span>masuk karakter.</span></h2><Link href="/katalog" className={styles.closingAction} aria-label="Lihat katalog lengkap"><span aria-hidden="true">↗</span><span>Lihat katalog lengkap</span></Link></div>
        <p>Kostumnya dipinjam. Momennya jadi milikmu.</p>
      </section>
    </>
  );
}
