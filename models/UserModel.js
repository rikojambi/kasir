const db = require('./Database');
const bcrypt = require('bcryptjs');

class UserModel {
  // Ambil semua pengguna (hanya administrator yang boleh akses)
  static getAll() {
    return db.all(`SELECT UserID, Username, NamaLengkap, Role, CreatedAt FROM user ORDER BY UserID ASC`);
  }

  // Ambil user berdasarkan ID
  static findById(id) {
    return db.get(`SELECT UserID, Username, NamaLengkap, Role, CreatedAt FROM user WHERE UserID = ?`, [id]);
  }

  // Ambil user berdasarkan username (untuk login)
  static findByUsername(username) {
    return db.get(`SELECT * FROM user WHERE Username = ?`, [username]);
  }

  // Registrasi pengguna baru (Administrator ONLY)
  static create({ username, password, namaLengkap, role }) {
    // Validasi duplikasi username
    const existing = this.findByUsername(username);
    if (existing) {
      throw new Error('Username sudah terdaftar! Gunakan username lain.');
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const result = db.run(
      `INSERT INTO user (Username, Password, NamaLengkap, Role) VALUES (?, ?, ?, ?)`,
      [username, hash, namaLengkap, role]
    );

    return {
      UserID: result.lastInsertRowid,
      Username: username,
      NamaLengkap: namaLengkap,
      Role: role
    };
  }

  // Update profil/role/password pengguna
  static update(id, { username, password, namaLengkap, role }) {
    const user = this.findById(id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan!');
    }

    // Cek jika ganti username dan bentrok dengan orang lain
    if (username && username !== user.Username) {
      const existing = this.findByUsername(username);
      if (existing && existing.UserID !== Number(id)) {
        throw new Error('Username sudah digunakan oleh akun lain!');
      }
    }

    const newUsername = username || user.Username;
    const newNama = namaLengkap || user.NamaLengkap;
    const newRole = role || user.Role;

    if (password && password.trim() !== '') {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      db.run(
        `UPDATE user SET Username = ?, Password = ?, NamaLengkap = ?, Role = ? WHERE UserID = ?`,
        [newUsername, hash, newNama, newRole, id]
      );
    } else {
      db.run(
        `UPDATE user SET Username = ?, NamaLengkap = ?, Role = ? WHERE UserID = ?`,
        [newUsername, newNama, newRole, id]
      );
    }

    return this.findById(id);
  }

  // Hapus pengguna
  static delete(id) {
    const user = this.findById(id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan!');
    }
    // Proteksi: jangan sampai menghapus admin terakhir
    const adminCount = db.get(`SELECT COUNT(*) as total FROM user WHERE Role = 'administrator'`);
    if (user.Role === 'administrator' && adminCount.total <= 1) {
      throw new Error('Tidak dapat menghapus administrator satu-satunya di sistem!');
    }

    db.run(`DELETE FROM user WHERE UserID = ?`, [id]);
    return { success: true, message: 'Pengguna berhasil dihapus' };
  }

  // Verifikasi login
  static verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
}

module.exports = UserModel;
