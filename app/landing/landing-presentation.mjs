import { normalizeCatalogImageUrl } from "../../lib/catalog-image.mjs";

export function getLandingFeature(products) {
  const hasPhoto = (item) => Boolean(normalizeCatalogImageUrl(item.imageUrl));
  const isAvailable = (item) => item.status === "available";

  return products.find((item) => isAvailable(item) && hasPhoto(item))
    ?? products.find(isAvailable)
    ?? products.find(hasPhoto)
    ?? products[0]
    ?? null;
}
