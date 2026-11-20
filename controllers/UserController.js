const UserModel = require('../models/UserModel');

class UserController {
  // Ambil semua pengguna
  static getAll(req, res) {
    try {
      const users = UserModel.getAll();
      return res.json({ success: true, data: users });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Registrasi pengguna baru (Administrator ONLY sesuai matriks soal)
  static create(req, res) {
    try {
      const { Username, Password, NamaLengkap, Role } = req.body;

      if (!Username || !Password || !NamaLengkap || !Role) {
        return res.status(400).json({
          success: false,
          message: 'Semua kolom (Username, Password, Nama Lengkap, Role) wajib diisi!'
        });
      }

      if (!['administrator', 'petugas'].includes(Role)) {
        return res.status(400).json({
          success: false,
          message: 'Role harus berupa administrator atau petugas!'
        });
      }

      const created = UserModel.create({
        username: Username,
        password: Password,
        namaLengkap: NamaLengkap,
        role: Role
      });

      return res.status(201).json({
        success: true,
        message: 'Pengguna baru berhasil didaftarkan!',
        data: created
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Update pengguna
  static update(req, res) {
    try {
      const { Username, Password, NamaLengkap, Role } = req.body;

      if (Role && !['administrator', 'petugas'].includes(Role)) {
        return res.status(400).json({
          success: false,
          message: 'Role harus berupa administrator atau petugas!'
        });
      }

      const updated = UserModel.update(req.params.id, {
        username: Username,
        password: Password,
        namaLengkap: NamaLengkap,
        role: Role
      });

      return res.json({
        success: true,
        message: 'Data pengguna berhasil diperbarui!',
        data: updated
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Hapus pengguna
  static delete(req, res) {
    try {
      // Tidak boleh menghapus diri sendiri
      if (req.user && req.user.UserID === Number(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!'
        });
      }

      const result = UserModel.delete(req.params.id);
      return res.json({ success: true, message: result.message });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = UserController;
