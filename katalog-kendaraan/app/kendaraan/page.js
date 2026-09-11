import Link from "next/link";
import { notFound } from "next/navigation";
import { kendaraan } from "@/app/data";

export default function DetailPage({ params }) {
  const item = kendaraan.find((k) => k.id === Number(params.id));
  if (!item) notFound();

  const pesan = `Halo, saya mau booking ${item.nama}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-gray-600">← Kembali ke katalog</Link>

      <img
        src={item.gambar}
        alt={item.nama}
        className="w-full h-72 object-cover rounded-xl mt-4 bg-gray-100"
      />

      <h1 className="text-3xl font-bold mt-5">{item.nama}</h1>
      <p className="text-gray-600">{item.jenis}</p>
      <p className="text-2xl font-semibold mt-2">Rp{item.harga.toLocaleString("id-ID")}/hari</p>

      <a
        href={`https://wa.me/6281234567890?text=${encodeURIComponent(pesan)}`}
        target="_blank"
        className="inline-block mt-5 rounded-full bg-green-600 text-white px-5 py-2 font-semibold"
      >
        Booking via WhatsApp
      </a>
    </div>
  );
}