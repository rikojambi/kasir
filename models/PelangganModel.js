const db = require('./Database');

class PelangganModel {
  // Ambil semua pelanggan
  static getAll(search = '') {
    if (search && search.trim() !== '') {
      return db.all(
        `SELECT * FROM pelanggan WHERE NamaPelanggan LIKE ? OR NomorTelepon LIKE ? ORDER BY PelangganID DESC`,
        [`%${search.trim()}%`, `%${search.trim()}%`]
      );
    }
    return db.all(`SELECT * FROM pelanggan ORDER BY PelangganID DESC`);
  }

  // Ambil pelanggan berdasarkan ID
  static findById(id) {
    return db.get(`SELECT * FROM pelanggan WHERE PelangganID = ?`, [id]);
  }

  // Tambah pelanggan baru
  static create({ namaPelanggan, alamat = '', nomorTelepon = '' }) {
    if (!namaPelanggan || namaPelanggan.trim() === '') {
      throw new Error('Nama pelanggan tidak boleh kosong!');
    }

    const result = db.run(
      `INSERT INTO pelanggan (NamaPelanggan, Alamat, NomorTelepon) VALUES (?, ?, ?)`,
      [namaPelanggan.trim(), (alamat || '').trim(), (nomorTelepon || '').trim()]
    );

    return this.findById(result.lastInsertRowid);
  }

  // Update data pelanggan
  static update(id, { namaPelanggan, alamat, nomorTelepon }) {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error('Pelanggan tidak ditemukan!');
    }

    const newNama = namaPelanggan !== undefined ? namaPelanggan.trim() : existing.NamaPelanggan;
    const newAlamat = alamat !== undefined ? alamat.trim() : existing.Alamat;
    const newTelp = nomorTelepon !== undefined ? nomorTelepon.trim() : existing.NomorTelepon;

    if (!newNama) throw new Error('Nama pelanggan tidak boleh kosong!');

    db.run(
      `UPDATE pelanggan SET NamaPelanggan = ?, Alamat = ?, NomorTelepon = ? WHERE PelangganID = ?`,
      [newNama, newAlamat, newTelp, id]
    );

    return this.findById(id);
  }

  // Hapus pelanggan
  static delete(id) {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error('Pelanggan tidak ditemukan!');
    }

    db.run(`DELETE FROM pelanggan WHERE PelangganID = ?`, [id]);
    return { success: true, message: 'Pelanggan berhasil dihapus' };
  }
}

module.exports = PelangganModel;
