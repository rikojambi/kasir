const db = require('./Database');

class ProdukModel {
  // Ambil semua produk dengan opsi pencarian kata kunci
  static getAll(search = '') {
    if (search && search.trim() !== '') {
      return db.all(
        `SELECT * FROM produk WHERE NamaProduk LIKE ? ORDER BY NamaProduk ASC`,
        [`%${search.trim()}%`]
      );
    }
    return db.all(`SELECT * FROM produk ORDER BY ProdukID DESC`);
  }

  // Ambil produk berdasarkan ID
  static findById(id) {
    return db.get(`SELECT * FROM produk WHERE ProdukID = ?`, [id]);
  }

  // Tambah produk baru
  static create({ namaProduk, harga, stok }) {
    if (!namaProduk || namaProduk.trim() === '') {
      throw new Error('Nama produk tidak boleh kosong!');
    }
    const hargaNum = parseFloat(harga);
    const stokNum = parseInt(stok, 10);

    if (isNaN(hargaNum) || hargaNum < 0) {
      throw new Error('Harga produk harus berupa angka positif!');
    }
    if (isNaN(stokNum) || stokNum < 0) {
      throw new Error('Stok produk harus berupa angka bulat non-negatif!');
    }

    const result = db.run(
      `INSERT INTO produk (NamaProduk, Harga, Stok) VALUES (?, ?, ?)`,
      [namaProduk.trim(), hargaNum, stokNum]
    );

    return this.findById(result.lastInsertRowid);
  }

  // Update produk
  static update(id, { namaProduk, harga, stok }) {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error('Produk tidak ditemukan!');
    }

    const newNama = namaProduk !== undefined ? namaProduk.trim() : existing.NamaProduk;
    const newHarga = harga !== undefined ? parseFloat(harga) : existing.Harga;
    const newStok = stok !== undefined ? parseInt(stok, 10) : existing.Stok;

    if (!newNama) throw new Error('Nama produk tidak boleh kosong!');
    if (isNaN(newHarga) || newHarga < 0) throw new Error('Harga harus valid!');
    if (isNaN(newStok) || newStok < 0) throw new Error('Stok harus valid!');

    db.run(
      `UPDATE produk SET NamaProduk = ?, Harga = ?, Stok = ? WHERE ProdukID = ?`,
      [newNama, newHarga, newStok, id]
    );

    return this.findById(id);
  }

  // Tambah / sesuaikan stok (Fitur Manajemen Stok Barang)
  static updateStok(id, jumlahPenambahan) {
    const produk = this.findById(id);
    if (!produk) {
      throw new Error('Produk tidak ditemukan!');
    }

    const penambahan = parseInt(jumlahPenambahan, 10);
    if (isNaN(penambahan)) {
      throw new Error('Jumlah penambahan stok harus berupa angka!');
    }

    const stokBaru = produk.Stok + penambahan;
    if (stokBaru < 0) {
      throw new Error('Stok akhir tidak boleh kurang dari 0!');
    }

    db.run(`UPDATE produk SET Stok = ? WHERE ProdukID = ?`, [stokBaru, id]);
    return this.findById(id);
  }

  // Hapus produk
  static delete(id) {
    const produk = this.findById(id);
    if (!produk) {
      throw new Error('Produk tidak ditemukan!');
    }

    // Cek apakah produk pernah digunakan dalam transaksi detailpenjualan
    const checkDetail = db.get(`SELECT COUNT(*) as count FROM detailpenjualan WHERE ProdukID = ?`, [id]);
    if (checkDetail.count > 0) {
      throw new Error('Produk tidak dapat dihapus karena sudah ada riwayat transaksi penjualan! Anda dapat mengubah stoknya menjadi 0.');
    }

    db.run(`DELETE FROM produk WHERE ProdukID = ?`, [id]);
    return { success: true, message: 'Produk berhasil dihapus' };
  }

  // Ambil produk dengan stok kritis (menipis <= 5)
  static getLowStock(threshold = 5) {
    return db.all(`SELECT * FROM produk WHERE Stok <= ? ORDER BY Stok ASC`, [threshold]);
  }
}

module.exports = ProdukModel;
