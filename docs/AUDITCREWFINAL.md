# Analisis Operasional KRUNCUY — Crew Module

> **Peran:** Product Owner / ERP Consultant / Operations Manager / UX Designer / Business Analyst
> **Bisnis:** Tahu Walik KRUNCUY — Multi Outlet F&B
> **Tanggal:** 9 Juni 2026

---

## Daftar Isi

1. Simulasi Harian Crew
2. Analisis Operasional
3. 50+ Skenario Khusus
4. Konflik Owner vs Crew
5. Beban Kerja Crew
6. Fitur Prioritas

---

# 1. SIMULASI HARIAN CREW

## 06:30 — Crew Bangun Pagi

Cek HP. Ada notifikasi dari sistem? Shift hari ini di outlet mana? (Crew bisa dipindah-pindah outlet, jadi harus tahu tugas hari ini).

**Sistem harus kirim notifikasi:** "Hari ini kamu tugas di KRUNCUY Gondokusuman. Shift: 07:00-16:00."

---

## 06:45 — Crew Siap Berangkat

Cek stok di HP. Tahu Pong tinggal 20 pcs? Nanti perlu minta transfer dari depo.

**Sistem sudah tunjukkan:** "Stok Tahu Pong: 20 pcs — MENIPIS. Minta transfer?"

---

## 07:00 — Sampai Outlet

**Aktivitas:**
1. Buka outlet, nyalakan alat
2. Buka HP → Login (pakai sidik jari / PIN — jangan pakai password panjang)
3. **Absensi Masuk** (1 tap)
4. **Opening Stock Opname** → Hitung fisik: berapa Tahu Pong, Adonan, Minyak, Gas (4 item — < 2 menit)
5. **Buka Shift** (1 tap — sistem auto hitung opening cash dari sisa kemarin)

**Target: 3 menit sejak HP dinyalakan.**

---

## 07:00-10:00 — Sepi Pagi

**Crew melakukan:**
- Menggoreng, menata barang
- Melayani pembeli offline
- **Cek stok** — kalau ada yang hampir habis, sistem kasih tahu
- **Terima barang** dari depo (kalau ada jadwal kirim pagi)

**Sistem:**
- Mencatat otomatis setiap transaksi (crew hanya tap produk + jumlah)
- Menampilkan stok real-time
- Menampilkan total penjualan

---

## 10:00-13:00 — Jam Sibuk (Makan Siang)

**Crew Fokus Jualan.**
- POS: tap produk → pilih qty → pilih pembayaran (cash/QRIS) → selesai
- **Tidak ada** input stok, tidak ada administrasi, tidak ada laporan.
- GoFood/GrabFood masuk otomatis dari tablet.

**Sistem:**
- POS harus sangat cepat. Maksimal 3 tap.
- Tidak boleh ada loading di jam sibuk.

---

## 13:00-14:00 — Sepsi Siang

**Crew bisa:**
- Istirahat
- Cek HP: "Total penjualan hari ini Rp 450.000. Cash di tangan Rp 300.000."
- Kalau ada **pembelian darurat** (minyak habis), input sekarang.
- Kalau ada **barang retur**, input sekarang.

---

## 14:00-16:00 — Sore

- Melayani pembeli
- **Cek setoran:** Cash di tangan sudah Rp 800.000. Petty cash Rp 50.000. Setoran belum diambil Rp 750.000.
- Manajemen datang ambil setoran? → Generate OTP → cash diserahkan → OTP diverifikasi → selesai.

---

## 16:00 — Persiapan Tutup

1. **Closing Stock Opname** (4 item — < 2 menit)
2. **Cek pengeluaran** — ada pembelian darurat? Kalau ada, pastikan sudah masuk.
3. **Input cash aktual** — hitung fisik, berapa sisa cash di laci?
4. **Tutup Shift** (sistem hitung expected cash, bandingkan dengan aktual)
5. **Absensi Pulang**

**Target: 5 menit sejak mulai closing.**

---

## 16:15 — Pulang

Sistem kirim ringkasan harian ke HP:
```
KRUNCUY Gondokusuman — Ringkasan Hari Ini
🟢 Shift selesai
💰 Penjualan: Rp 850.000
📦 Stok: Tahu Pong sisa 80 pcs
🎯 Bonus hari ini: Rp 2.500
```

