"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { logoutAction } from "@/app/actions/auth.js";
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
 * UserNavbar
 * Digunakan pada halaman pelanggan (customer) yang telah login,
 * seperti Dashboard Pelanggan, Riwayat Rental, dll.
 *
 * @param {Object} props
 * @param {Object|string} props.currentUser - Objek pengguna atau nama pengguna
 * @param {string} [props.activeSection] - Bagian aktif opsional (misal: "dashboard", "rental")
 */
export default function UserNavbar({ currentUser }) {
  const pathname = usePathname();
  const menuRef = useRef(null);

  const userName =
    typeof currentUser === "string"
      ? currentUser
      : currentUser?.name || "Pelanggan";

  const isRental = pathname === "/dashboard";
  const isCatalog = pathname === "/katalog" || pathname === "/catalog" || pathname.startsWith("/product");

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Brand */}
        <div className={styles.brandWrapper}>
          <Link href="/" className={styles.brand} aria-label="Cosplay Asik beranda">
            cosplay<span>asik.</span>
          </Link>
          <span className={styles.userBadge}>Area Pelanggan</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Navigasi pelanggan">
          <Link
            href="/dashboard"
            className={`${styles.navLink} ${isRental ? styles.navLinkActive : ""}`}
            aria-current={isRental ? "page" : undefined}
          >
            Rental Saya
          </Link>
          <Link
            href="/katalog"
            className={`${styles.navLink} ${isCatalog ? styles.navLinkActive : ""}`}
            aria-current={isCatalog ? "page" : undefined}
          >
            Katalog
          </Link>
        </nav>

        {/* Actions Area: User Identity & Logout */}
        <div className={styles.actionsArea}>
          <div className={styles.userIdentity}>
            <span className={styles.userAvatar} aria-hidden="true">
              {getUserInitials(userName)}
            </span>
            <div className={styles.userDetails}>
              <strong className={styles.userName}>{userName}</strong>
              <span className={styles.userRole}>Pelanggan</span>
            </div>
          </div>

          <form action={logoutAction} className={styles.logoutForm}>
            <button className={styles.btnLogout} type="submit">
              Keluar
            </button>
          </form>
        </div>

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
            aria-label="Navigasi seluler pelanggan"
            onClick={closeMenu}
          >
            <div className={styles.mobileIdentity}>
              <span className={styles.userAvatar} aria-hidden="true">
                {getUserInitials(userName)}
              </span>
              <div className={styles.userDetails}>
                <strong className={styles.userName}>{userName}</strong>
                <span className={styles.userRole}>Akun Pelanggan</span>
              </div>
            </div>

            <Link
              href="/dashboard"
              className={`${styles.mobileNavLink} ${isRental ? styles.mobileNavLinkActive : ""}`}
            >
              Rental Saya <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="/katalog"
              className={`${styles.mobileNavLink} ${isCatalog ? styles.mobileNavLinkActive : ""}`}
            >
              Katalog <span aria-hidden="true">↗</span>
            </Link>

            <div className={styles.mobileActions}>
              <form action={logoutAction} className={styles.logoutForm}>
                <button
                  className={styles.btnLogout}
                  style={{ width: "100%", justifyContent: "center" }}
                  type="submit"
                >
                  Keluar dari Akun
                </button>
              </form>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
