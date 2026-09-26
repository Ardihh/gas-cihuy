const DEFAULT_RETURN_PATH = "/dashboard";

export function getLandingAccountLink(isAuthenticated) {
  return isAuthenticated === true
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/login", label: "Masuk" };
}

export function getSafeReturnPath(value) {
  if (value === "/dashboard" || value === "/katalog") {
    return value;
  }

  if (typeof value === "string") {
    const productPath = /^\/product\/([1-9]\d*)$/.exec(value);

    if (productPath && Number.isSafeInteger(Number(productPath[1]))) {
      return value;
    }
  }

  return DEFAULT_RETURN_PATH;
}

export function getLoginHref(next, { registered = false } = {}) {
  const query = registered ? "registered=1&" : "";
  return `/login?${query}next=${getSafeReturnPath(next)}`;
}

export function getRegisterHref(next) {
  return `/register?next=${getSafeReturnPath(next)}`;
}

export function getCatalogGateRedirect(currentUser) {
  if (currentUser?.status === "authenticated" && currentUser.user) {
    return null;
  }

  return getLoginHref("/katalog");
}
