export const products = [
  {
    id: 1,
    name: "Costume Gojo Satoru",
    category: "Anime",
    price: "Rp100.000",
    status: "available",
  },
  {
    id: 2,
    name: "Costume Mikasa Ackerman",
    category: "Anime",
    price: "Rp120.000",
    status: "available",
  },
  {
    id: 3,
    name: "Costume Cloud Strife",
    category: "Game",
    price: "Rp150.000",
    status: "available",
  },
  {
    id: 4,
    name: "Wig Rem (Blue)",
    category: "Aksesoris",
    price: "Rp60.000",
    status: "limited",
  },
  {
    id: 5,
    name: "Props Nichirin Sword",
    category: "Aksesoris",
    price: "Rp50.000",
    status: "available",
  },
  {
    id: 6,
    name: "Costume Naruto Uzumaki",
    category: "Anime",
    price: "Rp90.000",
    status: "limited",
  },
];

export function getProductById(id) {
  return products.find((product) => String(product.id) === String(id));
}

export function getProductStatusLabel(product) {
  return product.status === "limited"
    ? "Contoh · stok terbatas"
    : "Contoh · tersedia";
}
