const ProdukModel = require('../models/ProdukModel');

class ProdukController {
  // Ambil semua produk
  static getAll(req, res) {
    try {
      const search = req.query.search || '';
      const products = ProdukModel.getAll(search);
      return res.json({ success: true, data: products });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Ambil 1 produk
  static getById(req, res) {
    try {
      const product = ProdukModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      }
      return res.json({ success: true, data: product });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Tambah produk baru
  static create(req, res) {
    try {
      const { NamaProduk, Harga, Stok } = req.body;
      const created = ProdukModel.create({
        namaProduk: NamaProduk,
        harga: Harga,
        stok: Stok
      });
      return res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan!',
        data: created
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Update produk
  static update(req, res) {
    try {
      const { NamaProduk, Harga, Stok } = req.body;
      const updated = ProdukModel.update(req.params.id, {
        namaProduk: NamaProduk,
        harga: Harga,
        stok: Stok
      });
      return res.json({
        success: true,
        message: 'Produk berhasil diperbarui!',
        data: updated
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Tambah / sesuaikan stok
  static updateStok(req, res) {
    try {
      const { jumlah } = req.body;
      const updated = ProdukModel.updateStok(req.params.id, jumlah);
      return res.json({
        success: true,
        message: 'Stok produk berhasil diperbarui!',
        data: updated
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Hapus produk
  static delete(req, res) {
    try {
      const result = ProdukModel.delete(req.params.id);
      return res.json({ success: true, message: result.message });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Low stock products
  static getLowStock(req, res) {
    try {
      const products = ProdukModel.getLowStock();
      return res.json({ success: true, data: products });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = ProdukController;
