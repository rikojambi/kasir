const UserModel = require('../models/UserModel');

class AuthController {
  static login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan Password wajib diisi!'
        });
      }

      const user = UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau Password salah!'
        });
      }

      const validPassword = UserModel.verifyPassword(password, user.Password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Username atau Password salah!'
        });
      }

      // Generate session token: base64(userId:timestamp:role)
      const token = Buffer.from(`${user.UserID}:${Date.now()}:${user.Role}`).toString('base64');

      // Set cookie
      res.cookie('auth_session', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 hari
        sameSite: 'lax'
      });

      return res.json({
        success: true,
        message: 'Login berhasil! Selamat datang, ' + user.NamaLengkap,
        token: token,
        user: {
          UserID: user.UserID,
          Username: user.Username,
          NamaLengkap: user.NamaLengkap,
          Role: user.Role
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Terjadi kesalahan pada server saat login.'
      });
    }
  }

  static logout(req, res) {
    res.clearCookie('auth_session');
    return res.json({
      success: true,
      message: 'Logout berhasil. Sampai jumpa kembali!'
    });
  }

  static me(req, res) {
    return res.json({
      success: true,
      user: req.user
    });
  }
}

module.exports = AuthController;
