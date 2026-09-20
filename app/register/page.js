import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth.js";
import RegisterForm from "./RegisterForm";
import styles from "../login/page.module.css";

export default async function RegisterPage() {
  const currentUser = await getCurrentUser();

  if (currentUser.status === "authenticated") {
    redirect("/dashboard");
  }

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#register-title">
        Lewati ke form pendaftaran
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="Cosplay Asik beranda">
            cosplay<span>asik.</span>
          </Link>
          <Link className={styles.backLink} href="/">
            ← Kembali ke koleksi
          </Link>
        </div>
      </header>

      <section className={styles.shell} aria-labelledby="register-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Meja rental</p>
          <h1 id="register-title">Buat akun untuk mulai menyewa.</h1>
          <p className={styles.description}>
            Daftar untuk mengajukan rental dan memantau jadwal kostum pilihanmu.
          </p>
        </div>

        <div className={styles.formPanel}>
          <RegisterForm />
          <p className={styles.formNote}>
            Sudah punya akun? <Link href="/login">Masuk</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
