-- =========================================================
-- DATABASE: kasir
-- SOAL PRAKTIK KEJURUAN - REKAYASA PERANGKAT LUNAK
-- TAHUN PELAJARAN 2023/2024
-- =========================================================

CREATE DATABASE IF NOT EXISTS `kasir` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `kasir`;

-- --------------------------------------------------------
-- Struktur dari tabel `pelanggan`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pelanggan` (
  `PelangganID` int(11) NOT NULL AUTO_INCREMENT,
  `NamaPelanggan` varchar(255) NOT NULL,
  `Alamat` text DEFAULT NULL,
  `NomorTelepon` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`PelangganID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Struktur dari tabel `produk`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `produk` (
  `ProdukID` int(11) NOT NULL AUTO_INCREMENT,
  `NamaProduk` varchar(255) NOT NULL,
  `Harga` decimal(10,2) NOT NULL,
  `Stok` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`ProdukID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Struktur dari tabel `penjualan`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `penjualan` (
  `PenjualanID` int(11) NOT NULL AUTO_INCREMENT,
  `TanggalPenjualan` date NOT NULL,
  `TotalHarga` decimal(10,2) NOT NULL,
  `PelangganID` int(11) DEFAULT NULL,
  `Bayar` decimal(10,2) DEFAULT 0.00,
  `Kembalian` decimal(10,2) DEFAULT 0.00,
  `PetugasID` int(11) DEFAULT NULL,
  PRIMARY KEY (`PenjualanID`),
  KEY `PelangganID` (`PelangganID`),
  CONSTRAINT `fk_penjualan_pelanggan` FOREIGN KEY (`PelangganID`) REFERENCES `pelanggan` (`PelangganID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Struktur dari tabel `detailpenjualan`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `detailpenjualan` (
  `DetailID` int(11) NOT NULL AUTO_INCREMENT,
  `PenjualanID` int(11) NOT NULL,
  `ProdukID` int(11) NOT NULL,
  `JumlahProduk` int(11) NOT NULL,
  `Subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`DetailID`),
  KEY `PenjualanID` (`PenjualanID`),
  KEY `ProdukID` (`ProdukID`),
  CONSTRAINT `fk_detail_penjualan` FOREIGN KEY (`PenjualanID`) REFERENCES `penjualan` (`PenjualanID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_produk` FOREIGN KEY (`ProdukID`) REFERENCES `produk` (`ProdukID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Struktur dari tabel `user` (Tingkatan Privilege: administrator & petugas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `UserID` int(11) NOT NULL AUTO_INCREMENT,
  `Username` varchar(100) NOT NULL UNIQUE,
  `Password` varchar(255) NOT NULL,
  `NamaLengkap` varchar(255) NOT NULL,
  `Role` enum('administrator','petugas') NOT NULL,
  `CreatedAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Data Seeding / Contoh Data Awal
-- Catatan Password Hash:
-- admin: 'admin123'
-- petugas: 'petugas123'
-- --------------------------------------------------------
INSERT INTO `user` (`UserID`, `Username`, `Password`, `NamaLengkap`, `Role`) VALUES
(1, 'admin', '$2a$10$vY33D81qD5U.J5sC4sP4/e7G8c6r9f4rV04/p9vN4B.sU.jB6D1bK', 'Administrator Utama', 'administrator'),
(2, 'petugas', '$2a$10$i1a/2C77c9fO1PqD8i3X.eC0l9vO1K7d0V9A1n4u2G8y.o1E9N.iK', 'Petugas Kasir 1', 'petugas');

INSERT INTO `pelanggan` (`PelangganID`, `NamaPelanggan`, `Alamat`, `NomorTelepon`) VALUES
(1, 'Pelanggan Umum', 'Jl. Merdeka No. 10', '081234567890'),
(2, 'Budi Santoso', 'Jl. Ahmad Yani No. 45', '085678901234'),
(3, 'Siti Aminah', 'Jl. Diponegoro No. 12', '087812345678');

INSERT INTO `produk` (`ProdukID`, `NamaProduk`, `Harga`, `Stok`) VALUES
(1, 'Buku Tulis Sinar Dunia 38 Lembar', 4500.00, 50),
(2, 'Pulpen Standard AE7 0.5 Black', 3000.00, 100),
(3, 'Pensil 2B Faber-Castell', 3500.00, 75),
(4, 'Penghapus Joyko Putih', 2000.00, 40),
(5, 'Penggaris Butterfly 30cm', 4000.00, 30),
(6, 'Kertas HVS A4 Sinar Dunia 70gr (Rim)', 48000.00, 20),
(7, 'Spidol Whiteboard Snowman Hitam', 8500.00, 25),
(8, 'Map Plastik Clear Sleeve Folio', 2500.00, 60),
(9, 'Tipe-X Kertas Joyko Correction Tape', 6000.00, 35),
(10, 'Buku Gambar A3 Kiky', 9000.00, 15);
