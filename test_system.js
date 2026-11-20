const db = require('./models/Database');
const UserModel = require('./models/UserModel');
const ProdukModel = require('./models/ProdukModel');
const PelangganModel = require('./models/PelangganModel');
const PenjualanModel = require('./models/PenjualanModel');

console.log('--- 1. CEK TABEL DATABASE ---');
const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
console.log('Tabel terdaftar:', tables.map(t => t.name));

console.log('\n--- 2. CEK SEEDING PENGGUNA ---');
const users = UserModel.getAll();
console.log('Daftar Akun:', users);

console.log('\n--- 3. CEK SEEDING PRODUK ---');
const products = ProdukModel.getAll();
console.log(`Total Produk: ${products.length} item`);
console.log('Contoh Produk:', products.slice(0, 3));

console.log('\n--- 4. CEK SEEDING PELANGGAN ---');
const customers = PelangganModel.getAll();
console.log(`Total Pelanggan: ${customers.length}`);

console.log('\n--- 5. SIMULASI TRANSAKSI PENJUALAN ---');
try {
  const sale = PenjualanModel.create({
    pelangganId: 1,
    items: [
      { produkId: 1, jumlahProduk: 2 }, // Buku Tulis
      { produkId: 2, jumlahProduk: 3 }  // Pulpen
    ],
    bayar: 20000,
    petugasId: 1
  });
  console.log('Transaksi Sukses Disimpan!');
  console.log('Detail Penjualan ID:', sale.PenjualanID);
  console.log('Total Tagihan:', sale.TotalHarga);
  console.log('Bayar:', sale.Bayar);
  console.log('Kembalian:', sale.Kembalian);
  console.log('Rincian Item:', sale.items.map(i => `${i.NamaProduk} x ${i.JumlahProduk} = ${i.Subtotal}`));

  console.log('\n--- 6. CEK PENGURANGAN STOK OTOMATIS ---');
  const p1 = ProdukModel.findById(1);
  const p2 = ProdukModel.findById(2);
  console.log(`Stok Buku Tulis saat ini: ${p1.Stok} (Semula 50, berkurang 2 -> ${p1.Stok})`);
  console.log(`Stok Pulpen saat ini: ${p2.Stok} (Semula 100, berkurang 3 -> ${p2.Stok})`);

  console.log('\n--- 7. CEK LAPORAN PENJUALAN ---');
  const report = PenjualanModel.getReport({});
  console.log('Ringkasan Laporan:', report.summary);
} catch (err) {
  console.error('Error saat simulasi transaksi:', err);
}