---

# 2. ANALISIS OPERASIONAL

## ✅ Yang Bisa Dilakukan Crew

| Aktivitas | Waktu | Wajib? | Catatan |
|-----------|-------|--------|---------|
| Buka shift | < 30 detik | ✅ Wajib | Tanpa ini tidak bisa jualan |
| Absen masuk | < 10 detik | ✅ Wajib | Otomatis saat buka shift |
| Transaksi POS | 3-10 detik | ✅ Wajib | Tap produk → pilih qty → bayar |
| Stok opname buka | < 2 menit | ✅ Wajib | 4 item utama |
| Stok opname tutup | < 2 menit | ✅ Wajib | 4 item utama |
| Cek stok | < 10 detik | ❌ Opsional | Lihat stok saja |
| Cek penjualan | < 10 detik | ❌ Opsional | Lihat angka hari ini |
| Cek bonus | < 10 detik | ❌ Opsional | Lihat estimasi |
| Terima barang | < 30 detik | ✅ Wajib | Cocok + konfirmasi |
| Retur barang | < 30 detik | ❌ Opsional | Kalau ada barang rusak |
| Pembelian darurat | < 30 detik | ❌ Opsional | Kalau ada |
| Setujui penarikan cash | < 15 detik | ✅ Wajib | Generate OTP |
| Tutup shift | < 2 menit | ✅ Wajib | Closing opname + review cash |
| Absen pulang | < 10 detik | ✅ Wajib | Otomatis saat tutup shift |

## ✅ Yang Wajib Dilakukan Crew (SETIAP HARI)

1. **Absen masuk** — bukti kehadiran
2. **Buka shift** — syarat mulai operasional
3. **Stock opname opening** — 4 item, syarat buka shift
4. **Transaksi via POS** — semua penjualan harus tercatat
5. **Stock opname closing** — 4 item, syarat tutup shift
6. **Tutup shift** — akhir operasional
7. **Absen pulang** — bukti pulang

**Total waktu wajib per hari: ~5 menit.** (Di luar waktu jualan)

## ❌ Yang TIDAK BISA Dilakukan Crew

| Aktivitas | Alasan |
|-----------|--------|
| Melihat bonus crew lain | Privasi |
| Melihat penjualan outlet lain | Privasi outlet |
| Melihat data owner/manager | Tidak relevan |
| Mengubah harga produk | Fraud risk |
| Void transaksi tanpa alasan | Fraud risk |
| Menghapus transaksi | Fraud risk |
| Akses pengaturan sistem | Security |
| Akses data master produk | Security |
| Melihat laporan keuangan | Security |
| Menyetujui pembelian besar > X nominal | Financial control |
| Membuat PO ke supplier | Purchasing wewenang |
| Mengubah role/password user lain | Security |

## ❌ Yang TIDAK SEHARUSNYA Dilakukan Crew

| Aktivitas | Masalah | Solusi Sistem |
|-----------|---------|--------------|
| Input ulang data stok | Buang waktu + rawan salah | Hitung otomatis dari transaksi |
| Input ulang data penjualan | Buang waktu | Hitung otomatis dari POS |
| Hitung bonus manual | Rawan konflik | Hitung otomatis |
| Input nama barang panjang-panjang | Buang waktu | Pilih dari dropdown |
| Input harga barang | Rawan salah | Pakai harga default/master |
| Input data akuntansi | Crew bukan akuntan | Jangan tampilkan |
| Mencari data di banyak halaman | Buang waktu | Satu dashboard |
| Membaca laporan kompleks | Crew bukan analis | Ringkasan 3 detik |
| Memori hafalan SOP | Lupa + salah | Bimbingan di aplikasi |

---

# 3. 50+ SKENARIO KHUSUS

