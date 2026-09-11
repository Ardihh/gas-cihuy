import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b bg-black text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">Rental Lombok</Link>
        <div className="flex gap-6 text-sm">
          <Link href="/">Beranda</Link>
          <Link href="/tentang">Tentang</Link>
        </div>
      </div>
    </nav>
  );
}