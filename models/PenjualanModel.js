const db = require('./Database');

class PenjualanModel {
  // Buat transaksi penjualan baru dengan kontrol integritas data
  static create({ pelangganId, items, bayar = 0, petugasId = null }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Daftar barang belanjaan tidak boleh kosong!');
    }

    const bayarNum = parseFloat(bayar) || 0;

    // Mulai transaksi database secara manual via BEGIN & COMMIT
    db.db.exec('BEGIN TRANSACTION;');

    try {
      let totalHarga = 0;
      const verifiedItems = [];

      // 1. Verifikasi ketersediaan dan harga produk
      for (const item of items) {
        const prod = db.get(`SELECT * FROM produk WHERE ProdukID = ?`, [item.produkId]);
        if (!prod) {
          throw new Error(`Produk dengan ID #${item.produkId} tidak ditemukan!`);
        }
        const qty = parseInt(item.jumlahProduk, 10);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Jumlah produk untuk "${prod.NamaProduk}" tidak valid!`);
        }
        if (prod.Stok < qty) {
          throw new Error(`Stok "${prod.NamaProduk}" tidak mencukupi! Tersedia: ${prod.Stok}, Diminta: ${qty}`);
        }

        const subtotal = prod.Harga * qty;
        totalHarga += subtotal;

        verifiedItems.push({
          produkId: prod.ProdukID,
          namaProduk: prod.NamaProduk,
          harga: prod.Harga,
          jumlah: qty,
          subtotal: subtotal
        });
      }

      if (bayarNum < totalHarga) {
        throw new Error(`Uang pembayaran (Rp ${bayarNum.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${totalHarga.toLocaleString('id-ID')})!`);
      }

      const kembalian = bayarNum - totalHarga;
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

      // 2. Simpan ke tabel penjualan
      const insertPenjualan = db.run(
        `INSERT INTO penjualan (TanggalPenjualan, TotalHarga, PelangganID, Bayar, Kembalian, PetugasID)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [today, totalHarga, pelangganId || null, bayarNum, kembalian, petugasId || null]
      );

      const penjualanId = insertPenjualan.lastInsertRowid;

      // 3. Simpan ke tabel detailpenjualan dan kurangi stok produk
      for (const item of verifiedItems) {
        db.run(
          `INSERT INTO detailpenjualan (PenjualanID, ProdukID, JumlahProduk, Subtotal)
           VALUES (?, ?, ?, ?)`,
          [penjualanId, item.produkId, item.jumlah, item.subtotal]
        );

        db.run(
          `UPDATE produk SET Stok = Stok - ? WHERE ProdukID = ?`,
          [item.jumlah, item.produkId]
        );
      }

      // Commit transaksi jika semua sukses
      db.db.exec('COMMIT;');

      return this.findById(penjualanId);
    } catch (err) {
      db.db.exec('ROLLBACK;');
      throw err;
    }
  }

  // Ambil detail 1 transaksi lengkap dengan rincian item
  static findById(penjualanId) {
    const sale = db.get(
      `SELECT p.PenjualanID, p.TanggalPenjualan, p.TotalHarga, p.PelangganID, p.Bayar, p.Kembalian, p.PetugasID,
              pel.NamaPelanggan, pel.Alamat, pel.NomorTelepon,
              u.NamaLengkap AS NamaPetugas, u.Username AS UsernamePetugas
       FROM penjualan p
       LEFT JOIN pelanggan pel ON p.PelangganID = pel.PelangganID
       LEFT JOIN user u ON p.PetugasID = u.UserID
       WHERE p.PenjualanID = ?`,
      [penjualanId]
    );

    if (!sale) return null;

    const items = db.all(
      `SELECT d.DetailID, d.PenjualanID, d.ProdukID, d.JumlahProduk, d.Subtotal,
              pr.NamaProduk, pr.Harga
       FROM detailpenjualan d
       JOIN produk pr ON d.ProdukID = pr.ProdukID
       WHERE d.PenjualanID = ?`,
      [penjualanId]
    );

    sale.items = items;
    return sale;
  }

  // Ambil riwayat penjualan dengan opsi filter tanggal
  static getAll({ startDate, endDate, limit = 100 } = {}) {
    let sql = `
      SELECT p.PenjualanID, p.TanggalPenjualan, p.TotalHarga, p.PelangganID, p.Bayar, p.Kembalian,
             COALESCE(pel.NamaPelanggan, 'Pelanggan Umum') AS NamaPelanggan,
             COALESCE(u.NamaLengkap, 'Kasir') AS NamaPetugas,
             (SELECT COUNT(*) FROM detailpenjualan WHERE PenjualanID = p.PenjualanID) AS TotalItem
      FROM penjualan p
      LEFT JOIN pelanggan pel ON p.PelangganID = pel.PelangganID
      LEFT JOIN user u ON p.PetugasID = u.UserID
    `;
    const params = [];

    if (startDate && endDate) {
      sql += ` WHERE p.TanggalPenjualan BETWEEN ? AND ? `;
      params.push(startDate, endDate);
    } else if (startDate) {
      sql += ` WHERE p.TanggalPenjualan >= ? `;
      params.push(startDate);
    }

    sql += ` ORDER BY p.PenjualanID DESC LIMIT ? `;
    params.push(limit);

    return db.all(sql, params);
  }

