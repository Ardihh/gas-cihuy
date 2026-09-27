export const LANDING_PREVIEW_LIMIT = 8;

export function getLandingRecommendations(products, category = "Semua") {
  const categoryProducts = products.filter((product) => (
    category === "Semua" || product.category === category
  ));
  const availableProducts = categoryProducts.filter((product) => product.status === "available");

  const sortedProducts = [...availableProducts].sort((left, right) => (
    Number(left.id) - Number(right.id)
  ));

  return sortedProducts.slice(0, LANDING_PREVIEW_LIMIT);
}
