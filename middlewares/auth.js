const UserModel = require('../models/UserModel');

// Middleware untuk memeriksa apakah user sudah login
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.auth_session) {
    token = req.cookies.auth_session;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Sesi anda telah berakhir atau belum login. Silakan login terlebih dahulu.'
    });
  }

  try {
    // Format token sederhana: base64(userId:timestamp:role)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId, timestamp, role] = decoded.split(':');

    const user = UserModel.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak valid.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token otentikasi tidak valid.'
    });
  }
}

// Middleware untuk membatasi akses khusus role tertentu (misal: 'administrator')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login.'
      });
    }

    if (!roles.includes(req.user.Role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak! Fitur ini hanya dapat diakses oleh: ${roles.join(', ')}.`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
