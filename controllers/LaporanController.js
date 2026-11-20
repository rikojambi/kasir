const PenjualanModel = require('../models/PenjualanModel');

class LaporanController {
  // Data statistik dashboard
  static getDashboard(req, res) {
    try {
      const stats = PenjualanModel.getDashboardStats();
      return res.json({ success: true, data: stats });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Data laporan penjualan lengkap (komunikatif)
  static getReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const report = PenjualanModel.getReport({ startDate, endDate });
      return res.json({ success: true, data: report });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = LaporanController;
