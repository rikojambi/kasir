const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('node:path');

// Inisialisasi Database (akan otomatis membuat tabel & data awal)
require('./models/Database');

// Controllers & Middlewares
const AuthController = require('./controllers/AuthController');
const ProdukController = require('./controllers/ProdukController');
const PelangganController = require('./controllers/PelangganController');
const PenjualanController = require('./controllers/PenjualanController');
const UserController = require('./controllers/UserController');
const LaporanController = require('./controllers/LaporanController');
const { requireAuth, requireRole } = require('./middlewares/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// API ROUTES
// ==========================================

// 1. Autentikasi (Login & Logout - Administrator & Petugas)
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/logout', AuthController.logout);
app.get('/api/auth/me', requireAuth, AuthController.me);

// 2. Dashboard
app.get('/api/dashboard/stats', requireAuth, LaporanController.getDashboard);

// 3. Registrasi & Kelola Pengguna (ADMINISTRATOR ONLY)
app.get('/api/users', requireAuth, requireRole('administrator'), UserController.getAll);
app.post('/api/users', requireAuth, requireRole('administrator'), UserController.create);
app.put('/api/users/:id', requireAuth, requireRole('administrator'), UserController.update);
app.delete('/api/users/:id', requireAuth, requireRole('administrator'), UserController.delete);

// 4. Pendataan Barang / Produk (Administrator & Petugas)
app.get('/api/produk', requireAuth, ProdukController.getAll);
app.get('/api/produk/low-stock', requireAuth, ProdukController.getLowStock);
app.get('/api/produk/:id', requireAuth, ProdukController.getById);
app.post('/api/produk', requireAuth, ProdukController.create);
app.put('/api/produk/:id', requireAuth, ProdukController.update);
app.delete('/api/produk/:id', requireAuth, requireRole('administrator'), ProdukController.delete);

// 5. Stok Barang (Administrator & Petugas)
app.post('/api/produk/:id/stok', requireAuth, ProdukController.updateStok);

// 6. Data Pelanggan (Administrator & Petugas)
app.get('/api/pelanggan', requireAuth, PelangganController.getAll);
app.get('/api/pelanggan/:id', requireAuth, PelangganController.getById);
app.post('/api/pelanggan', requireAuth, PelangganController.create);
app.put('/api/pelanggan/:id', requireAuth, PelangganController.update);
app.delete('/api/pelanggan/:id', requireAuth, PelangganController.delete);

// 7. Penjualan / Pembelian Kasir (Administrator & Petugas)
app.post('/api/penjualan', requireAuth, PenjualanController.create);
app.get('/api/penjualan', requireAuth, PenjualanController.getAll);
app.get('/api/penjualan/:id', requireAuth, PenjualanController.getById);
app.delete('/api/penjualan/:id', requireAuth, requireRole('administrator'), PenjualanController.delete);

// 8. Pelaporan Penjualan (Administrator & Petugas)
app.get('/api/laporan', requireAuth, LaporanController.getReport);

// Fallback route untuk Single Page Application
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  APLIKASI KASIR UKK RPL 2023/2024 - CLIENT SERVER     `);
  console.log(`  Server aktif di http://localhost:${PORT}             `);
  console.log(`  Akun Default Administrator: admin / admin123         `);
  console.log(`  Akun Default Petugas:       petugas / petugas123     `);
  console.log(`=======================================================`);
});
