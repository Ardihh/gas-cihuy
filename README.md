# 💕 my Kisah

> **my Kisah** — Platform penyewaan teman kencan/pasangan secara online yang mempertemukan **Kisah** (partner yang tersedia untuk disewa) dengan **Public** (pengguna yang ingin melakukan penyewaan).

---

## 📌 Tentang Project

**my Kisah** adalah sebuah platform berbasis web yang menyediakan layanan penyewaan pasangan/teman kencan dalam periode tertentu.

Platform ini dirancang untuk mempertemukan dua jenis pengguna utama:

- **Kisah** — pengguna yang mendaftarkan dirinya sebagai pasangan/partner yang dapat disewa.
- **Public** — pengguna yang ingin menyewa Kisah untuk aktivitas atau periode tertentu.

Selain proses penyewaan, sistem menyediakan mekanisme **approval**, **status ketersediaan**, **rating**, serta **dashboard** sesuai dengan role pengguna.

> **Catatan:** Platform ditujukan untuk pengguna dewasa dan aktivitas penyewaan harus mengikuti ketentuan layanan, keamanan, serta hukum yang berlaku.

---

# 🎯 Tujuan

Project **my Kisah** bertujuan untuk:

1. Menyediakan platform terpusat untuk mencari dan menyewa partner.
2. Memudahkan Kisah dalam mengatur profil dan ketersediaannya.
3. Memudahkan Public dalam mencari partner berdasarkan informasi dan rating.
4. Menyediakan sistem approval untuk menjaga keamanan transaksi.
5. Menyediakan sistem rating dua arah antara Kisah dan Public.
6. Menyediakan dashboard yang berbeda berdasarkan role pengguna.
7. Mencatat seluruh aktivitas penyewaan secara terstruktur.

---

# 👥 Role Pengguna

Sistem memiliki **3 role utama**:

### 1. Admin

Admin bertugas mengelola dan mengawasi seluruh aktivitas platform.

Fitur:

- Login Admin
- Dashboard Admin
- Mengelola akun pengguna
- Mengelola akun Kisah
- Verifikasi/approval pendaftaran Kisah
- Mengelola transaksi penyewaan
- Memantau status penyewaan
- Mengelola rating/review
- Melihat laporan aktivitas
- Menonaktifkan akun yang melanggar ketentuan

---

### 2. Kisah

Kisah merupakan pengguna yang menawarkan dirinya sebagai partner yang dapat disewa.

Fitur:

- Registrasi sebagai Kisah
- Login
- Mengelola profil
- Mengatur foto profil
- Menentukan informasi dan deskripsi diri
- Menentukan harga/sewa
- Mengatur jadwal ketersediaan
- Melihat permintaan rental
- Menerima/menolak permintaan rental
- Melihat riwayat rental
- Memberikan rating kepada Public
- Melihat rating yang diterima
- Melihat dashboard pribadi

---

### 3. Public

Public merupakan pengguna yang menggunakan layanan my Kisah untuk mencari dan menyewa Kisah.

Fitur:

- Registrasi akun
- Login
- Melihat daftar Kisah
- Melihat profil Kisah
- Melihat rating Kisah
- Melihat harga sewa
- Melihat status ketersediaan
- Mengajukan rental
- Melihat status permintaan rental
- Melihat riwayat rental
- Memberikan rating kepada Kisah
- Menerima rating dari Kisah
- Melihat dashboard pribadi

---

# 🚀 Fitur Utama

## 🔐 1. Authentication

Pengguna dapat membuat akun dan masuk ke dalam sistem.

### Registrasi

Public dapat membuat akun sebagai:

```text
Public
Kisah
```

Setiap akun memiliki data dasar seperti:

- Nama
- Email
- Password
- Nomor telepon
- Foto profil
- Role
- Status akun

Untuk akun **Kisah**, diperlukan proses approval sebelum profil dapat ditampilkan secara publik.

### Login

Pengguna melakukan login menggunakan:

```text
Email
Password
```

Setelah login, pengguna diarahkan ke dashboard berdasarkan role.

