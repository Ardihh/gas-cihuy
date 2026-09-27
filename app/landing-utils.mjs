export const LANDING_PREVIEW_LIMIT = 8;

export function getLandingRecommendations(products, category = "Semua") {
  const categoryProducts = products.filter((product) => (
    category === "Semua" || product.category === category
  ));
  const availableProducts = categoryProducts.filter((product) => product.status === "available");

  return availableProducts.slice(0, LANDING_PREVIEW_LIMIT);
}
