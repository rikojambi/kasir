// ========================================================
// KASIR PRO UKK RPL 2023/2024 - FRONTEND LOGIC
// ========================================================

let currentUser = null;
let currentView = 'dashboard';
let posCatalog = [];
let posCart = [];
let salesChartInstance = null;
let currentLaporanData = null;

// Helper: Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number || 0);
}

// Inisialisasi Aplikasi Saat Halaman Selesai Dimuat
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  startRealtimeClock();
  checkAuthSession();
});

// Jam Digital Realtime
function startRealtimeClock() {
  const clockEl = document.getElementById('realtimeClock');
  const update = () => {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    if (clockEl) {
      clockEl.textContent = now.toLocaleDateString('id-ID', options);
    }
  };
  update();
  setInterval(update, 1000);
}

// ========================================================
// 1. AUTENTIKASI (LOGIN & LOGOUT)
// ========================================================

function fillLogin(user, pass) {
  document.getElementById('loginUsername').value = user;
  document.getElementById('loginPassword').value = pass;
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    Swal.fire('Peringatan', 'Username dan Password wajib diisi!', 'warning');
    return;
  }

  const btn = document.getElementById('btnLoginSubmit');
  btn.disabled = true;
  btn.innerHTML = `<span>Memproses...</span>`;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || 'Login gagal');
    }

    currentUser = result.user;
    Swal.fire({
      icon: 'success',
      title: 'Login Berhasil!',
      text: result.message,
      timer: 1500,
      showConfirmButton: false
    });

    renderAppLayout();
  } catch (err) {
    Swal.fire('Gagal Masuk', err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Masuk ke Aplikasi</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
    lucide.createIcons();
  }
}

async function checkAuthSession() {
  try {
    const res = await fetch('/api/auth/me');
    const result = await res.json();
    if (result.success && result.user) {
      currentUser = result.user;
      renderAppLayout();
    } else {
      showLoginScreen();
    }
  } catch (err) {
    showLoginScreen();
  }
}

function showLoginScreen() {
  currentUser = null;
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('appLayout').classList.add('hidden');
  lucide.createIcons();
}

async function handleLogout() {
  const confirm = await Swal.fire({
    title: 'Konfirmasi Keluar',
    text: 'Apakah Anda yakin ingin logout dari aplikasi kasir?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  });

  if (confirm.isConfirmed) {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    showLoginScreen();
    Swal.fire({
      icon: 'info',
      title: 'Sampai Jumpa',
      text: 'Anda telah berhasil keluar.',
      timer: 1200,
      showConfirmButton: false
    });
  }
}

// ========================================================
// 2. LAYOUT & PRIVILEGE NAVIGATION
// ========================================================

function renderAppLayout() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('appLayout').classList.remove('hidden');

  // Set Profile & Role Badges
  document.getElementById('userNameLabel').textContent = currentUser.NamaLengkap || currentUser.Username;
  document.getElementById('userRoleBadge').textContent = currentUser.Role;
  document.getElementById('userAvatar').textContent = (currentUser.NamaLengkap || currentUser.Username).charAt(0).toUpperCase();

  // Matriks Privilege Soal UKK:
  // Registrasi Pengguna: Administrator (X), Petugas (-)
  const navUsers = document.getElementById('nav-users');
  if (currentUser.Role === 'administrator') {
    navUsers.classList.remove('hidden');
  } else {
    navUsers.classList.add('hidden');
  }

  navigate('dashboard');
  lucide.createIcons();
}

function navigate(viewName) {
  currentView = viewName;

  // Sembunyikan semua views
  const views = ['dashboard', 'kasir', 'produk', 'stok', 'pelanggan', 'users', 'laporan'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
    const navBtn = document.getElementById(`nav-${v}`);
    if (navBtn) navBtn.classList.remove('active');
  });

  // Tampilkan view yang dituju
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  const activeNav = document.getElementById(`nav-${viewName}`);
  if (activeNav) activeNav.classList.add('active');

  // Update Page Title
  const titles = {
    dashboard: 'Dashboard Ringkasan',
    kasir: 'Transaksi Kasir (Point of Sale)',
    produk: 'Pendataan Barang / Produk',
    stok: 'Manajemen Stok Barang',
    pelanggan: 'Data Pelanggan',
    users: 'Registrasi & Kelola Petugas',
    laporan: 'Laporan Penjualan Komunikatif'
  };
  document.getElementById('pageTitle').textContent = titles[viewName] || 'Aplikasi Kasir';

  // Muat data spesifik tiap view
  if (viewName === 'dashboard') loadDashboardData();
  if (viewName === 'kasir') initPosView();
  if (viewName === 'produk') loadProdukList();
  if (viewName === 'stok') loadStokList();
  if (viewName === 'pelanggan') loadPelangganList();
  if (viewName === 'users') loadUserList();
  if (viewName === 'laporan') loadReportData();

  lucide.createIcons();
}

// ========================================================
// 3. DASHBOARD VIEW
// ========================================================