---

# 💕 2. Kisah Profile

Setiap Kisah memiliki halaman profil yang dapat dilihat oleh Public.

Informasi yang dapat ditampilkan:

- Foto
- Nama
- Deskripsi
- Informasi dasar
- Harga rental
- Rating
- Jumlah rental
- Status ketersediaan
- Jadwal tersedia

Contoh:

```text
┌──────────────────────────────────┐
│          FOTO KISAH              │
│                                  │
│  Nama       : Amanda             │
│  Rating     : ⭐ 4.8             │
│  Rental     : 32 kali            │
│  Harga      : Rp xxx.xxx / hari  │
│  Status     : 🟢 Available       │
│                                  │
│       [ Rental Sekarang ]        │
└──────────────────────────────────┘
```

---

# 🟢 3. Availability Status

Setiap Kisah memiliki status ketersediaan.

Status yang dapat digunakan:

| Status | Keterangan |
|---|---|
| 🟢 Available | Kisah dapat disewa |
| 🟡 Pending | Sedang menunggu approval rental |
| 🔴 Rented | Sedang dalam masa rental |
| ⚫ Offline | Tidak tersedia |

Status harus berubah secara otomatis berdasarkan kondisi rental.

Contoh:

```text
Available
    ↓
Rental Request
    ↓
Pending
    ↓
Approved
    ↓
Rented
    ↓
Rental Finished
    ↓
Available
```

---

# 📅 4. Rental System

Public dapat melakukan penyewaan terhadap Kisah yang tersedia.

Informasi rental:

- Kisah yang dipilih
- Tanggal mulai
- Tanggal selesai
- Durasi
- Harga
- Catatan/keperluan
- Status rental

### Status Rental

```text
PENDING
APPROVED
REJECTED
ONGOING
COMPLETED
CANCELLED
```

### Alur Rental

```text
Public
  │
  ▼
Pilih Kisah
  │
  ▼
Pilih tanggal
  │
  ▼
Kirim Rental Request
  │
  ▼
Kisah menerima request
  │
  ├── Reject ──► REJECTED
  │
  └── Approve
          │
          ▼
       APPROVED
          │
          ▼
        ONGOING
          │
          ▼
       COMPLETED
```

---

# ✅ 5. Approval System

Sistem memiliki dua jenis approval.

### Approval Kisah

Ketika seseorang mendaftar sebagai Kisah:

```text
Register
   ↓
Pending Verification
   ↓
Admin Review
   ↓
Approved / Rejected
```

Kisah yang belum mendapatkan approval tidak dapat ditampilkan pada daftar Kisah publik.

### Approval Rental

Ketika Public melakukan rental:

```text
Public Request
      ↓
Pending
      ↓
Kisah Review
      ↓
Approve / Reject
```

Jika disetujui, sistem melakukan pengecekan kembali terhadap jadwal untuk mencegah bentrok rental.

---

# ⭐ 6. Rating & Review

my Kisah menggunakan sistem rating **dua arah**.

## Public → Kisah

Setelah rental selesai, Public dapat memberikan:

- Rating ⭐ 1–5
- Review

Contoh:

```text
⭐ ⭐ ⭐ ⭐ ⭐

"Amanda sangat ramah dan komunikatif."
```

## Kisah → Public

Kisah juga dapat memberikan rating kepada Public setelah rental selesai.

Hal ini bertujuan untuk menciptakan sistem reputasi bagi kedua pihak.

```text
Public Rating
      ↕
   Rental
      ↕
Kisah Rating
```

Rating hanya dapat diberikan apabila rental memiliki status:

```text
COMPLETED
```

---

# 📊 7. Dashboard

## Admin Dashboard

Admin dapat melihat:

```text
┌────────────────────────────────────────┐
│              ADMIN DASHBOARD            │
├────────────────────────────────────────┤
│ Total Users        │ 1,250             │
│ Total Kisah        │ 320               │
│ Rental Aktif       │ 45                │
│ Pending Approval   │ 12                │
├────────────────────────────────────────┤
│ Recent Rentals                         │
│ Pending Kisah                           │
│ User Activity                           │
└────────────────────────────────────────┘
```