## ⏰ Shift & Kehadiran

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 1 | Crew terlambat datang | ✅ | Catat waktu check-in. Label "TERLAMBAT". Kirim notif owner | Crew |
| 2 | Crew lupa buka shift | ✅ | Di jam 7:30 kirim notif "Shift belum dibuka". Owner juga terima notif | Crew + Owner |
| 3 | Crew lupa tutup shift | ✅ | Jam 16:30 notif "Shift belum ditutup". Pukul 17:00 notif ke owner | Crew + Owner |
| 4 | Crew lupa absen pulang | ✅ | Otomatis tercatat saat tutup shift | Sistem |
| 5 | Crew tidak masuk tanpa kabar | ✅ | Absensi kosong → owner dapat notif | Owner + Crew |
| 6 | Crew minta izin mendadak | ❌ (SOP) | Telepon owner. Owner atur shift manual | Owner |
| 7 | Crew pindah outlet besok | ❌ (SOP) | Owner atur Branch Assignment. Notif ke crew | Owner |
| 8 | Dua crew satu outlet shift beda | ✅ | Multiple session per branch. Absen masing-masing | Crew + Sistem |
| 9 | Crew jaga 2 outlet sehari | ✅ | Bisa close shift outlet A → open shift outlet B | Crew |

## 🔌 Teknis

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 10 | HP crew mati | ❌ | Harus punya backup device/catatan manual. Input nanti | Crew |
| 11 | Internet mati | ⚠️ Belum | POS offline musti bisa jalan dulu. Data sync saat online | Crew + Sistem |
| 12 | QRIS gagal | ✅ | Cash sebagai fallback. Transaksi tetap jalan | Crew + Sistem |
| 13 | Server down | ❌ | Tidak bisa transaksi. Backup manual | Owner/IT |
| 14 | Aplikasi crash | ⚠️ Belum | Relogin. Data harus aman | Crew |
| 15 | Baterai HP habis | ❌ | Power bank. Crew wajib bawa charger | Crew |
| 16 | Update aplikasi | ✅ | Notif. Update bisa ditunda | Crew |

## 📦 Stok & Barang

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 17 | Stok hampir habis | ✅ | Notif saat stok < 20%. Otomatis usul transfer | Sistem |
| 18 | Minyak habis jam ramai | ✅ | Pembelian darurat via HP. Input 30 detik | Crew |
| 19 | Gas habis saat masak | ✅ | Pembelian darurat | Crew |
| 20 | Tahu Pong dari supplier jelek | ❌ (SOP) | Retur barang. Catat di sistem | Crew |
| 21 | Barang transfer kurang | ✅ | Crew konfirmasi "Kurang X qty". Notif ke depo | Crew + Depo |
| 22 | Barang transfer lebih | ✅ | Crew konfirmasi "Lebih X qty". Notif ke depo | Crew + Depo |
| 23 | Barang transfer salah jenis | ✅ | Retur barang. Kirim balik | Crew |
| 24 | Stok opname selisih besar | ✅ | Variance > 20% trigger notif ke owner | Sistem + Owner |
| 25 | Ada barang expired | ✅ | Retur barang ke depo | Crew |
| 26 | Stok awal 0 (new outlet) | ✅ | Opening stock opname 0. Bisa buka shift | Crew |

## 💰 Cash & Keuangan

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 27 | Cash fisik tidak cocok dengan sistem | ✅ | Selisih dicatat. Owner dapat notif. Investigasi | Crew + Owner |
| 28 | Cash belum diambil 5 hari | ✅ | Notif ke owner "Setoran Rp X belum diambil" | Owner |
| 29 | Cash di outlet Rp 0 tapi sistem Rp 50.000 | ✅ | Variance negatif. Trigger investigasi | Owner |
| 30 | Crew pinjam cash outlet | ❌ (SOP) | Tidak boleh. Kalau terlanjur, hitung sebagai withdrawal | Owner + Crew |
| 31 | Uang palsu | ❌ (SOP) | Bukan tanggung jawab sistem | Crew |
| 32 | Pembelian darurat tidak ada struk | ✅ | Boleh input manual, tapi label "TANPA STRUK" | Crew |
| 33 | Owner minta setoran sebagian | ✅ | Withdrawal parsial. Sistem catat dengan benar | Owner + Crew |
| 34 | Crew ganti uang receh ke warung sebelah | ❌ (SOP) | Di luar sistem. Tidak perlu dicatat | Crew |

## 🎯 Bonus & Performa

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 35 | Bonus salah hitung | ✅ | Sistem hitung otomatis dari PCS. Owner review | Owner |
| 36 | Crew tanya "Bonus saya berapa?" | ✅ | Buka HP → Performa Saya → lihat estimasi | Crew |
| 37 | Bonus tidak dibayar bulan ini | ✅ | Status "Belum Dibayarkan". Owner atur payroll | Owner |
| 38 | Crew merasa PCS nya kurang | ✅ | Detail per transaksi bisa dilihat | Crew + Owner |
| 39 | Target bonus berubah tengah bulan | ✅ | System setting. Owner ubah kapan saja | Owner |

