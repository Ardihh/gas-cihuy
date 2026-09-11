import "./globals.css";

export const metadata = {
  title: "Cosplay Asik — Dashboard",
  description:
    "Sistem penyewaan kostum dan aksesoris cosplay. Kelola katalog, rental, dan approval dengan mudah.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
