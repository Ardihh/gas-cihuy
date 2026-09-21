# 🎭 Cosplay Asik

Cosplay Asik adalah platform web untuk penyewaan kostum dan aksesoris cosplay. Sistem ini menghubungkan pelanggan dengan operasional penyewaan melalui katalog produk, pengajuan rental, persetujuan, pemantauan status, pengembalian, dan customer feedback.

## 1. Project Overview

Cosplay Asik membantu pelanggan menemukan kostum karakter, memeriksa detail dan ketersediaan produk, mengajukan penyewaan, serta memantau perjalanan rental sampai selesai. Di sisi operasional, pemilik toko atau admin mengelola katalog, stok, pengajuan rental, progres penyewaan, dan feedback pelanggan.

Aplikasi menggunakan Cosplay API v3 sebagai sumber data dan layanan utama untuk katalog, autentikasi, rental, dan review.

## 2. Main Features

### Catalog Kostum & Aksesoris

- Menampilkan katalog kostum dan aksesoris cosplay.
- Menyediakan detail produk, kategori, deskripsi, ukuran, harga per hari, stok, status ketersediaan, dan gambar.
- Mendukung kategori `Anime`, `Game`, dan `Aksesoris`.
- Gambar remote menggunakan allowlist host terverifikasi dan fallback saat gambar kosong, tidak valid, atau gagal dimuat.

### Stock Management

- Menjadikan stok dan status ketersediaan sebagai bagian dari informasi utama produk.
- Menggunakan data stok dari layanan katalog untuk membantu keputusan penyewaan.
- Menempatkan pengelolaan stok sebagai bagian dari operasional pemilik toko/admin.

### Rental System

- Menghitung durasi dan estimasi biaya berdasarkan periode rental.
- Menerima tanggal mulai, tanggal selesai, dan jumlah item.
- Mengirim pengajuan rental melalui alur server-side.
- Menggunakan total harga dari backend sebagai hasil authoritative.

### Approval Rental

Pengajuan rental masuk ke proses operasional untuk ditinjau oleh pemilik toko/admin sebelum rental dilanjutkan ke tahap berikutnya.

### Status Penyewaan

Rental memiliki status yang menunjukkan posisi pengajuan dan progres operasional, mulai dari menunggu persetujuan sampai barang dikembalikan.

### Dashboard Pelanggan

Pelanggan dapat melihat rental miliknya, jumlah rental, status, periode, total harga, riwayat, serta filter berdasarkan kelompok status.

### Dashboard Pemilik Toko

Pemilik toko/admin menggunakan area operasional untuk memantau aktivitas rental, meninjau pengajuan, mengelola progres penyewaan, dan melihat kebutuhan operasional stok.

### Customer Feedback

Pelanggan dapat memberikan rating dan komentar untuk rental yang telah selesai dikembalikan. Feedback dikaitkan dengan pelanggan, rental, dan item yang disewa.

## 3. User Roles

### Customer

- Browse katalog kostum dan aksesoris.
- Memeriksa detail produk dan ketersediaan.
- Mengajukan rental.
- Memantau status dan riwayat rental.
- Memberikan feedback setelah rental selesai atau dikembalikan.

### Owner/Admin

- Mengelola produk dan stok.
- Meninjau pengajuan rental.
- Menyetujui atau menolak rental.
- Mengelola progres rental sampai pengembalian.
- Memantau aktivitas penyewaan.
- Memeriksa feedback pelanggan.

## 4. Business Flow

Alur utama pelanggan:

```text
Customer
  → Catalog
  → Product Detail
  → Rental Submission
  → Owner Approval
  → Rental Status Progression
  → Return
  → Feedback
```

Alur operasional pemilik toko/admin:

1. Mengelola data produk, kategori, harga, ukuran, dan stok.
2. Meninjau pengajuan rental yang masuk.
3. Menyetujui atau menolak pengajuan sesuai kondisi operasional.
4. Memantau rental yang sedang berlangsung dan proses pengembalian.
5. Menggunakan feedback untuk memantau pengalaman pelanggan dan kualitas layanan.

## 5. Tech Stack

- Next.js 16.3.4 App Router
- React 19.2.8
- JavaScript
- CSS Modules dan global CSS
- Webpack development mode
- Node.js built-in test runner
- ESLint
- Cosplay API v3 sebagai backend eksternal

## 6. Design Direction

### Ruang Ganti Karakter

Arah visual Cosplay Asik adalah studio fitting kostum yang kontemporer dengan karakter editorial dan operasional:

- warm white / chalk
- ink
- rust accent
- Outfit Display dan Inter
- separator tipis dan hierarchy yang mudah dipindai
- tanpa gradient, glow, glassmorphism, atau purple SaaS styling

## 7. Architecture

Aplikasi menggunakan App Router dengan pemisahan yang jelas antara komposisi halaman server, interaksi client, Server Actions, dan service domain.

