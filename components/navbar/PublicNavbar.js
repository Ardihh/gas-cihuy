"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import styles from "./navbar.module.css";

function getUserInitials(name) {
  if (!name || typeof name !== "string") return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * PublicNavbar
 * Digunakan pada halaman publik sebelum login (Landing page, Katalog, Detail Produk, dll).
 * Jika ada currentUser, menampilkan jalan pintas ke Dashboard.
 *
 * @param {Object} props
 * @param {Object|null} [props.currentUser] - Objek user jika sedang login ({ name, role, ... })
 * @param {boolean} [props.showAuthButtons=true] - Menampilkan tombol Masuk / Daftar
 */
export default function PublicNavbar({ currentUser = null, showAuthButtons = true }) {
  const pathname = usePathname();
  const menuRef = useRef(null);

  const isHome = pathname === "/";
  const isCatalog = pathname === "/katalog" || pathname === "/catalog" || pathname.startsWith("/product");

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  const isOwner = currentUser?.role === "admin";
  const dashboardHref = "/dashboard";
  const dashboardLabel = isOwner ? "Dashboard Admin" : "Dashboard";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Brand */}
        <div className={styles.brandWrapper}>
          <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">
            cosplay<span>asik.</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Navigasi publik">
          <Link
            href="/"
            className={`${styles.navLink} ${isHome ? styles.navLinkActive : ""}`}
            aria-current={isHome ? "page" : undefined}
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            className={`${styles.navLink} ${isCatalog ? styles.navLinkActive : ""}`}
            aria-current={isCatalog ? "page" : undefined}
          >
            Katalog
          </Link>
          <Link href="/#alur" className={styles.navLink}>
            Alur Sewa
          </Link>
          <Link href="/#faq" className={styles.navLink}>
            FAQ
          </Link>
        </nav>

        {/* Actions / Auth Area */}
        {showAuthButtons && (
          <div className={styles.actionsArea}>
            {currentUser ? (
              <div className={styles.userIdentity}>
                <div
                  className={`${styles.userAvatar} ${isOwner ? styles.ownerAvatar : ""}`}
                  aria-hidden="true"
                >
                  {getUserInitials(currentUser.name)}
                </div>
                <div className={styles.userDetails}>
                  <strong className={styles.userName}>{currentUser.name}</strong>
                  <span className={styles.userRole}>
                    {isOwner ? "Pemilik Toko" : "Pelanggan"}
                  </span>
                </div>
                <Link href={dashboardHref} className={styles.btnSolid}>
                  {dashboardLabel} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className={styles.btnOutline}>
                  Masuk
                </Link>
                <Link href="/register" className={styles.btnSolid}>
                  Daftar Akun
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        <details
          ref={menuRef}
          className={styles.mobileMenu}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              closeMenu();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeMenu();
              menuRef.current?.querySelector("summary")?.focus();
            }
          }}
        >
          <summary>
            <span>Menu</span>
            <span className={styles.mobileToggleIcon} aria-hidden="true">
              +
            </span>
          </summary>
          <nav
            className={styles.mobileDropdown}
            aria-label="Navigasi seluler publik"
            onClick={closeMenu}
          >
            {currentUser && (
              <div className={styles.mobileIdentity}>
                <div
                  className={`${styles.userAvatar} ${isOwner ? styles.ownerAvatar : ""}`}
                  aria-hidden="true"
                >
                  {getUserInitials(currentUser.name)}
                </div>
                <div className={styles.userDetails}>
                  <strong className={styles.userName}>{currentUser.name}</strong>
                  <span className={styles.userRole}>
                    {isOwner ? "Pemilik Toko" : "Pelanggan"}
                  </span>
                </div>
              </div>
            )}

            <Link
              href="/"
              className={`${styles.mobileNavLink} ${isHome ? styles.mobileNavLinkActive : ""}`}
            >
              Beranda <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="/katalog"
              className={`${styles.mobileNavLink} ${isCatalog ? styles.mobileNavLinkActive : ""}`}
            >
              Katalog Koleksi <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/#alur" className={styles.mobileNavLink}>
              Alur Sewa <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/#faq" className={styles.mobileNavLink}>
              FAQ <span aria-hidden="true">↗</span>
            </Link>

            <div className={styles.mobileActions}>
              {currentUser ? (
                <Link href={dashboardHref} className={styles.btnSolid}>
                  Buka {dashboardLabel} →
                </Link>
              ) : (
                <>
                  <Link href="/login" className={styles.btnOutline}>
                    Masuk ke Akun
                  </Link>
                  <Link href="/register" className={styles.btnSolid}>
                    Daftar Akun Baru
                  </Link>
                </>
              )}
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
