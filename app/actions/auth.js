"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthServiceError, login, logout, registerUser } from "../../lib/auth.js";

const SESSION_COOKIE = "session_token";
const LEGACY_PROFILE_COOKIE = "user_profile";

function getLoginErrorMessage(error) {
  if (error instanceof AuthServiceError && error.code === "AUTH_SERVICE_UNAVAILABLE") {
    return "Layanan autentikasi sedang tidak tersedia. Coba lagi nanti.";
  }

  return "Email atau password tidak sesuai.";
}

function getRegistrationErrorMessage(error) {
  if (error instanceof AuthServiceError && error.code === "REGISTRATION_INVALID_INPUT") {
    return "Periksa kembali nama, email, dan password yang kamu masukkan.";
  }

  if (error instanceof AuthServiceError && error.code === "AUTH_SERVICE_UNAVAILABLE") {
    return "Layanan pendaftaran sedang tidak tersedia. Coba lagi nanti.";
  }

  return "Pendaftaran belum berhasil. Coba lagi.";
}

function readFormValue(formData, field) {
  const value = formData?.get(field);
  return typeof value === "string" ? value : "";
}

function getSessionCookieOptions(expiresIn) {
  const options = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };

  if (Number.isInteger(expiresIn) && expiresIn > 0) {
    options.maxAge = expiresIn;
  }

  return options;
}

export async function loginAction(_previousState, formData) {
  const emailValue = formData?.get("email");
  const passwordValue = formData?.get("password");
  const email = typeof emailValue === "string" ? emailValue : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  let session;

  try {
    session = await login(email, password);
  } catch (error) {
    return { error: getLoginErrorMessage(error) };
  }

  const cookieStore = await cookies();
  cookieStore.delete(LEGACY_PROFILE_COOKIE);
  cookieStore.set(SESSION_COOKIE, session.token, getSessionCookieOptions(session.expiresIn));

  redirect("/dashboard");
}

export async function registerAction(_previousState, formData) {
  const input = {
    name: readFormValue(formData, "name"),
    email: readFormValue(formData, "email"),
    password: readFormValue(formData, "password"),
    phone: readFormValue(formData, "phone"),
  };

  try {
    await registerUser(input);
  } catch (error) {
    return {
      status: "error",
      error: getRegistrationErrorMessage(error),
    };
  }

  redirect("/login?registered=1");
}

export async function logoutAction() {
  try {
    await logout();
  } catch {
    // Local session cleanup must still happen when remote logout is unavailable.
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_PROFILE_COOKIE);

  redirect("/login");
}