async function loadDashboardData() {
  try {
    const res = await fetch('/api/dashboard/stats');
    const result = await res.json();
    if (!result.success) return;

    const data = result.data;

    // Metrik Cards
    document.getElementById('statOmsetHariIni').textContent = formatRupiah(data.todayStats.OmsetHariIni);
    document.getElementById('statTransaksiHariIni').textContent = `${data.todayStats.TotalTransaksiHariIni || 0} Transaksi Selesai`;

    document.getElementById('statTotalOmset').textContent = formatRupiah(data.allStats.TotalOmset);
    document.getElementById('statTotalTransaksi').textContent = `${data.allStats.TotalTransaksi || 0} Total Transaksi`;

    document.getElementById('statTotalProduk').textContent = data.productStats.TotalProduk || 0;
    document.getElementById('statLowStockProduk').textContent = `${data.productStats.LowStockCount || 0} Stok Kritis (<= 5)`;

    document.getElementById('statTotalPelanggan').textContent = data.customerStats.TotalPelanggan || 0;

    // Low stock warning banner
    const banner = document.getElementById('lowStockBanner');
    if (data.productStats.LowStockCount > 0) {
      banner.classList.remove('hidden');
      document.getElementById('lowStockText').textContent = `Terdapat ${data.productStats.LowStockCount} produk dengan stok kritis (di bawah 5 unit). Segera lakukan penambahan persediaan!`;
    } else {
      banner.classList.add('hidden');
    }

    // Top 5 Products
    const topContainer = document.getElementById('topProductsContainer');
    if (data.topProducts && data.topProducts.length > 0) {
      topContainer.innerHTML = data.topProducts.map((p, idx) => `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div class="flex items-center space-x-3">
            <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">#${idx + 1}</span>
            <div>
              <h5 class="text-xs font-bold text-slate-800 line-clamp-1">${escapeHtml(p.NamaProduk)}</h5>
              <span class="text-[10px] text-slate-400 font-medium">Terjual: <b class="text-slate-700">${p.TotalTerjual} pcs</b></span>
            </div>
          </div>
          <span class="text-xs font-bold text-emerald-600">${formatRupiah(p.TotalPendapatan)}</span>
        </div>
      `).join('');
    } else {
      topContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Belum ada transaksi penjualan yang tercatat.</p>`;
    }

    // Chart.js Sales Trend
    renderSalesTrendChart(data.salesChart);
    lucide.createIcons();
  } catch (err) {
    console.error('Error load dashboard:', err);
  }
}

function renderSalesTrendChart(chartData = []) {
  const ctx = document.getElementById('salesTrendChart');
  if (!ctx) return;

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  const labels = chartData.map(d => d.TanggalPenjualan);
  const values = chartData.map(d => d.Total);

  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Hari Ini'],
      datasets: [{
        label: 'Omset Penjualan (Rp)',
        data: values.length ? values : [0],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Omset: ${formatRupiah(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => 'Rp ' + (v >= 1000 ? (v / 1000) + 'k' : v)
          },
          grid: { color: '#f1f5f9' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// ========================================================
// 4. TRANSAKSI KASIR / POS (POINT OF SALE)
// ========================================================

async function initPosView() {
  await Promise.all([loadPosCatalog(), loadPosPelangganOptions()]);
  renderPosCart();
}

async function loadPosCatalog() {
  try {
    const res = await fetch('/api/produk');
    const result = await res.json();
    if (result.success) {
      posCatalog = result.data;
      filterPosProducts();
    }
  } catch (err) {
    console.error(err);
  }
}

function filterPosProducts() {
  const keyword = (document.getElementById('posSearchInput')?.value || '').toLowerCase().trim();
  const filtered = posCatalog.filter(p => p.NamaProduk.toLowerCase().includes(keyword));

  const countEl = document.getElementById('posTotalCatalogCount');
  if (countEl) countEl.textContent = filtered.length;

  const grid = document.getElementById('posProductGrid');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-xs text-slate-400">Tidak ada barang yang cocok dengan kata kunci.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(prod => {
    const isOut = prod.Stok <= 0;
    return `
      <div class="bg-white p-3.5 rounded-2xl border ${isOut ? 'border-rose-200 bg-rose-50/20 opacity-75' : 'border-slate-200/80 hover:border-blue-300 hover:shadow-md'} transition flex flex-col justify-between cursor-pointer group"
        onclick="${isOut ? '' : `addToPosCart(${prod.ProdukID})`}">
        <div>
          <div class="flex items-start justify-between gap-1 mb-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${isOut ? 'bg-rose-100 text-rose-700' : (prod.Stok <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}">
              ${isOut ? 'Habis' : `Stok: ${prod.Stok}`}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">#${prod.ProdukID}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition">${escapeHtml(prod.NamaProduk)}</h4>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs font-extrabold text-blue-600">${formatRupiah(prod.Harga)}</span>
          <button type="button" class="w-6 h-6 rounded-lg ${isOut ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'} flex items-center justify-center transition">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

async function loadPosPelangganOptions() {
  try {
    const res = await fetch('/api/pelanggan');
    const result = await res.json();
    if (result.success) {
      const select = document.getElementById('posPelangganSelect');
      if (!select) return;
      const currentSelected = select.value;
      select.innerHTML = `<option value="">Pelanggan Umum (Tanpa Member)</option>` +
        result.data.map(p => `<option value="${p.PelangganID}">${escapeHtml(p.NamaPelanggan)} (${p.NomorTelepon || '-'})</option>`).join('');
      if (currentSelected) select.value = currentSelected;
    }
  } catch (err) {
    console.error(err);
  }
}

function addToPosCart(productId) {
  const prod = posCatalog.find(p => p.ProdukID === productId);
  if (!prod) return;

  const existing = posCart.find(item => item.ProdukID === productId);
  if (existing) {
    if (existing.qty + 1 > prod.Stok) {
      Swal.fire('Stok Tidak Cukup', `Sisa stok produk "${prod.NamaProduk}" hanya ${prod.Stok} unit.`, 'warning');
      return;
    }
    existing.qty += 1;
  } else {
    if (prod.Stok < 1) {
      Swal.fire('Stok Habis', `Produk "${prod.NamaProduk}" sudah habis.`, 'warning');
      return;
    }
    posCart.push({
      ProdukID: prod.ProdukID,
      NamaProduk: prod.NamaProduk,
      Harga: prod.Harga,
      Stok: prod.Stok,
      qty: 1
    });
  }

  renderPosCart();
}

function updateCartQty(productId, change) {
  const item = posCart.find(i => i.ProdukID === productId);
  if (!item) return;

  const newQty = item.qty + change;
  if (newQty <= 0) {
    posCart = posCart.filter(i => i.ProdukID !== productId);
  } else if (newQty > item.Stok) {
    Swal.fire('Stok Terbatas', `Hanya tersedia ${item.Stok} unit untuk produk ini.`, 'warning');
    return;
  } else {
    item.qty = newQty;
  }
  renderPosCart();
}

function clearPosCart() {
  if (posCart.length === 0) return;
  posCart = [];
  renderPosCart();
}

function renderPosCart() {
  const container = document.getElementById('posCartItemsContainer');
  if (!container) return;

  if (posCart.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400">
        <i data-lucide="shopping-bag" class="w-8 h-8 mx-auto stroke-[1.5] text-slate-300 mb-2"></i>
        <p class="text-xs">Keranjang masih kosong</p>
        <p class="text-[11px] text-slate-400">Pilih barang dari katalog di sebelah kiri</p>
      </div>
    `;
    updatePosTotals();
    lucide.createIcons();
    return;
  }

  container.innerHTML = posCart.map(item => `
    <div class="pt-2 flex items-center justify-between text-xs">
      <div class="flex-1 pr-2">
        <h5 class="font-bold text-slate-800 leading-tight">${escapeHtml(item.NamaProduk)}</h5>
        <div class="text-[11px] text-slate-500 mt-0.5">
          ${formatRupiah(item.Harga)} x ${item.qty} = <b class="text-slate-800">${formatRupiah(item.Harga * item.qty)}</b>
        </div>
      </div>
      <div class="flex items-center space-x-1.5 shrink-0">
        <button type="button" onclick="updateCartQty(${item.ProdukID}, -1)" class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
          -
        </button>
        <span class="w-6 text-center font-bold text-slate-800 text-xs">${item.qty}</span>
        <button type="button" onclick="updateCartQty(${item.ProdukID}, 1)" class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
          +
        </button>
      </div>
    </div>
  `).join('');

  updatePosTotals();
  lucide.createIcons();
}

function getPosTotalAmount() {
  return posCart.reduce((acc, item) => acc + (item.Harga * item.qty), 0);
}

function updatePosTotals() {
  const total = getPosTotalAmount();
  const label = document.getElementById('posTotalAmountLabel');
  if (label) label.textContent = formatRupiah(total);
  calculateChange();
}

function setCashAmount(val) {
  const total = getPosTotalAmount();
  const input = document.getElementById('posInputBayar');
  if (val === 'exact') {
    input.value = total;
  } else {
    input.value = val;
  }
  calculateChange();
}

function calculateChange() {
  const total = getPosTotalAmount();
  const bayar = parseFloat(document.getElementById('posInputBayar')?.value) || 0;
  const kembalian = bayar - total;

  const label = document.getElementById('posKembalianLabel');
  if (!label) return;

  if (bayar <= 0) {
    label.textContent = 'Rp 0';
    label.className = 'text-sm font-bold text-slate-800';
  } else if (kembalian >= 0) {
    label.textContent = formatRupiah(kembalian);
    label.className = 'text-sm font-bold text-emerald-600';
  } else {
    label.textContent = `Kurang ${formatRupiah(Math.abs(kembalian))}`;
    label.className = 'text-sm font-bold text-rose-600';
  }
}

async function submitPosTransaction() {
  if (posCart.length === 0) {
    Swal.fire('Keranjang Kosong', 'Silakan pilih barang yang dibeli terlebih dahulu!', 'warning');
    return;
  }

  const total = getPosTotalAmount();
  const bayar = parseFloat(document.getElementById('posInputBayar').value) || 0;

  if (bayar < total) {
    Swal.fire('Uang Pembayaran Kurang', `Total tagihan ${formatRupiah(total)}, uang yang dibayarkan ${formatRupiah(bayar)}.`, 'warning');
    return;
  }

  const pelangganId = document.getElementById('posPelangganSelect').value;
  const payload = {
    PelangganID: pelangganId ? parseInt(pelangganId, 10) : null,
    Items: posCart.map(i => ({ produkId: i.ProdukID, jumlahProduk: i.qty })),
    Bayar: bayar
  };

  const btn = document.getElementById('btnSubmitPos');
  btn.disabled = true;
  btn.innerHTML = `<span>Menyimpan Transaksi...</span>`;

  try {
    const res = await fetch('/api/penjualan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || 'Transaksi gagal diproses');
    }

    // Reset Form POS
    posCart = [];
    document.getElementById('posInputBayar').value = '';
    renderPosCart();
    await loadPosCatalog(); // Refresh katalog stok terbaru

    // Tampilkan struk
    showReceiptModal(result.data);
  } catch (err) {
    Swal.fire('Transaksi Gagal', err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="printer" class="w-4 h-4"></i><span>Bayar & Cetak Struk</span>`;
    lucide.createIcons();
  }
}

// ========================================================
// 5. MODAL STRUK KASIR THERMAL
// ========================================================

function showReceiptModal(saleData) {
  const container = document.getElementById('receiptPrintArea');
  if (!container) return;

  const noFaktur = `TRX-${String(saleData.PenjualanID).padStart(5, '0')}`;
  const itemsHtml = saleData.items.map(item => `
    <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
      <span>${escapeHtml(item.NamaProduk)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; margin-bottom: 4px; color:#555;">
      <span>${item.JumlahProduk} x ${formatRupiah(item.Harga)}</span>
      <span style="font-weight:bold; color:#000;">${formatRupiah(item.Subtotal)}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <h3 style="font-size: 14px; font-weight: bold; margin: 0;">MINIMARKET UKK RPL</h3>
      <p style="margin: 2px 0;">Jl. Pendidikan No. 45, Kota Ujian</p>
      <p style="margin: 2px 0;">Telp: (021) 7890123</p>
      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
    </div>

    <div style="margin-bottom: 8px; line-height: 1.4;">
      <div>No. Nota : <b>${noFaktur}</b></div>
      <div>Tanggal  : ${saleData.TanggalPenjualan}</div>
      <div>Kasir    : ${escapeHtml(saleData.NamaPetugas || 'Petugas Kasir')}</div>
      <div>Pelanggan: ${escapeHtml(saleData.NamaPelanggan || 'Pelanggan Umum')}</div>
      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
    </div>

    <div style="margin-bottom: 8px;">
      ${itemsHtml}
      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
    </div>

    <div style="line-height: 1.5;">
      <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:12px;">
        <span>TOTAL BELANJA</span>
        <span>${formatRupiah(saleData.TotalHarga)}</span>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span>TUNAI / BAYAR</span>
        <span>${formatRupiah(saleData.Bayar)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight:bold;">
        <span>KEMBALIAN</span>
        <span>${formatRupiah(saleData.Kembalian)}</span>
      </div>
      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
    </div>

    <div style="text-align: center; margin-top: 10px; line-height: 1.4;">
      <p style="margin: 2px 0; font-weight: bold;">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
      <p style="margin: 2px 0; font-size: 10px;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
    </div>
  `;

  document.getElementById('modalStruk').classList.remove('hidden');
  lucide.createIcons();
}

function printReceipt() {
  document.body.classList.add('printing-receipt');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-receipt');
  }, 1000);
}

// ========================================================
// 6. PENDATAAN BARANG (PRODUK)
// ========================================================

async function loadProdukList() {
  const search = document.getElementById('produkSearchInput')?.value || '';
  try {
    const res = await fetch(`/api/produk?search=${encodeURIComponent(search)}`);
    const result = await res.json();
    if (!result.success) return;

    const tbody = document.getElementById('produkTableBody');
    if (!tbody) return;

    if (result.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Tidak ada data produk.</td></tr>`;
      return;
    }

    tbody.innerHTML = result.data.map(p => {
      let statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Tersedia</span>';
      if (p.Stok === 0) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Habis</span>';
      } else if (p.Stok <= 5) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Menipis</span>';
      }

      return `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="p-3.5 pl-6 font-mono font-bold text-slate-500">#${p.ProdukID}</td>
          <td class="p-3.5 font-bold text-slate-800">${escapeHtml(p.NamaProduk)}</td>
          <td class="p-3.5 font-semibold text-blue-600">${formatRupiah(p.Harga)}</td>
          <td class="p-3.5 font-bold text-slate-800">${p.Stok} unit</td>
          <td class="p-3.5">${statusBadge}</td>
          <td class="p-3.5 pr-6 text-right space-x-1">
            <button onclick="editProduk(${p.ProdukID})" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold transition">
              Edit
            </button>
            <button onclick="deleteProduk(${p.ProdukID})" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold transition">
              Hapus
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

function openProdukModal() {
  document.getElementById('modalProdukTitle').textContent = 'Tambah Produk Baru';
  document.getElementById('formProdukId').value = '';
  document.getElementById('formProdukNama').value = '';
  document.getElementById('formProdukHarga').value = '';
  document.getElementById('formProdukStok').value = '10';
  document.getElementById('modalProduk').classList.remove('hidden');
}

async function editProduk(id) {
  try {
    const res = await fetch(`/api/produk/${id}`);
    const result = await res.json();
    if (result.success && result.data) {
      const p = result.data;
      document.getElementById('modalProdukTitle').textContent = 'Edit Data Produk';
      document.getElementById('formProdukId').value = p.ProdukID;
      document.getElementById('formProdukNama').value = p.NamaProduk;
      document.getElementById('formProdukHarga').value = p.Harga;
      document.getElementById('formProdukStok').value = p.Stok;
      document.getElementById('modalProduk').classList.remove('hidden');
    }
  } catch (err) {
    Swal.fire('Error', 'Gagal memuat data produk', 'error');
  }
}

async function saveProduk(e) {
  e.preventDefault();
  const id = document.getElementById('formProdukId').value;
  const payload = {
    NamaProduk: document.getElementById('formProdukNama').value.trim(),
    Harga: parseFloat(document.getElementById('formProdukHarga').value),
    Stok: parseInt(document.getElementById('formProdukStok').value, 10)
  };

  const url = id ? `/api/produk/${id}` : '/api/produk';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    Swal.fire({ icon: 'success', title: 'Berhasil', text: result.message, timer: 1200, showConfirmButton: false });
    closeModal('modalProduk');
    loadProdukList();
  } catch (err) {
    Swal.fire('Gagal Menyimpan', err.message, 'error');
  }
}

async function deleteProduk(id) {
  const confirm = await Swal.fire({
    title: 'Hapus Produk?',
    text: 'Data produk yang sudah memiliki riwayat penjualan tidak dapat dihapus demi integritas data.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'Ya, Hapus'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/produk/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      Swal.fire('Dihapus', result.message, 'success');
      loadProdukList();
    } catch (err) {
      Swal.fire('Gagal', err.message, 'error');
    }
  }
}

// ========================================================
// 7. MANAJEMEN STOK BARANG
// ========================================================

async function loadStokList() {
  try {
    const res = await fetch('/api/produk');
    const result = await res.json();
    if (!result.success) return;

    const tbody = document.getElementById('stokTableBody');
    if (!tbody) return;

    tbody.innerHTML = result.data.map(p => {
      let statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aman</span>';
      if (p.Stok === 0) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Stok Habis</span>';
      } else if (p.Stok <= 5) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Perlu Restock Segera</span>';
      }

      return `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="p-3.5 pl-6 font-mono font-bold text-slate-500">#${p.ProdukID}</td>
          <td class="p-3.5 font-bold text-slate-800">${escapeHtml(p.NamaProduk)}</td>
          <td class="p-3.5 text-slate-600">${formatRupiah(p.Harga)}</td>
          <td class="p-3.5 font-bold text-slate-900">${p.Stok} unit</td>
          <td class="p-3.5">${statusBadge}</td>
          <td class="p-3.5 pr-6 text-right">
            <div class="inline-flex items-center space-x-1.5">
              <button onclick="addStockQuick(${p.ProdukID}, 10)" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs">+10</button>
              <button onclick="addStockQuick(${p.ProdukID}, 50)" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs">+50</button>
              <button onclick="promptCustomStock(${p.ProdukID}, '${escapeHtml(p.NamaProduk)}')" class="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs">+ Kustom</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

async function addStockQuick(productId, amount) {
  try {
    const res = await fetch(`/api/produk/${productId}/stok`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jumlah: amount })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    Swal.fire({
      icon: 'success',
      title: 'Stok Ditambahkan',
      text: `Berhasil menambahkan +${amount} unit stok.`,
      timer: 1000,
      showConfirmButton: false
    });
    loadStokList();
  } catch (err) {
    Swal.fire('Gagal', err.message, 'error');
  }
}

async function promptCustomStock(productId, productName) {
  const { value: amount } = await Swal.fire({
    title: 'Tambah Stok Masuk',
    text: `Masukkan jumlah stok tambahan untuk: ${productName}`,
    input: 'number',
    inputPlaceholder: 'Contoh: 25',
    showCancelButton: true,
    confirmButtonText: 'Tambah Stok',
    inputValidator: (val) => {
      if (!val || parseInt(val, 10) <= 0) {
        return 'Masukkan angka positif!';
      }
    }
  });

  if (amount) {
    addStockQuick(productId, parseInt(amount, 10));
  }
}

// ========================================================
// 8. DATA PELANGGAN
// ========================================================

async function loadPelangganList() {
  const search = document.getElementById('pelangganSearchInput')?.value || '';
  try {
    const res = await fetch(`/api/pelanggan?search=${encodeURIComponent(search)}`);
    const result = await res.json();
    if (!result.success) return;

    const tbody = document.getElementById('pelangganTableBody');
    if (!tbody) return;

    if (result.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Tidak ada data pelanggan.</td></tr>`;
      return;
    }

    tbody.innerHTML = result.data.map(c => `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="p-3.5 pl-6 font-mono font-bold text-slate-500">#${c.PelangganID}</td>
        <td class="p-3.5 font-bold text-slate-800">${escapeHtml(c.NamaPelanggan)}</td>
        <td class="p-3.5 text-slate-600">${escapeHtml(c.Alamat || '-')}</td>
        <td class="p-3.5 font-mono text-slate-600">${escapeHtml(c.NomorTelepon || '-')}</td>
        <td class="p-3.5 pr-6 text-right space-x-1">
          <button onclick="editPelanggan(${c.PelangganID})" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold transition">
            Edit
          </button>
          <button onclick="deletePelanggan(${c.PelangganID})" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold transition">
            Hapus
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

let isFromPos = false;
function openAddPelangganModal(fromPos = false) {
  isFromPos = fromPos;
  document.getElementById('modalPelangganTitle').textContent = 'Tambah Data Pelanggan Baru';
  document.getElementById('formPelangganId').value = '';
  document.getElementById('formPelangganNama').value = '';
  document.getElementById('formPelangganTelp').value = '';
  document.getElementById('formPelangganAlamat').value = '';
  document.getElementById('modalPelanggan').classList.remove('hidden');
}

async function editPelanggan(id) {
  isFromPos = false;
  try {
    const res = await fetch(`/api/pelanggan/${id}`);
    const result = await res.json();
    if (result.success && result.data) {
      const c = result.data;
      document.getElementById('modalPelangganTitle').textContent = 'Edit Data Pelanggan';
      document.getElementById('formPelangganId').value = c.PelangganID;
      document.getElementById('formPelangganNama').value = c.NamaPelanggan;
      document.getElementById('formPelangganTelp').value = c.NomorTelepon || '';
      document.getElementById('formPelangganAlamat').value = c.Alamat || '';
      document.getElementById('modalPelanggan').classList.remove('hidden');
    }
  } catch (err) {
    Swal.fire('Error', 'Gagal memuat data pelanggan', 'error');
  }
}

async function savePelanggan(e) {
  e.preventDefault();
  const id = document.getElementById('formPelangganId').value;
  const payload = {
    NamaPelanggan: document.getElementById('formPelangganNama').value.trim(),
    NomorTelepon: document.getElementById('formPelangganTelp').value.trim(),
    Alamat: document.getElementById('formPelangganAlamat').value.trim()
  };

  const url = id ? `/api/pelanggan/${id}` : '/api/pelanggan';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    Swal.fire({ icon: 'success', title: 'Berhasil', text: result.message, timer: 1200, showConfirmButton: false });
    closeModal('modalPelanggan');

    if (isFromPos) {
      await loadPosPelangganOptions();
      if (result.data && result.data.PelangganID) {
        document.getElementById('posPelangganSelect').value = result.data.PelangganID;
      }
    } else {
      loadPelangganList();
    }
  } catch (err) {
    Swal.fire('Gagal Menyimpan', err.message, 'error');
  }
}

async function deletePelanggan(id) {
  const confirm = await Swal.fire({
    title: 'Hapus Pelanggan?',
    text: 'Data pelanggan akan dihapus dari sistem.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'Ya, Hapus'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/pelanggan/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      Swal.fire('Dihapus', result.message, 'success');
      loadPelangganList();
    } catch (err) {
      Swal.fire('Gagal', err.message, 'error');
    }
  }
}

// ========================================================
// 9. REGISTRASI & KELOLA PENGGUNA (ADMIN ONLY)
// ========================================================

async function loadUserList() {
  if (currentUser.Role !== 'administrator') return;

  try {
    const res = await fetch('/api/users');
    const result = await res.json();
    if (!result.success) return;

    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    tbody.innerHTML = result.data.map(u => {
      const isMe = u.UserID === currentUser.UserID;
      const roleBadge = u.Role === 'administrator'
        ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Administrator</span>'
        : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Petugas Kasir</span>';

      return `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="p-3.5 pl-6 font-mono font-bold text-slate-500">#${u.UserID}</td>
          <td class="p-3.5 font-bold text-slate-800">${escapeHtml(u.Username)} ${isMe ? '<span class="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">(Anda)</span>' : ''}</td>
          <td class="p-3.5 text-slate-700">${escapeHtml(u.NamaLengkap)}</td>
          <td class="p-3.5">${roleBadge}</td>
          <td class="p-3.5 text-slate-500 font-mono text-[11px]">${u.CreatedAt || '-'}</td>
          <td class="p-3.5 pr-6 text-right space-x-1">
            <button onclick="editUser(${u.UserID}, '${escapeHtml(u.Username)}', '${escapeHtml(u.NamaLengkap)}', '${u.Role}')" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold transition">
              Edit
            </button>
            ${!isMe ? `
              <button onclick="deleteUser(${u.UserID})" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold transition">
                Hapus
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

function openUserModal() {
  document.getElementById('modalUserTitle').textContent = 'Daftarkan Petugas Baru (Registrasi)';
  document.getElementById('formUserId').value = '';
  document.getElementById('formUserNama').value = '';
  document.getElementById('formUserUsername').value = '';
  document.getElementById('formUserPassword').value = '';
  document.getElementById('formUserPassword').required = true;
  document.getElementById('formUserRole').value = 'petugas';
  document.getElementById('formUserPassHint').classList.add('hidden');
  document.getElementById('modalUser').classList.remove('hidden');
}

function editUser(id, username, namaLengkap, role) {
  document.getElementById('modalUserTitle').textContent = 'Edit Data Pengguna';
  document.getElementById('formUserId').value = id;
  document.getElementById('formUserNama').value = namaLengkap;
  document.getElementById('formUserUsername').value = username;
  document.getElementById('formUserPassword').value = '';
  document.getElementById('formUserPassword').required = false;
  document.getElementById('formUserRole').value = role;
  document.getElementById('formUserPassHint').classList.remove('hidden');
  document.getElementById('modalUser').classList.remove('hidden');
}

async function saveUser(e) {
  e.preventDefault();
  const id = document.getElementById('formUserId').value;
  const payload = {
    NamaLengkap: document.getElementById('formUserNama').value.trim(),
    Username: document.getElementById('formUserUsername').value.trim(),
    Password: document.getElementById('formUserPassword').value,
    Role: document.getElementById('formUserRole').value
  };

  const url = id ? `/api/users/${id}` : '/api/users';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    Swal.fire({ icon: 'success', title: 'Berhasil', text: result.message, timer: 1200, showConfirmButton: false });
    closeModal('modalUser');
    loadUserList();
  } catch (err) {
    Swal.fire('Gagal', err.message, 'error');
  }
}

async function deleteUser(id) {
  const confirm = await Swal.fire({
    title: 'Hapus Akun Pengguna?',
    text: 'Pengguna yang dihapus tidak akan dapat login kembali.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'Ya, Hapus'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      Swal.fire('Dihapus', result.message, 'success');
      loadUserList();
    } catch (err) {
      Swal.fire('Gagal', err.message, 'error');
    }
  }
}

// ========================================================
// 10. LAPORAN PENJUALAN (SEKOMUNIKATIF MUNGKIN)
// ========================================================

function setReportDateRange(type) {
  const today = new Date();
  const toISO = (d) => d.toISOString().split('T')[0];

  const startEl = document.getElementById('laporanStartDate');
  const endEl = document.getElementById('laporanEndDate');

  if (type === 'today') {
    startEl.value = toISO(today);
    endEl.value = toISO(today);
  } else if (type === 'week') {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    startEl.value = toISO(past);
    endEl.value = toISO(today);
  } else if (type === 'month') {
    const past = new Date(today.getFullYear(), today.getMonth(), 1);
    startEl.value = toISO(past);
    endEl.value = toISO(today);
  } else if (type === 'all') {
    startEl.value = '';
    endEl.value = '';
  }

  loadReportData();
}

async function loadReportData() {
  const start = document.getElementById('laporanStartDate')?.value || '';
  const end = document.getElementById('laporanEndDate')?.value || '';

  let query = '';
  if (start && end) query = `?startDate=${start}&endDate=${end}`;
  else if (start) query = `?startDate=${start}`;

  try {
    const res = await fetch(`/api/laporan${query}`);
    const result = await res.json();
    if (!result.success) return;

    currentLaporanData = result.data;
    const { summary, transactions } = result.data;

    // Metrik Card
    document.getElementById('reportOmset').textContent = formatRupiah(summary.TotalPendapatan);
    document.getElementById('reportTransaksi').textContent = `${summary.TotalTransaksi} Transaksi`;
    document.getElementById('reportBarangTerjual').textContent = `${summary.TotalBarangTerjual} Unit`;
    document.getElementById('reportRataRata').textContent = formatRupiah(summary.RataRataTransaksi);

    document.getElementById('reportTableCount').textContent = `Menampilkan ${transactions.length} data transaksi`;

    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    if (transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Tidak ada riwayat transaksi pada rentang tanggal ini.</td></tr>`;
      return;
    }

    tbody.innerHTML = transactions.map(t => `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="p-3.5 pl-6 font-mono font-bold text-slate-800">TRX-${String(t.PenjualanID).padStart(5, '0')}</td>
        <td class="p-3.5 text-slate-600 font-mono">${t.TanggalPenjualan}</td>
        <td class="p-3.5 font-bold text-slate-800">${escapeHtml(t.NamaPelanggan)}</td>
        <td class="p-3.5 text-slate-600">${escapeHtml(t.NamaPetugas)}</td>
        <td class="p-3.5 font-bold text-slate-700">${t.JumlahItem} jenis</td>
        <td class="p-3.5 font-bold text-blue-600">${formatRupiah(t.TotalHarga)}</td>
        <td class="p-3.5 pr-6 text-right space-x-1">
          <button onclick="viewSaleDetail(${t.PenjualanID})" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold transition">
            Lihat Struk
          </button>
          ${currentUser.Role === 'administrator' ? `
            <button onclick="deleteSaleTransaction(${t.PenjualanID})" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold transition">
              Batal
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function viewSaleDetail(id) {
  try {
    const res = await fetch(`/api/penjualan/${id}`);
    const result = await res.json();
    if (result.success && result.data) {
      showReceiptModal(result.data);
    }
  } catch (err) {
    Swal.fire('Error', 'Gagal memuat detail transaksi', 'error');
  }
}

async function deleteSaleTransaction(id) {
  const confirm = await Swal.fire({
    title: 'Batalkan Transaksi?',
    text: 'Transaksi akan dihapus dan stok produk akan dikembalikan secara otomatis!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'Ya, Batalkan'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/penjualan/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      Swal.fire('Berhasil', result.message, 'success');
      loadReportData();
    } catch (err) {
      Swal.fire('Gagal', err.message, 'error');
    }
  }
}

// Cetak Laporan Resmi (Print Formal Mode)
function printFormalReport() {
  if (!currentLaporanData || !currentLaporanData.transactions) {
    Swal.fire('Peringatan', 'Tidak ada data laporan untuk dicetak.', 'warning');
    return;
  }

  const start = document.getElementById('laporanStartDate')?.value || 'Awal';
  const end = document.getElementById('laporanEndDate')?.value || 'Sekarang';
  const { summary, transactions, productSales } = currentLaporanData;

  const area = document.getElementById('formalPrintableReportArea');
  area.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <!-- Kop Surat Resmi -->
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">LAPORAN PENJUALAN KASIR</h2>
        <h3 style="margin: 4px 0; font-size: 15px;">UJI KOMPETENSI KEAHLIAN (UKK) REKAYASA PERANGKAT LUNAK</h3>
        <p style="margin: 2px 0; font-size: 12px;">Periode Laporan: <b>${start} s/d ${end}</b></p>
      </div>

      <!-- Ringkasan Statistik Laporan -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <tr>
          <td style="padding: 6px; border: 1px solid #ccc; background: #f8fafc;"><b>Total Omset / Pendapatan:</b></td>
          <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; color: #1d4ed8;">${formatRupiah(summary.TotalPendapatan)}</td>
          <td style="padding: 6px; border: 1px solid #ccc; background: #f8fafc;"><b>Total Transaksi:</b></td>
          <td style="padding: 6px; border: 1px solid #ccc;">${summary.TotalTransaksi} Transaksi</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #ccc; background: #f8fafc;"><b>Total Barang Terjual:</b></td>
          <td style="padding: 6px; border: 1px solid #ccc;">${summary.TotalBarangTerjual} Unit</td>
          <td style="padding: 6px; border: 1px solid #ccc; background: #f8fafc;"><b>Rata-rata Penjualan:</b></td>
          <td style="padding: 6px; border: 1px solid #ccc;">${formatRupiah(summary.RataRataTransaksi)}</td>
        </tr>
      </table>

      <!-- Tabel Rincian Transaksi -->
      <h4 style="font-size: 13px; margin: 12px 0 6px 0;">1. Rincian Riwayat Transaksi Penjualan</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <thead>
          <tr style="background: #e2e8f0;">
            <th style="border: 1px solid #cbd5e1; padding: 6px;">No</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">No. Faktur</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Tanggal</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Nama Pelanggan</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Petugas Kasir</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Total Belanja</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map((t, idx) => `
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px;">TRX-${String(t.PenjualanID).padStart(5, '0')}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px;">${t.TanggalPenjualan}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px;">${escapeHtml(t.NamaPelanggan)}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px;">${escapeHtml(t.NamaPetugas)}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: bold;">${formatRupiah(t.TotalHarga)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Tabel Rincian Produk Terjual -->
      <h4 style="font-size: 13px; margin: 12px 0 6px 0;">2. Rincian Akumulasi Produk Terjual</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px;">
        <thead>
          <tr style="background: #e2e8f0;">
            <th style="border: 1px solid #cbd5e1; padding: 6px;">No</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Nama Produk</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Harga Satuan</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Total Terjual</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px;">Subtotal Nilai</th>
          </tr>
        </thead>
        <tbody>
          ${productSales.map((p, idx) => `
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px;">${escapeHtml(p.NamaProduk)}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right;">${formatRupiah(p.Harga)}</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-weight: bold;">${p.TotalTerjual} Unit</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-weight: bold;">${formatRupiah(p.TotalNilai)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Lembar Pengesahan / Tanda Tangan -->
      <table style="width: 100%; border: none; font-size: 12px; margin-top: 40px;">
        <tr>
          <td style="width: 50%; text-align: center;">
            <p>Mengetahui,</p>
            <p><b>Penguji / Asesor Uji Kompetensi</b></p>
            <br><br><br>
            <p>( .................................................... )</p>
          </td>
          <td style="width: 50%; text-align: center;">
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID')}</p>
            <p><b>Petugas Kasir / Peserta Ujian</b></p>
            <br><br><br>
            <p>( <b>${escapeHtml(currentUser.NamaLengkap || currentUser.Username)}</b> )</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  document.body.classList.add('printing-report');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-report');
  }, 1000);
}

// Export CSV
function exportReportCSV() {
  if (!currentLaporanData || !currentLaporanData.transactions || currentLaporanData.transactions.length === 0) {
    Swal.fire('Info', 'Tidak ada data transaksi untuk diekspor.', 'info');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'No Faktur,Tanggal,Pelanggan,Petugas Kasir,Jumlah Item,Total Tagihan\n';

  currentLaporanData.transactions.forEach(t => {
    const row = [
      `TRX-${String(t.PenjualanID).padStart(5, '0')}`,
      t.TanggalPenjualan,
      `"${(t.NamaPelanggan || '').replace(/"/g, '""')}"`,
      `"${(t.NamaPetugas || '').replace(/"/g, '""')}"`,
      t.JumlahItem,
      t.TotalHarga
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Laporan_Penjualan_UKK_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ========================================================
// 11. GENERAL HELPERS & MODAL HANDLER
// ========================================================

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