```text
app/
├── page.js                         landing page
├── LandingClient.js                katalog dan interaksi landing
├── product/[id]/page.js            detail produk
├── product/[id]/RentalCalculator.js kalkulator dan submit rental
├── dashboard/page.js               data dashboard server-side
├── dashboard/layout.js             proteksi dashboard
├── dashboard/DashboardClient.js    filter dan interaksi dashboard
└── actions/                        Server Actions auth, rental, review

lib/
├── api.js                          API client server-only
├── auth.js                         autentikasi dan session
├── catalog.js                      service katalog
├── rentals.js                      service rental
├── reviews.js                      service review dan ownership checks
├── *-adapter.mjs                   normalisasi dan validasi domain
├── rental-presentation.mjs         label, filter, count, dan tanggal
└── format-currency.mjs             format Rupiah terpusat
```

Pemanggilan API eksternal dilakukan dari server. Client menerima data domain yang sudah dinormalisasi dan menangani interaksi presentasi seperti filter dashboard, form rental, dan form review.

## 8. API Integration

Cosplay Asik terhubung ke [Cosplay API v3](https://hmif.if.unram.ac.id/api/v3).

- **Base:** `https://hmif.if.unram.ac.id/api/v3`
- **Project:** `cosplay`

Resource utama yang digunakan:

| Method | Endpoint | Peran |
| --- | --- | --- |
| GET | `/cosplay/items` | katalog produk |
| GET | `/cosplay/items/{id}` | detail produk |
| POST | `/cosplay/register` | registrasi customer |
| POST | `/cosplay/login` | login customer |
| GET | `/cosplay/me` | identitas user terautentikasi |
| POST | `/cosplay/logout` | logout remote |
| GET | `/cosplay/rentals` | daftar rental |
| POST | `/cosplay/rentals` | pengajuan rental |
| GET | `/cosplay/reviews` | daftar review |
| POST | `/cosplay/reviews` | pembuatan review |

API client membentuk URL berdasarkan `API_BASE_URL`, `API_PROJECT_ID`, dan endpoint resource. Response API dinormalisasi melalui adapter sebelum digunakan oleh domain service atau UI.

## 9. Domain / Rental Status

Vocabulary status rental:

| Status | Makna |
| --- | --- |
| `pending` | Pengajuan menunggu peninjauan atau keputusan. |
| `approved` | Pengajuan telah disetujui untuk diproses. |
| `rejected` | Pengajuan tidak disetujui. |
| `ongoing` | Rental sedang berlangsung. |
| `returned` | Barang telah dikembalikan dan rental selesai. |
| `cancelled` | Rental dibatalkan. |

Pada dashboard, status backend tetap menggunakan vocabulary di atas. Label presentasi seperti `Aktif`, `Menunggu`, dan `Selesai` digunakan untuk membantu pelanggan membaca kelompok status.

## 10. Environment Variables

Buat file `.env.local` secara lokal:

```env
API_BASE_URL=https://hmif.if.unram.ac.id/api/v3
API_PROJECT_ID=cosplay
API_KEY=<server-only-api-key>
```

Jangan menaruh nilai secret aktual di README, source code, log, atau browser bundle. Jangan gunakan `NEXT_PUBLIC_API_KEY`. File environment lokal digunakan oleh runtime server dan tidak boleh di-commit.

## 11. Getting Started

Prasyarat: Node.js dan npm.

1. Install dependency:

   ```bash
   npm.cmd install
   ```

2. Buat `.env.local` dan isi `API_BASE_URL`, `API_PROJECT_ID`, dan `API_KEY`.

3. Jalankan development server:

   ```bash
   npm.cmd run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000).

## 12. Scripts

| Command | Kegunaan |
| --- | --- |
| `npm.cmd run dev` | menjalankan development server |
| `npm.cmd run build` | membuat production build |
| `npm.cmd run start` | menjalankan production build |
| `npm.cmd run lint` | menjalankan ESLint |
| `npm.cmd test` | menjalankan test suite Node.js |

## 13. Testing

Test suite mencakup adapter, validasi, normalisasi response, filter dan count rental, ownership filtering, serta payload server-derived untuk review dan rental.

Test dijalankan tanpa live network sehingga hasilnya deterministik dan tidak membuat perubahan pada data eksternal.

```bash
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

## 14. Security

- API key hanya digunakan pada API client server-side.
- Session autentikasi disimpan dalam cookie `session_token` HttpOnly.
- Cookie session menggunakan `SameSite=Lax` dan `Secure` pada production.
- Integrasi API eksternal tidak dilakukan langsung dari browser.
- Rental difilter berdasarkan user terautentikasi sebelum data dikirim ke Client Component.
- Review difilter berdasarkan user terautentikasi dan rental miliknya.
- `user_id` review berasal dari session server-side.
- `item_id` review berasal dari data rental authoritative.
- Validasi input dan authorization dilakukan kembali pada server.
- Error backend tidak diteruskan mentah kepada user.
- `NEXT_PUBLIC_API_KEY` tidak digunakan.

## 15. Project Structure

```text
app/
├── actions/
│   ├── auth.js
│   ├── rentals.js
│   └── reviews.js
├── dashboard/
│   ├── DashboardClient.js
│   ├── layout.js
│   ├── page.js
│   └── page.module.css
├── login/
├── register/
├── product/[id]/
├── CatalogImage.js
├── LandingClient.js
├── globals.css
└── page.js

lib/
├── api.js
├── auth.js
├── catalog.js
├── rentals.js
├── reviews.js
├── format-currency.mjs
├── rental-presentation.mjs
└── *-adapter.mjs / *-test.mjs

next.config.mjs
package.json
```