Menu:

- Dashboard
- Users
- Kisah
- Rental
- Approval
- Reviews
- Reports
- Settings

---

## Kisah Dashboard

Kisah dapat melihat:

```text
┌────────────────────────────────────────┐
│             KISAH DASHBOARD             │
├────────────────────────────────────────┤
│ Rating             ⭐ 4.8              │
│ Total Rental       32                  │
│ Rental Aktif       1                   │
│ Pendapatan         Rp xxx.xxx          │
├────────────────────────────────────────┤
│ Rental Request                         │
│ Upcoming Rental                         │
│ Availability                            │
└────────────────────────────────────────┘
```

Menu:

- Dashboard
- Profile
- Rental Request
- Active Rental
- Schedule
- Rating
- Rental History
- Settings

---

## Public Dashboard

Public dapat melihat:

```text
┌────────────────────────────────────────┐
│             PUBLIC DASHBOARD            │
├────────────────────────────────────────┤
│ Active Rental       1                  │
│ Completed Rental    12                 │
│ Favorite Kisah      5                  │
├────────────────────────────────────────┤
│ Active Rental                         │
│ Upcoming Rental                       │
│ Recommended Kisah                     │
└────────────────────────────────────────┘
```

Menu:

- Dashboard
- Explore Kisah
- My Rental
- Rental History
- Rating
- Profile
- Settings

---

# 🔄 System Flow

Secara umum sistem bekerja seperti berikut:

```text
                    ┌──────────────┐
                    │    USER      │
                    └──────┬───────┘
                           │
                     Registration
                           │
                ┌──────────┴──────────┐
                │                     │
             PUBLIC                 KISAH
                │                     │
                │                Admin Approval
                │                     │
                │              ┌──────┴──────┐
                │              │             │
                │           Approved      Rejected
                │              │
                └──────┬───────┘
                       │
                  Explore Kisah
                       │
                       ▼
                Select Kisah
                       │
                       ▼
                 Rental Request
                       │
                       ▼
                 Kisah Approval
                       │
              ┌────────┴────────┐
              │                 │
           Rejected           Approved
                                │
                                ▼
                              Rental
                                │
                                ▼
                             Complete
                                │
                         ┌──────┴──────┐
                         │             │
                      Rating         Rating
                      Public         Kisah
                         │             │
                         └──────┬──────┘
                                ▼
                         Rental History
```

---

# 🗄️ Database Design

Gambaran tabel utama:

```text
users
├── id
├── name
├── email
├── password
├── role
├── phone
├── photo
├── status
└── created_at

kisah_profiles
├── id
├── user_id
├── description
├── price
├── approval_status
├── availability_status
└── created_at

rentals
├── id
├── public_id
├── kisah_id
├── start_date
├── end_date
├── duration
├── total_price
├── notes
├── status
└── created_at

ratings
├── id
├── rental_id
├── reviewer_id
├── reviewed_user_id
├── rating
├── review
└── created_at

availability
├── id
├── kisah_id
├── date
├── status
└── created_at
```

### Relasi sederhana

```text
USERS
  │
  ├────────────── KISAH_PROFILES
  │
  ├────────────── RENTALS
  │
  └────────────── RATINGS

KISAH_PROFILES
  │
  ├────────────── RENTALS
  │
  └────────────── AVAILABILITY

RENTALS
  │
  └────────────── RATINGS
```

---

# 🔒 Security & Validation

Sistem harus menerapkan beberapa mekanisme keamanan:

- Password disimpan menggunakan hashing.
- Authentication menggunakan session/token yang aman.
- Role-based access control.
- Validasi input pada setiap form.
- Validasi tanggal rental.
- Mencegah double booking.
- User hanya dapat memberikan rating setelah rental selesai.
- User tidak dapat memberikan rating berkali-kali untuk rental yang sama.
- Data pribadi pengguna dibatasi sesuai kebutuhan sistem.
- Admin memiliki hak akses tertinggi.