## 🔄 Retur & Waste

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 40 | Barang retur ditolak depo | ❌ (SOP) | Depo tolak via sistem. Crew lihat status | Crew + Depo |
| 41 | Waste lebih dari target | ✅ | Waste > 20% trigger notif owner | Sistem |
| 42 | Crew buang minyak goreng kotor | ✅ | Catat waste via operasional | Crew |
| 43 | Adonan basi harus dibuang | ✅ | Catat waste dengan alasan | Crew |

## 👥 Multiuser & Role

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 44 | Owner ingin lihat performa semua outlet | ✅ | ERP Dashboard. Pilih branch filter | Owner |
| 45 | Owner ingin audit transaksi crew kemarin | ✅ | ERP → Transactions | Owner |
| 46 | Manager ingin setor cash ke bank | ✅ | Buat withdrawal via ERP → Crew approve OTP | Manager + Crew |
| 47 | Crew minta bonus dibayar mingguan | ❌ (SOP) | Kebijakan perusahaan. Sistem ikut aturan | Owner |
| 48 | Crew resign | ✅ | Nonaktifkan user. Reassign ke crew baru | Owner |

## ⚠️ Darurat & Exception

| # | Skenario | Sistem Handle? | Alur | PIC |
|---|----------|---------------|------|-----|
| 49 | Kebakaran outlet | ❌ (SOP) | Tutup shift darurat. Catat final cash | Crew + Owner |
| 50 | Banjir | ❌ (SOP) | Tutup shift darurat | Crew + Owner |
| 51 | HP crew jatuh/rusak | ❌ (SOP) | Login via HP lain. Ganti device | Crew + Owner |
| 52 | Crew sakit di tengah shift | ✅ | Close shift paksa. Absen pulang lebih awal | Crew |
| 53 | Ada pemeriksaan/pajak | ❌ (SOP) | Export data laporan dari ERP | Owner |

---

# 4. KONFLIK OWNER VS CREW

## 💰 Cash

| Konflik | Penyebab | Dampak | Solusi Sistem | Solusi SOP |
|---------|----------|--------|--------------|------------|
| Cash fisik kurang dari sistem | Crew lupa catat pengeluaran, atau kesalahan hitung | Crew dianggap mengambil uang | Wajib input SEMUA pengeluaran via sistem. Selisih dicatat transparan | Investigasi bersama. Rekam CCTV |
| Cash fisik lebih dari sistem | Lupa catat penjualan, atau ada uang luar | Kelihatan untung tapi salah data | Wajib semua transaksi via POS. Selisih positif juga dicatat | Cross-check dengan stok |
| Crew merasa setoran terlalu besar | Owner minta setor tapi tidak sesuai perhitungan | Crew merasa tidak adil | Setoran via Withdrawal terstruktur. Ada OTP. Tidak bisa asal minta | Perhitungan transparan: Opening + Sales - Expense - Withdrawal = Expected |
| Petty cash hilang | Tidak ada pencatatan petty cash terpisah | Cash outlet berkurang | Sistem pisahkan Petty Cash (Rp50.000) dari Setoran Belum Diambil | Pisah fisik. Amplop terpisah |
| Crew pinjam cash outlet | Darurat pribadi | Cash outlet kurang | Hitung sebagai withdrawal paksa. Harus OTP | Tidak boleh. Sanksi |

## 🎯 Bonus

| Konflik | Penyebab | Dampak | Solusi Sistem | Solusi SOP |
|---------|----------|--------|--------------|------------|
| Bonus tidak sesuai PCS | Salah input qty di POS, atau lupa scan | Crew rugi | Wajib scan setiap produk. Hitungan PCS dari POS, bukan manual | Audit transaksi harian |
| Crew jual tanpa POS | Biar cepat, tapi tidak tercatat | Bonus kurang, cash outlet tidak cocok | POS wajib untuk semua transaksi. Tanpa POS = tanpa penjualan | CCTV + sanksi |
| Target bonus berubah seenaknya | Owner ubah target tengah bulan | Crew kehilangan motivasi | Target di system setting. Riwayat perubahan tercatat. Owner harus konsisten | Komunikasikan perubahan di awal bulan |
| Extra saos tidak terhitung | Tidak ada kategori extra saos di POS | Bonus saos tidak dibayar | POS harus punya opsi "Extra Saos" | Wajib pilih extra saos di POS |

