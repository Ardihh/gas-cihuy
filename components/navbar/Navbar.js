"use client";

import PublicNavbar from "./PublicNavbar";
import UserNavbar from "./UserNavbar";
import OwnerNavbar from "./OwnerNavbar";

/**
 * Navbar (Smart Dispatcher)
 * Komponen tunggal yang dapat secara otomatis menentukan tipe navbar yang sesuai
 * berdasarkan variant eksplisit atau objek currentUser.
 *
 * @param {Object} props
 * @param {"public"|"user"|"customer"|"owner"|"admin"|"auto"} [props.variant="auto"]
 * @param {Object|null} [props.currentUser] - Objek user hasil autentikasi
 * @param {string} [props.role] - Role eksplisit ("admin" | "customer")
 */
export default function Navbar({ variant = "auto", currentUser = null, role = null, ...restProps }) {
  const effectiveRole = role || currentUser?.role;

  // 1. Jika variant ditentukan secara eksplisit
  if (variant === "public") {
    return <PublicNavbar currentUser={currentUser} {...restProps} />;
  }

  if (variant === "user" || variant === "customer") {
    return <UserNavbar currentUser={currentUser} {...restProps} />;
  }

  if (variant === "owner" || variant === "admin") {
    return <OwnerNavbar currentUser={currentUser} {...restProps} />;
  }

  // 2. Mode Auto-detect berdasarkan role / status autentikasi
  if (effectiveRole === "admin") {
    return <OwnerNavbar currentUser={currentUser} {...restProps} />;
  }

  if (effectiveRole === "customer" || currentUser?.id) {
    return <UserNavbar currentUser={currentUser} {...restProps} />;
  }

  // 3. Fallback default untuk pengunjung publik / guest
  return <PublicNavbar currentUser={currentUser} {...restProps} />;
}
