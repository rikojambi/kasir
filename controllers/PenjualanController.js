const PenjualanModel = require('../models/PenjualanModel');

class PenjualanController {
  // Transaksi kasir (Checkout)
  static create(req, res) {
    try {
      const { PelangganID, Items, Bayar } = req.body;
      const petugasId = req.user ? req.user.UserID : null;

      const sale = PenjualanModel.create({
        pelangganId: PelangganID ? parseInt(PelangganID, 10) : null,
        items: Items,
        bayar: Bayar,
        petugasId: petugasId
      });

      return res.status(201).json({
        success: true,
        message: 'Transaksi penjualan berhasil diproses!',
        data: sale
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Riwayat penjualan
  static getAll(req, res) {
    try {
      const { startDate, endDate, limit } = req.query;
      const list = PenjualanModel.getAll({
        startDate,
        endDate,
        limit: limit ? parseInt(limit, 10) : 100
      });
      return res.json({ success: true, data: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Detail 1 penjualan untuk cetak struk kasir
  static getById(req, res) {
    try {
      const sale = PenjualanModel.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
      }
      return res.json({ success: true, data: sale });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Hapus transaksi (Hanya administrator)
  static delete(req, res) {
    try {
      const result = PenjualanModel.delete(req.params.id);
      return res.json({ success: true, message: result.message });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = PenjualanController;