## 📋 Absensi

| Konflik | Penyebab | Dampak | Solusi Sistem | Solusi SOP |
|---------|----------|--------|--------------|------------|
| Crew minta dianggap hadir padahal tidak | Sakit tapi tidak ada surat | Crew lain tidak adil | Check-in wajib via HP. Lokasi tervalidasi | Surat sakit untuk izin |
| Crew check-in dari rumah | Biar dianggap hadir | Absensi palsu | Cek lokasi check-in. Kalau jauh dari outlet, flag "remote" | Verifikasi oleh owner |
| Lupa check-out | Tidak teliti | Perhitungan jam kerja salah | Auto check-out saat shift ditutup | Briefing pagi |

## 📦 Stok

| Konflik | Penyebab | Dampak | Solusi Sistem | Solusi SOP |
|---------|----------|--------|--------------|------------|
| Stok opname tidak akurat | Crew asal hitung, buru-buru | Stok tidak cocok | Wajib 4 item. Waktu < 2 menit | Sanksi kalau asal |
| Stok transfer tidak sesuai | Depo kirim kurang/lebih | Crew repot konfirmasi | Cocokkan otomatis dengan transfer. Variance dicatat | Depo harus akurat |
| Waste tidak dicatat | Barang rusak dibuang tanpa laporan | Stok berkurang misterius | Wajib catat waste. Alasan wajib | Sanksi |

---

# 5. BEBAN KERJA CREW

## Keep (Proses sudah efisien)

| Aktivitas | Waktu | Kenapa Keep |
|-----------|-------|-------------|
| Transaksi POS | 3-10 detik | Fungsi utama. Tidak bisa diotomatisasi |
| Cek stok | 5 detik | Penting untuk operasional |
| Cek bonus harian | 5 detik | Transparan, motivasi |
| Buka shift | 15 detik | 1 tap. Syarat operasional |
| Generate OTP | 15 detik | Security |

## Simplify (Proses terlalu kompleks)

| Aktivitas | Waktu | Masalah | Solusi |
|-----------|-------|---------|--------|
| **Input counted stock opname** | 2 menit | Crew lelah, asal input | Auto-hitung dari transaksi. Crew hanya konfirmasi |
| **Cash review saat tutup shift** | 1 menit | Crew harus hafal rumus expected cash | Tampilkan "Expected cash: Rp X. Cash fisik: input" — sederhana |
| **Cari menu di POS** | 10 detik | Menu > 7 item, perlu scroll | Kategori tab + search. Favorit di atas |
| **Input pembelian darurat** | 30 detik | Nama barang harus diketik | Dropdown item yang umum dibeli (minyak, gas, tissue, sabun). Pilih aja |

## Automate (Sistem harus otomatis)

| Aktivitas | Waktu | Dampak Otomatisasi |
|-----------|-------|-------------------|
| **Hitung penjualan harian** | 0 | ✅ SUDAH |
| **Hitung bonus** | 0 | ✅ SUDAH |
| **Hitung sisa cash** | 0 | ✅ SUDAH |
| **Hitung stok (dari transaksi)** | 0 | ✅ SUDAH — stok berkurang otomatis dari penjualan |
| **Hitung expected cash saat tutup shift** | 0 | ✅ SUDAH |
| **Carry-over opening balance** | 0 | ✅ SUDAH FIX |
| **Notifikasi stok menipis** | 0 | ⬜ PERLU — belum ada push notif |
| **Kirim ringkasan harian** | 0 | ⬜ PERLU — belum ada |
| **Sinkronisasi offline-online** | 0 | ⬜ PERLU — POS belum offline |
| **Rekomendasi transfer stok** | 0 | ⬜ NICE TO HAVE |

## Remove (Hapus atau pindahkan ke owner)

