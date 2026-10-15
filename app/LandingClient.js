"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { getLandingAccountLink } from "../lib/auth-navigation.mjs";
import styles from "./page.module.css";

const navigation = [["#cara-kerja", "Cara rental"], ["#harga", "Harga"]];

function Brand() {
  return <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">cosplay<span>asik.</span></Link>;
}

export default function LandingClient({ children, isAuthenticated = false }) {
  const page = useRef(null);
  const menu = useRef(null);
  const accountLink = getLandingAccountLink(isAuthenticated);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = [...page.current.querySelectorAll("[data-reveal]")];
    let observer;

    function configureReveals() {
      observer?.disconnect();
      elements.forEach((element) => { element.dataset.reveal = ""; });
      if (preference.matches) return;

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.dataset.reveal = "visible";
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.1 });

      elements.forEach((element) => {
        // Above-the-fold content is immediate; JS only enhances later sections.
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.dataset.reveal = "pending";
        observer.observe(element);
      });
    }

    configureReveals();
    preference.addEventListener("change", configureReveals);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", configureReveals);
    };
  }, []);

  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }

  return (
    <div className={styles.page} ref={page}>
      <a href="#main" className={styles.skipLink}>Lewati navigasi</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Brand />
          <span className={styles.brandNote}>Kostum &amp; aksesori / rental</span>
          <nav className={styles.desktopNav} aria-label="Navigasi utama">
            {navigation.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
          </nav>
          <Link href={accountLink.href} className={styles.accountLink}>{accountLink.label}<span aria-hidden="true">↗</span></Link>
          <details
            ref={menu}
            className={styles.mobileMenu}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              closeMenu();
              menu.current?.querySelector("summary")?.focus();
            }}
          >
            <summary>Menu <span aria-hidden="true">+</span></summary>
            <nav aria-label="Navigasi seluler" onClick={closeMenu}>
              <a href="#katalog">Koleksi <span aria-hidden="true">↗</span></a>
              {navigation.map(([href, label]) => <a href={href} key={href}>{label}<span aria-hidden="true">↗</span></a>)}
            </nav>
          </details>
        </div>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className={styles.footer}>
        <div><Brand /><p>Sewa kostum &amp; aksesori cosplay per hari.</p></div>
        <nav aria-label="Navigasi footer">
          <a href="#katalog">Koleksi</a>
          {navigation.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
          <Link href={accountLink.href}>{accountLink.label}</Link>
        </nav>
        <p className={styles.copyright}>© {new Date().getFullYear()} Cosplay Asik</p>
        <p className={styles.footerNote}>Dari kamu. Jadi karaktermu.</p>
      </footer>
    </div>
  );
}
