export const CATALOG_IMAGE_REMOTE_PATTERN = Object.freeze({
  protocol: "https",
  hostname: "example.com",
  port: "",
  pathname: "/**",
  search: "",
});

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

  const pattern = CATALOG_IMAGE_REMOTE_PATTERN;
  const expectedProtocol = `${pattern.protocol}:`;
  const pathnameMatches = pattern.pathname === "/**"
    ? url.pathname.startsWith("/")
    : url.pathname === pattern.pathname;

  if (
    url.protocol !== expectedProtocol ||
    url.hostname !== pattern.hostname ||
    url.port !== pattern.port ||
    !pathnameMatches ||
    url.search !== pattern.search ||
    url.username !== "" ||
    url.password !== "" ||
    url.hash !== ""
  ) {
    return null;
  }

  return url.toString();
}
