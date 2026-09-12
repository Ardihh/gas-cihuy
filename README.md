# 🎭 Cosplay Asik

> **Cosplay Asik** adalah sistem berbasis web untuk mengelola penyewaan kostum dan aksesoris cosplay.

Sistem ini mempertemukan **pelanggan** yang ingin menyewa perlengkapan cosplay dengan **pemilik toko** yang mengelola koleksi kostum dan aksesoris.

## 📌 Tentang Project

**Cosplay Asik** dibuat untuk membantu proses penyewaan kostum dan aksesoris cosplay, mulai dari melihat katalog, mengecek ketersediaan barang, melakukan pengajuan penyewaan, hingga proses persetujuan dan pengembalian. Sistem juga menyediakan dashboard bagi pelanggan dan pemilik toko untuk memantau aktivitas penyewaan.

# 👥 Role Pengguna

Sistem memiliki dua role utama:

### 👤 Pelanggan

Pelanggan dapat:

* Membuat akun
* Login
* Melihat katalog kostum dan aksesoris
* Melihat detail barang
* Melihat harga sewa per hari
* Melihat stok/ketersediaan
* Mengajukan penyewaan
* Melihat status penyewaan
* Melihat riwayat penyewaan
* Memberikan feedback setelah rental selesai

### 🏪 Pemilik Toko

Pemilik toko dapat:

* Login
* Mengelola profil toko
* Menambahkan kostum dan aksesoris
* Mengubah informasi barang
* Mengatur harga sewa
* Mengatur stok
* Melihat daftar penyewaan
* Menyetujui atau menolak pengajuan rental
* Mengubah status penyewaan
* Melihat riwayat rental
* Melihat feedback pelanggan


# 🚀 Fitur Utama

## 🔐 1. Authentication

Pengguna dapat membuat akun dan masuk ke sistem.

Data akun meliputi:

* Nama
* Email
* Password
* Nomor telepon
* Role pengguna

Setelah login, pengguna akan diarahkan ke dashboard sesuai role.


## 🎭 2. Katalog Kostum & Aksesoris

Pelanggan dapat melihat berbagai perlengkapan cosplay yang tersedia.

Setiap barang memiliki informasi:

* Nama barang
* Kategori
* Foto
* Deskripsi
* Harga sewa per hari
* Stok
* Status ketersediaan

Contoh kategori:

```text
Kostum
├── Anime
├── Game
├── Film
└── Character

Aksesoris
├── Wig
├── Senjata Cosplay
├── Sepatu
├── Props
└── Aksesoris lainnya
```


## 📦 3. Stock Management

Pemilik toko dapat mengelola jumlah stok setiap barang.

Contoh:

```text
Nama       : Costume Gojo
Kategori   : Kostum
Harga      : Rp100.000 / hari
Stok       : 3
Tersedia   : 2
Disewa     : 1
```

Stok akan disesuaikan berdasarkan rental yang sedang berlangsung.

### Status Barang

| Status         | Keterangan      |
| -------------- | --------------- |
| 🟢 Available   | Barang tersedia |
| 🟡 Limited     | Stok terbatas   |
| 🔴 Unavailable | Tidak tersedia  |


# 📅 4. Rental System

Pelanggan dapat mengajukan penyewaan dengan menentukan:

* Barang yang ingin disewa
* Jumlah barang
* Tanggal mulai
* Tanggal selesai
* Durasi sewa

Harga rental dihitung berdasarkan:

```text
Total Harga = Harga Sewa per Hari × Jumlah Hari × Jumlah Barang
```

Contoh:

```text
Kostum        : Rp100.000 / hari
Jumlah        : 1
Durasi        : 3 hari

Total         : Rp300.000
```


# ✅ 5. Approval Rental

Setiap pengajuan rental harus melalui proses persetujuan dari pemilik toko.

Alurnya:

```text
Pelanggan
    │
    ▼
Pilih Barang
    │
    ▼
Isi Form Rental
    │
    ▼
Rental Request
    │
    ▼
Pending
    │
    ▼
Pemilik Toko
    │
 ┌──┴──────────┐
 ▼             ▼
Approve       Reject
 │             │
 ▼             ▼
Approved     Rejected
 │
 ▼
Rental
```

Pemilik toko dapat melihat detail pengajuan sebelum memberikan keputusan.


# 📋 6. Status Penyewaan

Setiap rental memiliki status untuk memudahkan pemantauan.

Status utama:

```text
PENDING
APPROVED
REJECTED
ONGOING
COMPLETED
CANCELLED
```

Alur normal:

```text
PENDING
   ↓
APPROVED
   ↓
ONGOING
   ↓
COMPLETED
```

Jika pengajuan ditolak:

```text
PENDING
   ↓
REJECTED
```


# 📊 7. Dashboard Pelanggan

Dashboard pelanggan digunakan untuk melihat aktivitas rental.

Informasi yang ditampilkan:

```text
┌─────────────────────────────────────┐
│         CUSTOMER DASHBOARD          │
├─────────────────────────────────────┤
│ Rental Aktif       : 1              │
│ Menunggu Approval  : 2              │
│ Selesai            : 5              │
├─────────────────────────────────────┤
│ Rental Terbaru                      │
│                                     │
│ Costume Naruto                      │
│ 10 Sep - 12 Sep                     │
│ Status: APPROVED                    │
└─────────────────────────────────────┘
```

Menu:

* Dashboard
* Katalog
* Rental Saya
* Riwayat Rental
* Feedback
* Profile


# 🏪 8. Dashboard Pemilik Toko

Pemilik toko dapat memantau kondisi toko melalui dashboard.

Informasi yang ditampilkan:

```text
┌─────────────────────────────────────┐
│          OWNER DASHBOARD            │
├─────────────────────────────────────┤
│ Total Produk       : 50             │
│ Rental Aktif       : 12             │
│ Pending Request    : 5              │
│ Produk Terbatas    : 4              │
├─────────────────────────────────────┤
│ Rental Terbaru                      │
│                                     │
│ Costume Mikasa                      │
│ Customer: User123                   │
│ Status: PENDING                     │
│                                     │
│        [Approve] [Reject]            │
└─────────────────────────────────────┘
```

Menu:

* Dashboard
* Produk
* Stok
* Rental
* Approval
* Feedback
* Profile Toko


# 💬 9. Customer Feedback

Setelah rental selesai, pelanggan dapat memberikan **feedback secara opsional**.

Feedback dapat berupa:

* Komentar
* Saran
* Pengalaman menggunakan layanan

Contoh:

```text
"Costume-nya masih bagus dan proses rental
juga cukup mudah. Terima kasih!"
```

Feedback **tidak menggunakan sistem rating**, sehingga tidak ada penilaian bintang terhadap produk maupun pelanggan.


# 🔄 System Flow

Alur utama sistem:

```text
              ┌───────────────┐
              │   Pelanggan   │
              └───────┬───────┘
                      │
                   Login
                      │
                      ▼
                Lihat Katalog
                      │
                      ▼
              Pilih Kostum/Barang
                      │
                      ▼
              Cek Ketersediaan
                      │
                      ▼
               Ajukan Rental
                      │
                      ▼
                  PENDING
                      │
                      ▼
             Pemilik Toko Review
                      │
               ┌──────┴──────┐
               │             │
            APPROVE        REJECT
               │
               ▼
            ONGOING
               │
               ▼
           Pengembalian
               │
               ▼
           COMPLETED
               │
               ▼
       Feedback (Opsional)
```


# 🗄️ Database

Gambaran tabel utama:

```text
users
├── id
├── name
├── email
├── password
├── phone
├── role
└── created_at

products
├── id
├── name
├── category
├── description
├── price_per_day
├── stock
├── image
└── created_at

rentals
├── id
├── user_id
├── rental_date
├── return_date
├── total_price
├── status
└── created_at

rental_items
├── id
├── rental_id
├── product_id
├── quantity
├── price_per_day
└── subtotal

feedbacks
├── id
├── rental_id
├── user_id
├── message
└── created_at
```

### Relasi Sederhana

```text
USER
 │
 └──────< RENTAL
             │
             └──────< RENTAL_ITEMS
                          │
                          └────── PRODUCT

RENTAL
  │
  └──────< FEEDBACK
```


# 🔒 Business Rules

Beberapa aturan utama sistem:

1. Pelanggan harus memiliki akun untuk melakukan rental.
2. Produk harus memiliki stok yang tersedia untuk dapat disewa.
3. Setiap rental harus menentukan tanggal mulai dan tanggal selesai.
4. Harga rental dihitung berdasarkan harga per hari.
5. Pengajuan rental harus mendapatkan approval dari pemilik toko.
6. Rental yang ditolak tidak mengurangi stok.
7. Rental yang telah disetujui akan memengaruhi stok barang.
8. Barang yang stoknya habis tidak dapat disewa.
9. Feedback hanya dapat diberikan setelah rental selesai.
10. Feedback bersifat opsional.
11. Satu rental dapat berisi lebih dari satu jenis barang.
12. Sistem harus mencegah penyewaan melebihi stok yang tersedia.
