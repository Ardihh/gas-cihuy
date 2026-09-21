import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth.js";
import LoginForm from "./LoginForm";
import styles from "./page.module.css";

export default async function LoginPage({ searchParams }) {
  const currentUser = await getCurrentUser();

  if (currentUser.status === "authenticated") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const registrationComplete = resolvedSearchParams?.registered === "1";

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#login-title">
        Lewati ke form masuk
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

      <section className={styles.shell} aria-labelledby="login-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Meja rental</p>
          <h1 id="login-title">Masuk untuk melihat rental kamu.</h1>
          <p className={styles.description}>
            Gunakan akunmu untuk memantau pengajuan, jadwal, dan langkah berikutnya.
          </p>
        </div>

        <div className={styles.formPanel}>
          <LoginForm />
          {registrationComplete && (
            <p className={styles.success} role="status">
              Registrasi berhasil. Silakan masuk.
            </p>
          )}
          <p className={styles.formNote}>
            Belum punya akun? <Link href="/register">Daftar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