| Aktivitas | Alasan | Pindah ke |
|-----------|--------|-----------|
| **Input data supplier** | Tidak relevan untuk crew | Owner/ERP |
| **Input harga produk** | Wewenang owner | Owner/ERP |
| **Approve PO** | Bukan tugas crew | Purchasing |
| **Laporan akuntansi** | Crew bukan akuntan | Owner/ERP |
| **Data master (kategori, unit, dll)** | Bukan tugas crew | Owner/ERP |
| **Pengaturan sistem** | Security | Owner/ERP |

---

# 6. FITUR PRIORITAS

## 🔴 Critical

| Fitur | Alasan |
|-------|--------|
| **POS Offline** | Internet mati → crew tidak bisa jualan → outlet tutup rugi. PRIORITAS #1 |
| **Carry-over opening cash** | ✅ SUDAH FIX. Saldo lama tidak hilang |
| **Expected cash akurat** | ✅ SUDAH FIX. Termasuk withdrawal |
| **Notifikasi stok menipis** | Cegah kehabisan stok jam sibuk |
| **OTP withdrawal** | ✅ SUDAH. OTP by crew, verify by owner |
| **Sync permission untuk fitur baru** | ✅ SUDAH |

## 🟠 Important

| Fitur | Alasan |
|-------|--------|
| **Dashboard ringkasan harian** | ✅ SUDAH. CrewHomePage |
| **Petty cash terpisah** | ✅ SUDAH. Rp50.000 default |
| **Setoran belum diambil** | ✅ SUDAH. Label jelas |
| **Bonus "Belum Dibayarkan"** | ✅ SUDAH. Tidak dianggap saldo |
| **Notifikasi tutup shift** | Cegah lupa tutup shift |
| **Ringkasan harian otomatis** | Informasi crew tanpa buka aplikasi |
| **Riwayat performa detail** | ✅ SUDAH. CrewPerformancePage |
| **Multi-tab operasional** | ✅ SUDAH. CrewOperationalPage |

## 🔵 Nice To Have

| Fitur | Alasan |
|-------|--------|
| **POS offline** | Paling kritis untuk operasional |
| **Lokasi check-in** | Verifikasi crew benar di outlet |
| **Foto bukti pembelian** | Verifikasi pengeluaran |
| **Notifikasi ke owner** | Crew tutup shift → owner dapat laporan |
| **Export absensi harian** | Untuk payroll |
| **QR code scan untuk stok opname** | Cepet, tinggal scan barcode |
| **Dark mode** | Biar enak di HP malam hari |

---

## KESIMPULAN

### Apa yang sudah benar di sistem saat ini

1. ✅ **POS** — Cepat. Kategori tab. Pilih produk → qty → bayar
2. ✅ **Stok opname** — 7 item. Opening/Closing. Hitung variance
3. ✅ **Cash flow** — Opening cash carry-over. Expected cash akurat. Withdrawal OTP
4. ✅ **Bonus** — Otomatis dari PCS. "Belum Dibayarkan" label jelas
5. ✅ **Setoran** — Petty cash terpisah. Setoran belum diambil jelas
6. ✅ **Operasional** — Terima barang, retur, pembelian darurat dalam satu halaman
7. ✅ **Performa** — Kalender, detail harian, statistik

### Yang perlu dibangun segera

1. ⬜ **POS Offline Mode** — Jika internet mati, POS harus tetap jalan. Data simpan lokal. Sinkronisasi otomatis saat online. **Ini paling kritis.**
2. ⬜ **Notifikasi Push** — Stok menipis, shift belum dibuka, setoran belum diambil, tutup shift
3. ⬜ **Ringkasan harian** — Kirim ke HP crew + owner setelah shift tutup

### Yang tidak perlu dilakukan

1. ❌ Jangan tambah input stok manual — sudah otomatis dari transaksi
2. ❌ Jangan tambah laporan ke crew — crew bukan akuntan
3. ❌ Jangan tambah approval berlapis — operasional harus cepat
4. ❌ Jangan ganti bahasa ke Inggris — crew Indonesia, pake Bahasa Indonesia
5. ❌ Jangan tambah grafik rumit — crew perlu angka, bukan analisis

---

> *"Seorang crew outlet tahu walik bekerja 9 jam sehari, berdiri, menggoreng, melayani pembeli, dan sudah lelah ketika tutup outlet."*
>
> Sistem yang baik adalah yang membuat crew bisa pulang 5 menit lebih cepat. Bukan yang membuat mereka betah di aplikasi.
