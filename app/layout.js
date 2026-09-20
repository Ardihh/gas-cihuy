import "./globals.css";

export const metadata = {
  title: "Cosplay Asik — Rental Kostum & Aksesori Cosplay",
  description:
    "Jelajahi katalog kostum dan aksesori cosplay, cek harga per hari, dan pahami alur rental dengan mudah.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
