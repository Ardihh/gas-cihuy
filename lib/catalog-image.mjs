const createCatalogImagePattern = (hostname) => Object.freeze({
  protocol: "https",
  hostname,
  port: "",
  pathname: "/**",
  search: "",
});

export const CATALOG_IMAGE_REMOTE_PATTERNS = Object.freeze([
  createCatalogImagePattern("example.com"),
  createCatalogImagePattern("i.pinimg.com"),
]);

export const CATALOG_IMAGE_REMOTE_PATTERN = CATALOG_IMAGE_REMOTE_PATTERNS[0];

export function normalizeCatalogImageUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  let url;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  const matchesPattern = CATALOG_IMAGE_REMOTE_PATTERNS.some((pattern) => {
    const expectedProtocol = `${pattern.protocol}:`;
    const pathnameMatches = pattern.pathname === "/**"
      ? url.pathname.startsWith("/")
      : url.pathname === pattern.pathname;

    return url.protocol === expectedProtocol
      && url.hostname === pattern.hostname
      && url.port === pattern.port
      && pathnameMatches
      && url.search === pattern.search;
  });

  if (
    !matchesPattern
    || url.username !== ""
    || url.password !== ""
    || url.hash !== ""
  ) {
    return null;
  }

  return url.toString();
}
