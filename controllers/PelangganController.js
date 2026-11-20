const PelangganModel = require('../models/PelangganModel');

class PelangganController {
  static getAll(req, res) {
    try {
      const search = req.query.search || '';
      const list = PelangganModel.getAll(search);
      return res.json({ success: true, data: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static getById(req, res) {
    try {
      const item = PelangganModel.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan' });
      }
      return res.json({ success: true, data: item });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static create(req, res) {
    try {
      const { NamaPelanggan, Alamat, NomorTelepon } = req.body;
      const created = PelangganModel.create({
        namaPelanggan: NamaPelanggan,
        alamat: Alamat,
        nomorTelepon: NomorTelepon
      });
      return res.status(201).json({
        success: true,
        message: 'Data pelanggan berhasil disimpan!',
        data: created
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static update(req, res) {
    try {
      const { NamaPelanggan, Alamat, NomorTelepon } = req.body;
      const updated = PelangganModel.update(req.params.id, {
        namaPelanggan: NamaPelanggan,
        alamat: Alamat,
        nomorTelepon: NomorTelepon
      });
      return res.json({
        success: true,
        message: 'Data pelanggan berhasil diperbarui!',
        data: updated
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static delete(req, res) {
    try {
      const result = PelangganModel.delete(req.params.id);
      return res.json({ success: true, message: result.message });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = PelangganController;
