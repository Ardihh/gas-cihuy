// This module is server-only because authentication reads HttpOnly cookies.
import { cookies } from "next/headers";

import { ApiError, apiFetch } from "./api.js";
import {
  AuthResponseError,
  normalizeCurrentUserResponse,
  normalizeLoginResponse,
  validateLoginCredentials,
} from "./auth-adapter.mjs";

if (typeof window !== "undefined") {
  throw new Error("lib/auth.js can only be imported from server code.");
}

const SESSION_COOKIE = "session_token";

export class AuthServiceError extends Error {
  constructor(message, { code = "AUTH_ERROR", status = null, cause } = {}) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    this.status = status;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || "";
}

function getApiStatus(error) {
  return error instanceof ApiError ? error.status : null;
}

function createServiceUnavailableError(cause) {
  return new AuthServiceError("Layanan autentikasi sedang tidak tersedia.", {
    code: "AUTH_SERVICE_UNAVAILABLE",
    status: getApiStatus(cause),
    cause,
  });
}

export async function login(email, password) {
  const normalizedEmail = typeof email === "string" ? email.trim() : email;

  if (!validateLoginCredentials(normalizedEmail, password)) {
    throw new AuthServiceError("Email atau password tidak sesuai.", {
      code: "INVALID_INPUT",
    });
  }

  try {
    const response = await apiFetch("/login", {
      method: "POST",
      auth: false,
      cache: "no-store",
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    return normalizeLoginResponse(response);
  } catch (error) {
    const status = getApiStatus(error);

    if (status === 400 || status === 401 || status === 403 || status === 422) {
      throw new AuthServiceError("Email atau password tidak sesuai.", {
        code: "INVALID_CREDENTIALS",
        status,
        cause: error,
      });
    }

    if (error instanceof AuthResponseError) {
      throw createServiceUnavailableError(error);
    }

    throw createServiceUnavailableError(error);
  }
}

export async function getCurrentUser() {
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return { status: "unauthenticated", user: null };
  }

  try {
    const response = await apiFetch("/me", { cache: "no-store" });

    return {
      status: "authenticated",
      user: normalizeCurrentUserResponse(response),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { status: "unauthenticated", user: null };
    }

    if (error instanceof AuthResponseError) {
      throw createServiceUnavailableError(error);
    }

    throw createServiceUnavailableError(error);
  }
}

export async function logout() {
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return { remote: false };
  }

  try {
    await apiFetch("/logout", {
      method: "POST",
      cache: "no-store",
    });

    return { remote: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { remote: true, alreadyUnauthenticated: true };
    }

    throw new AuthServiceError("Layanan logout sedang tidak tersedia.", {
      code: "LOGOUT_SERVICE_UNAVAILABLE",
      status: getApiStatus(error),
      cause: error,
    });
  }
}