  // Statistik Dashboard
  static getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];

    // Total Penjualan & Omset Hari Ini
    const todayStats = db.get(
      `SELECT COUNT(*) AS TotalTransaksiHariIni, COALESCE(SUM(TotalHarga), 0) AS OmsetHariIni
       FROM penjualan WHERE TanggalPenjualan = ?`,
      [today]
    );

    // Total Omset Keseluruhan & Transaksi Keseluruhan
    const allStats = db.get(
      `SELECT COUNT(*) AS TotalTransaksi, COALESCE(SUM(TotalHarga), 0) AS TotalOmset
       FROM penjualan`
    );

    // Total Produk & Produk Stok Menipis (<= 5)
    const productStats = db.get(
      `SELECT COUNT(*) AS TotalProduk,
              SUM(CASE WHEN Stok <= 5 THEN 1 ELSE 0 END) AS LowStockCount
       FROM produk`
    );

    // Total Pelanggan
    const customerStats = db.get(`SELECT COUNT(*) AS TotalPelanggan FROM pelanggan`);

    // Top 5 Produk Terlaris
    const topProducts = db.all(
      `SELECT pr.NamaProduk, SUM(dp.JumlahProduk) AS TotalTerjual, SUM(dp.Subtotal) AS TotalPendapatan
       FROM detailpenjualan dp
       JOIN produk pr ON dp.ProdukID = pr.ProdukID
       GROUP BY dp.ProdukID
       ORDER BY TotalTerjual DESC
       LIMIT 5`
    );

    // Grafik Penjualan 7 Hari Terakhir
    const salesChart = db.all(
      `SELECT TanggalPenjualan, COUNT(*) AS Transaksi, SUM(TotalHarga) AS Total
       FROM penjualan
       GROUP BY TanggalPenjualan
       ORDER BY TanggalPenjualan DESC
       LIMIT 7`
    );

    return {
      todayStats,
      allStats,
      productStats,
      customerStats,
      topProducts,
      salesChart: salesChart.reverse()
    };
  }

  // Laporan Lengkap untuk Halaman Pelaporan Komunikatif
  static getReport({ startDate, endDate }) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause = ' WHERE p.TanggalPenjualan BETWEEN ? AND ? ';
      params.push(startDate, endDate);
    } else if (startDate) {
      whereClause = ' WHERE p.TanggalPenjualan >= ? ';
      params.push(startDate);
    }

    const summary = db.get(
      `SELECT COUNT(*) AS TotalTransaksi,
              COALESCE(SUM(p.TotalHarga), 0) AS TotalPendapatan,
              COALESCE(AVG(p.TotalHarga), 0) AS RataRataTransaksi
       FROM penjualan p ${whereClause}`,
      params
    );

    const itemsSummary = db.get(
      `SELECT COALESCE(SUM(dp.JumlahProduk), 0) AS TotalBarangTerjual
       FROM detailpenjualan dp
       JOIN penjualan p ON dp.PenjualanID = p.PenjualanID
       ${whereClause}`,
      params
    );

    const transactions = db.all(
      `SELECT p.PenjualanID, p.TanggalPenjualan, p.TotalHarga, p.Bayar, p.Kembalian,
              COALESCE(pel.NamaPelanggan, 'Pelanggan Umum') AS NamaPelanggan,
              COALESCE(u.NamaLengkap, 'Kasir') AS NamaPetugas,
              (SELECT COUNT(*) FROM detailpenjualan WHERE PenjualanID = p.PenjualanID) AS JumlahItem
       FROM penjualan p
       LEFT JOIN pelanggan pel ON p.PelangganID = pel.PelangganID
       LEFT JOIN user u ON p.PetugasID = u.UserID
       ${whereClause}
       ORDER BY p.PenjualanID DESC`,
      params
    );

    const productSales = db.all(
      `SELECT pr.NamaProduk, pr.Harga,
              SUM(dp.JumlahProduk) AS TotalTerjual,
              SUM(dp.Subtotal) AS TotalNilai
       FROM detailpenjualan dp
       JOIN produk pr ON dp.ProdukID = pr.ProdukID
       JOIN penjualan p ON dp.PenjualanID = p.PenjualanID
       ${whereClause}
       GROUP BY dp.ProdukID
       ORDER BY TotalTerjual DESC`,
      params
    );

    return {
      summary: {
        ...summary,
        TotalBarangTerjual: itemsSummary.TotalBarangTerjual
      },
      transactions,
      productSales
    };
  }

  // Hapus transaksi (Hanya Administrator jika diperlukan)
  static delete(id) {
    const sale = this.findById(id);
    if (!sale) {
      throw new Error('Transaksi tidak ditemukan!');
    }

    db.db.exec('BEGIN TRANSACTION;');
    try {
      // Kembalikan stok produk
      for (const item of sale.items) {
        db.run(`UPDATE produk SET Stok = Stok + ? WHERE ProdukID = ?`, [item.JumlahProduk, item.ProdukID]);
      }
      db.run(`DELETE FROM penjualan WHERE PenjualanID = ?`, [id]);
      db.db.exec('COMMIT;');
      return { success: true, message: 'Transaksi penjualan berhasil dibatalkan dan stok dikembalikan' };
    } catch (err) {
      db.db.exec('ROLLBACK;');
      throw err;
    }
  }
}

module.exports = PenjualanModel;
