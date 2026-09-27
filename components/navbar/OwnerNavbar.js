"use client";

import Link from "next/link";
import { useRef } from "react";

import { logoutAction } from "@/app/actions/auth.js";
import styles from "./navbar.module.css";

function getUserInitials(name) {
  if (!name || typeof name !== "string") return "A";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * OwnerNavbar
 * Digunakan pada halaman operasional pemilik toko / administrator,
 * seperti Dashboard Kelola Rental, Kelola Koleksi, dll.
 *
 * @param {Object} props
 * @param {Object|string} props.currentUser - Objek pengguna atau nama admin
 * @param {string} [props.activeView="rentals"] - Tab aktif ("rentals" | "items")
 * @param {function} [props.onViewChange] - Callback jika ganti view di client
 * @param {number} [props.pendingCount=0] - Jumlah rental berstatus pending
 */
export default function OwnerNavbar({
  currentUser,
  activeView = "rentals",
  onViewChange,
  pendingCount = 0,
}) {
  const menuRef = useRef(null);

  const adminName =
    typeof currentUser === "string"
      ? currentUser
      : currentUser?.name || "Admin";

  const isRentalsActive = activeView === "rentals";
  const isItemsActive = activeView === "items";
  const isFeedbackActive = activeView === "feedback";


  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  function handleViewClick(view) {
    if (typeof onViewChange === "function") {
      onViewChange(view);
    }
    closeMenu();
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Brand with Owner Badge */}
        <div className={styles.brandWrapper}>
          <Link href="/dashboard" className={styles.brand} aria-label="Cosplay Asik dashboard admin">
            cosplay<span>asik.</span>
          </Link>
          <span className={styles.ownerBadge}>Pemilik Toko</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Navigasi admin / owner">
          {onViewChange ? (
            <>
              <button
                type="button"
                className={`${styles.navLink} ${isRentalsActive ? styles.navLinkActive : ""}`}
                onClick={() => handleViewClick("rentals")}
              >
                Rental
                {pendingCount > 0 && (
                  <span className={styles.navBadge} title={`${pendingCount} rental butuh tindakan`}>
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`${styles.navLink} ${isItemsActive ? styles.navLinkActive : ""}`}
                onClick={() => handleViewClick("items")}
              >
                Koleksi
              </button>
              <button
                type="button"
                className={`${styles.navLink} ${isFeedbackActive ? styles.navLinkActive : ""}`}
                onClick={() => handleViewClick("feedback")}
              >
                Feedback
              </button>
            </>
          ) : (
            <>
              <Link
                href="/dashboard?view=rentals"
                className={`${styles.navLink} ${isRentalsActive ? styles.navLinkActive : ""}`}
              >
                Rental
                {pendingCount > 0 && (
                  <span className={styles.navBadge} title={`${pendingCount} rental butuh tindakan`}>
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard?view=items"
                className={`${styles.navLink} ${isItemsActive ? styles.navLinkActive : ""}`}
              >
                Koleksi
              </Link>
              <Link
                href="/dashboard?view=feedback"
                className={`${styles.navLink} ${isFeedbackActive ? styles.navLinkActive : ""}`}
              >
                Feedback
              </Link>
            </>
          )}
        </nav>

        {/* Actions Area: Owner Identity & Logout */}
        <div className={styles.actionsArea}>
          <div className={styles.userIdentity}>
            <span className={`${styles.userAvatar} ${styles.ownerAvatar}`} aria-hidden="true">
              {getUserInitials(adminName)}
            </span>
            <div className={styles.userDetails}>
              <strong className={styles.userName}>{adminName}</strong>
              <span className={styles.userRole}>Administrator</span>
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
            <span>Menu Admin</span>
            <span className={styles.mobileToggleIcon} aria-hidden="true">
              +
            </span>
          </summary>
          <nav
            className={styles.mobileDropdown}
            aria-label="Navigasi seluler admin"
            onClick={closeMenu}
          >
            <div className={styles.mobileIdentity}>
              <span className={`${styles.userAvatar} ${styles.ownerAvatar}`} aria-hidden="true">
                {getUserInitials(adminName)}
              </span>
              <div className={styles.userDetails}>
                <strong className={styles.userName}>{adminName}</strong>
                <span className={styles.userRole}>Pemilik Toko</span>
              </div>
            </div>

            {onViewChange ? (
              <>
                <button
                  type="button"
                  className={`${styles.mobileNavLink} ${isRentalsActive ? styles.mobileNavLinkActive : ""}`}
                  onClick={() => handleViewClick("rentals")}
                >
                  <span>Rental</span>
                  {pendingCount > 0 && <span className={styles.navBadge}>{pendingCount}</span>}
                </button>
                <button
                  type="button"
                  className={`${styles.mobileNavLink} ${isItemsActive ? styles.mobileNavLinkActive : ""}`}
                  onClick={() => handleViewClick("items")}
                >
                  <span>Koleksi</span>
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  className={`${styles.mobileNavLink} ${isFeedbackActive ? styles.mobileNavLinkActive : ""}`}
                  onClick={() => handleViewClick("feedback")}
                >
                  <span>Feedback</span>
                  <span aria-hidden="true">→</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard?view=rentals"
                  className={`${styles.mobileNavLink} ${isRentalsActive ? styles.mobileNavLinkActive : ""}`}
                >
                  <span>Rental</span>
                  {pendingCount > 0 && <span className={styles.navBadge}>{pendingCount}</span>}
                </Link>
                <Link
                  href="/dashboard?view=items"
                  className={`${styles.mobileNavLink} ${isItemsActive ? styles.mobileNavLinkActive : ""}`}
                >
                  <span>Koleksi</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/dashboard?view=feedback"
                  className={`${styles.mobileNavLink} ${isFeedbackActive ? styles.mobileNavLinkActive : ""}`}
                >
                  <span>Feedback</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </>
            )}


            <div className={styles.mobileActions}>
              <form action={logoutAction} className={styles.logoutForm}>
                <button
                  className={styles.btnLogout}
                  style={{ width: "100%", justifyContent: "center" }}
                  type="submit"
                >
                  Keluar dari Panel Admin
                </button>
              </form>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
