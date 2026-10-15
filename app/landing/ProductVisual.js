import CatalogImage from "../CatalogImage";
import { normalizeCatalogImageUrl } from "../../lib/catalog-image.mjs";
import styles from "../page.module.css";

// Illustration is always behind the photograph, never substituted for a real item.
export function FittingRoomArt() {
  return (
    <svg className={styles.fittingArt} viewBox="0 0 420 560" fill="none" aria-hidden="true">
      <path className={styles.artMirror} d="M54 530V203C54 114 124 44 210 44s156 70 156 159v327Z" />
      <path className={styles.artLine} d="M69 516V204C69 123 132 59 210 59s141 64 141 145v312M32 530h356M32 542h356" />
      <path className={styles.artCurtain} d="M64 101C85 69 105 52 133 38v470H64ZM288 38c28 14 48 31 69 63v407h-69Z" />
      <path className={styles.artFineLine} d="M86 83v423M108 61v445M313 61v445M335 83v423M169 536l-16 24M254 536l16 24" />
      <path className={styles.artHanger} d="M196 163c0-19 28-19 28 0 0 13-14 11-14 24v8l-77 39h154l-77-39" />
      <path className={styles.artGarment} d="m178 215-43 15-40 100 36 12 20-47-8 175h135l-9-175 20 47 36-12-40-100-43-15-32 20Z" />
      <path className={styles.artLapels} d="m178 215 32 20-21 61-27-47 16-34Zm64 0-32 20 22 61 26-47-16-34Z" />
      <path className={styles.artFineLine} d="M210 276v194M153 357l30-7M236 350l30 7M157 430h106M137 238l14 57M283 238l-14 57" />
      <path className={styles.artSash} d="M148 322c40 15 87 15 126 0l1 26c-43 15-83 15-129 0Z" />
      <path className={styles.artSash} d="m223 344 21 5 23 85-34-13Z" />
      <circle className={styles.artButton} cx="218" cy="292" r="3" />
      <circle className={styles.artButton} cx="218" cy="310" r="3" />
      <path className={styles.artMeasure} d="M388 193v288m-5-268h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10m-10 20h10" />
      <path className={styles.artCross} d="M24 30h16M32 22v16M378 30h16M386 22v16M24 500h16M32 492v16" />
    </svg>
  );
}

export default function ProductVisual({ item, priority = false, sizes }) {
  const hasPhotoSource = Boolean(normalizeCatalogImageUrl(item?.imageUrl));

  return (
    <div className={styles.productVisual} aria-hidden="true">
      <FittingRoomArt />
      <CatalogImage
        key={item?.imageUrl || "no-photo"}
        alt=""
        className={styles.productPhoto}
        fallbackClassName={styles.photoNote}
        fallbackLabel={item ? "Foto belum tersedia" : "Ilustrasi ruang ganti"}
        priority={priority}
        sizes={sizes}
        src={item?.imageUrl}
      />
      {hasPhotoSource && (
        <noscript><span className={styles.photoNote}>Jika foto tak tampil, ini ilustrasi.</span></noscript>
      )}
    </div>
  );
}
