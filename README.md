# 🛒 Aplikasi Kasir - Uji Kompetensi Keahlian (UKK) RPL 2023/2024

Aplikasi Kasir berbasis Web Client-Server yang dibangun untuk memenuhi seluruh spesifikasi penugasan **Uji Kompetensi Keahlian (UKK)** SMK Rekayasa Perangkat Lunak Tahun Pelajaran 2023/2024 (Kode: **KM3063**).

---

## 📋 Daftar Isi
1. [Spesifikasi Tugas & Kebutuhan Teknis](#-spesifikasi-tugas--kebutuhan-teknis)
2. [Fitur & Matriks Hak Akses (Privilege)](#-fitur--matriks-hak-akses-privilege)
3. [Arsitektur & Struktur Basis Data (ERD)](#-arsitektur--struktur-basis-data-erd)
4. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
5. [Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)
6. [Akun Pengguna Default](#-akun-pengguna-default)
7. [Panduan Upload Portofolio ke GitHub](#-panduan-upload-portofolio-ke-github)

---

## 🛠️ Spesifikasi Tugas & Kebutuhan Teknis

### A. Kebutuhan Perangkat Keras (Hardware Minimal)
| No | Perangkat | Spesifikasi Minimal | Keterangan |
|---|---|---|---|
| 1 | Server PC / Laptop | Prosesor Dual Core 2.4 GHz, RAM 2 GB, Keyboard, Mouse, Monitor | Baik |
| 2 | Client PC / Laptop | Prosesor Dual Core 2.4 GHz, RAM 2 GB, Keyboard, Mouse, Monitor | Baik |
| 3 | Koneksi Jaringan | Local Area Network (LAN) / WiFi / Internet | Baik |

### B. Kebutuhan Perangkat Lunak (Software)
- **Sistem Operasi**: Windows 10/11, Linux, atau macOS
- **Runtime**: Node.js v18+ (Rekomendasi v20 ke atas)
- **Database**: SQLite (Otomatis zero-config bawaan) + Skema MySQL (`database_kasir.sql`) untuk phpMyAdmin / XAMPP
- **Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari

---

## 🔐 Fitur & Matriks Hak Akses (Privilege)

Sesuai ketentuan soal UKK, aplikasi menerapkan pembagian hak akses (*Privilege*) bertingkat:

| No | Fitur / Menu | Administrator | Petugas | Keterangan |
|---|---|:---:|:---:|---|
| 1 | **Login** | ✅ | ✅ | Masuk ke sistem dengan otentikasi aman (Bcrypt) |
| 2 | **Logout** | ✅ | ✅ | Mengakhiri sesi pengguna |
| 3 | **Registrasi Pengguna** | ✅ | ❌ | Tambah akun petugas baru, ubah role, dan reset password |
| 4 | **Pendataan Barang** | ✅ | ✅ | Tambah, ubah, hapus, dan cari produk/barang |
| 5 | **Pembelian / Kasir (POS)** | ✅ | ✅ | Transaksi penjualan, hitung total, bayar, kembalian, dan cetak struk kasir |
| 6 | **Stok Barang** | ✅ | ✅ | Monitoring stok, alert stok menipis, dan input penambahan stok masuk |
| 7 | **Data Pelanggan** | ✅ | ✅ | Pendataan pelanggan umum dan member langganan |
| 8 | **Laporan Penjualan Komunikatif** | ✅ | ✅ | Ringkasan omset harian, filter tanggal, grafik tren penjualan, ekspor CSV, dan cetak laporan resmi |

---

## 🗄️ Arsitektur & Struktur Basis Data (ERD)

Struktur tabel mematuhi rancangan relasi database resmi:

```
+--------------------+       +----------------------+       +------------------+
|     pelanggan      |       |      penjualan       |       |  detailpenjualan |
+--------------------+       +----------------------+       +------------------+
| *PelangganID (PK)  |<-----\| *PenjualanID (PK)    |<-----\| *DetailID (PK)   |
|  NamaPelanggan     |       |  TanggalPenjualan    |       | #PenjualanID(FK) |
|  Alamat            |       |  TotalHarga          |       | #ProdukID (FK)   |---+
|  NomorTelepon      |       | #PelangganID (FK)    |       |  JumlahProduk    |   |
+--------------------+       |  Bayar               |       |  Subtotal        |   |
                             |  Kembalian           |       +------------------+   |
                             |  PetugasID           |                              |
                             +----------------------+                              |
                                                                                   |
                                                            +------------------+   |
                                                            |      produk      |   |
                                                            +------------------+   |
                                                            | *ProdukID (PK)   |<--+
                                                            |  NamaProduk      |
                                                            |  Harga           |
                                                            |  Stok            |
                                                            +------------------+
```

### Tabel Tambahan untuk Otentikasi:
- **`user`**: `UserID` (PK), `Username`, `Password`, `NamaLengkap`, `Role` (`administrator` / `petugas`), `CreatedAt`.

> **Catatan untuk Penguji**: File SQL untuk import database ke MySQL phpMyAdmin juga disediakan pada berkas `database_kasir.sql`.

---

## 💻 Teknologi yang Digunakan

- **Backend Architecture**: Node.js & Express.js menerapkan kaidah **Object-Oriented Programming (OOP)** dengan pembagian Model-View-Controller (MVC) yang rapi.
- **Database Engine**: `node:sqlite` dengan skema relasional, ACID compliance, dan *automatic transaction rollback* saat validasi stok gagal.
- **Frontend & UI/UX**:
  - HTML5 & Modern Responsive Layout (Mobile / Tablet / Desktop Friendly)
  - Tailwind CSS + Plus Jakarta Sans Typography
  - Lucide Icons
  - Chart.js (Grafik visualisasi tren omset kasir harian)
  - SweetAlert2 (Dialog konfirmasi interaktif yang elegan)
- **Fitur Khusus Kasir**:
  - Format cetak Struk Kasir Termal 58mm / 80mm
  - Laporan Resmi siap cetak (Kop surat, tabel transaksi, tabel akumulasi produk, dan kolom tanda tangan penguji)

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Buka Terminal / Command Prompt
Masuk ke direktori proyek:
```bash
cd "e:\VIBE CODING\proyek8"
```

### 2. Menjalankan Server
Cukup jalankan:
```bash
node server.js
```
*Atau di Windows cukup klik dua kali file **`jalankan_aplikasi.bat`**.*

### 3. Akses Melalui Browser
Buka browser favorit Anda dan kunjungi:
```
http://localhost:3000
```

---

## 🔑 Akun Pengguna Default

| Role | Username | Password | Deskripsi |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Akses penuh ke seluruh modul, termasuk Registrasi Petugas & Pengaturan |
| **Petugas Kasir** | `petugas` | `petugas123` | Akses Kasir POS, Pendataan Barang, Stok, dan Pelanggan |

> Di halaman login tersedia tombol **Uji Coba Cepat** untuk mengisi akun secara otomatis dengan sekali klik.

---

## 📦 Panduan Upload Portofolio ke GitHub

Sesuai langkah kerja soal ujian praktik:
1. Inisialisasi git pada folder proyek:
   ```bash
   git init
   git add .
   git commit -m "feat: implementasi lengkap aplikasi kasir UKK RPL 2023/2024"
   ```
2. Buat repository baru di [GitHub](https://github.com/new) bernama `aplikasi-kasir-ukk-rpl`.
3. Hubungkan repository lokal dan upload (*push*):
   ```bash
   git branch -M main
   git remote add origin https://github.com/username-anda/aplikasi-kasir-ukk-rpl.git
   git push -u origin main
   ```

---
*Dibuat dengan penuh dedikasi untuk Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak 2023/2024.*