---

# 🛠️ Teknologi

Teknologi yang digunakan dapat disesuaikan dengan kebutuhan project.

Contoh stack:

### Frontend

- HTML
- CSS
- JavaScript
- Tailwind CSS

### Backend

- Laravel / PHP

### Database

- MySQL

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Laragon

---

# 📁 Project Structure

Contoh struktur project apabila menggunakan Laravel:

```text
my-kisah/
│
├── app/
│   ├── Http/
│   ├── Models/
│   └── Services/
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── public/
│   ├── images/
│   └── assets/
│
├── resources/
│   ├── views/
│   │   ├── admin/
│   │   ├── kisah/
│   │   ├── public/
│   │   └── auth/
│   │
│   ├── css/
│   └── js/
│
├── routes/
│   └── web.php
│
├── .env
├── composer.json
└── README.md
```

---

# 📋 Business Rules

Beberapa aturan utama sistem:

1. Satu akun hanya memiliki satu role.
2. Kisah harus mendapatkan approval Admin sebelum dapat disewa.
3. Kisah yang sedang memiliki rental aktif tidak dapat menerima rental lain pada waktu yang bentrok.
4. Public tidak dapat melakukan rental terhadap Kisah yang berstatus tidak tersedia.
5. Rental harus melalui proses approval.
6. Rating hanya dapat diberikan setelah rental selesai.
7. Rating dilakukan oleh kedua pihak.
8. Rental yang sudah berjalan tidak dapat diubah secara sembarangan.
9. Admin dapat membatalkan atau menonaktifkan akun yang melanggar aturan.
10. Sistem harus mencatat perubahan status rental.

---

# 🗺️ Development Roadmap

## Phase 1 — Foundation

- [ ] Setup project
- [ ] Setup database
- [ ] Authentication
- [ ] Role management
- [ ] User profile

## Phase 2 — Kisah

- [ ] Kisah registration
- [ ] Kisah approval
- [ ] Kisah profile
- [ ] Availability
- [ ] Schedule

## Phase 3 — Rental

- [ ] Explore Kisah
- [ ] Rental request
- [ ] Rental approval
- [ ] Rental status
- [ ] Rental history
- [ ] Double-booking prevention

## Phase 4 — Rating

- [ ] Public → Kisah rating
- [ ] Kisah → Public rating
- [ ] Review
- [ ] Rating calculation

## Phase 5 — Dashboard

- [ ] Admin dashboard
- [ ] Kisah dashboard
- [ ] Public dashboard
- [ ] Statistics
- [ ] Activity history

## Phase 6 — Security & Testing

- [ ] Authorization
- [ ] Input validation
- [ ] Security testing
- [ ] Functional testing
- [ ] User acceptance testing

---

# 🎯 Future Development

Beberapa fitur yang dapat dikembangkan selanjutnya:

- 🔎 Search & filter Kisah
- ❤️ Favorite Kisah
- 💬 Chat antara Public dan Kisah
- 🔔 Notification system
- 📅 Calendar availability
- 💳 Payment gateway
- 📍 Location-based search
- 📈 Advanced analytics
- 🛡️ Identity verification
- 🚨 Report & block user
- 📜 Terms of Service
- 🧾 Invoice/receipt rental

---

# ⚠️ Disclaimer

**my Kisah** merupakan platform untuk memfasilitasi layanan companionship/rental partner. Seluruh pengguna wajib mematuhi ketentuan penggunaan platform, menjaga keamanan dan privasi masing-masing, serta mematuhi hukum dan peraturan yang berlaku.

Platform tidak bertanggung jawab atas aktivitas di luar ruang lingkup layanan yang melanggar hukum atau ketentuan penggunaan.

---

# 👨‍💻 Development

Project ini dikembangkan sebagai project pengembangan aplikasi web dengan fokus pada:

- Role-Based Access Control
- Rental Management System
- Approval Workflow
- Availability Management
- Two-Way Rating System
- Dashboard & Data Visualization

---

## 📄 License

This project is intended for educational/development purposes.
