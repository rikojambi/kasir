const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    if (!Database.instance) {
      const dbPath = path.join(__dirname, '..', 'kasir.db');
      this.db = new DatabaseSync(dbPath);
      this.initTables();
      this.seedInitialData();
      Database.instance = this;
    }
    return Database.instance;
  }

  initTables() {
    // Aktifkan foreign keys
    this.db.exec(`PRAGMA foreign_keys = ON;`);

    // 1. Tabel Pelanggan sesuai ERD
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pelanggan (
        PelangganID INTEGER PRIMARY KEY AUTOINCREMENT,
        NamaPelanggan VARCHAR(255) NOT NULL,
        Alamat TEXT,
        NomorTelepon VARCHAR(15)
      );
    `);

    // 2. Tabel Produk sesuai ERD
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS produk (
        ProdukID INTEGER PRIMARY KEY AUTOINCREMENT,
        NamaProduk VARCHAR(255) NOT NULL,
        Harga DECIMAL(10,2) NOT NULL,
        Stok INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 3. Tabel Penjualan sesuai ERD
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS penjualan (
        PenjualanID INTEGER PRIMARY KEY AUTOINCREMENT,
        TanggalPenjualan TEXT NOT NULL,
        TotalHarga DECIMAL(10,2) NOT NULL,
        PelangganID INTEGER,
        Bayar DECIMAL(10,2) DEFAULT 0,
        Kembalian DECIMAL(10,2) DEFAULT 0,
        PetugasID INTEGER,
        FOREIGN KEY (PelangganID) REFERENCES pelanggan (PelangganID) ON DELETE SET NULL
      );
    `);

    // 4. Tabel Detail Penjualan sesuai ERD
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detailpenjualan (
        DetailID INTEGER PRIMARY KEY AUTOINCREMENT,
        PenjualanID INTEGER NOT NULL,
        ProdukID INTEGER NOT NULL,
        JumlahProduk INTEGER NOT NULL,
        Subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (PenjualanID) REFERENCES penjualan (PenjualanID) ON DELETE CASCADE,
        FOREIGN KEY (ProdukID) REFERENCES produk (ProdukID) ON DELETE RESTRICT
      );
    `);

    // 5. Tabel User / Petugas untuk autentikasi dan privilege (Administrator & Petugas)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Username VARCHAR(100) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        NamaLengkap VARCHAR(255) NOT NULL,
        Role VARCHAR(20) NOT NULL CHECK(Role IN ('administrator', 'petugas')),
        CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  seedInitialData() {
    // Cek apakah tabel user sudah memiliki admin
    const checkUser = this.db.prepare(`SELECT COUNT(*) as count FROM user`).get();
    if (checkUser.count === 0) {
      const salt = bcrypt.genSaltSync(10);
      const adminPass = bcrypt.hashSync('admin123', salt);
      const petugasPass = bcrypt.hashSync('petugas123', salt);

      const insertUser = this.db.prepare(`
        INSERT INTO user (Username, Password, NamaLengkap, Role) VALUES (?, ?, ?, ?)
      `);
      insertUser.run('admin', adminPass, 'Administrator Utama', 'administrator');
      insertUser.run('petugas', petugasPass, 'Petugas Kasir 1', 'petugas');
    }

    // Cek pelanggan awal
    const checkPelanggan = this.db.prepare(`SELECT COUNT(*) as count FROM pelanggan`).get();
    if (checkPelanggan.count === 0) {
      const insertPelanggan = this.db.prepare(`
        INSERT INTO pelanggan (NamaPelanggan, Alamat, NomorTelepon) VALUES (?, ?, ?)
      `);
      insertPelanggan.run('Pelanggan Umum', 'Jl. Merdeka No. 10', '081234567890');
      insertPelanggan.run('Budi Santoso', 'Jl. Ahmad Yani No. 45', '085678901234');
      insertPelanggan.run('Siti Aminah', 'Jl. Diponegoro No. 12', '087812345678');
    }

    // Cek produk awal
    const checkProduk = this.db.prepare(`SELECT COUNT(*) as count FROM produk`).get();
    if (checkProduk.count === 0) {
      const insertProduk = this.db.prepare(`
        INSERT INTO produk (NamaProduk, Harga, Stok) VALUES (?, ?, ?)
      `);
      insertProduk.run('Buku Tulis Sinar Dunia 38 Lembar', 4500, 50);
      insertProduk.run('Pulpen Standard AE7 0.5 Black', 3000, 100);
      insertProduk.run('Pensil 2B Faber-Castell', 3500, 75);
      insertProduk.run('Penghapus Joyko Putih', 2000, 40);
      insertProduk.run('Penggaris Butterfly 30cm', 4000, 30);
      insertProduk.run('Kertas HVS A4 Sinar Dunia 70gr (Rim)', 48000, 20);
      insertProduk.run('Spidol Whiteboard Snowman Hitam', 8500, 25);
      insertProduk.run('Map Plastik Clear Sleeve Folio', 2500, 60);
      insertProduk.run('Tipe-X Kertas Joyko Correction Tape', 6000, 35);
      insertProduk.run('Buku Gambar A3 Kiky', 9000, 15);
    }
  }

  all(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  get(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }

  run(sql, params = []) {
    return this.db.prepare(sql).run(...params);
  }
}

module.exports = new Database();
