# CREW POS GO-LIVE MASTER PLAN

> **Product Manager:** POS F&B — Multi Outlet Operations Director
> **Target:** 1 → 3 → 10 → 50 Outlet
> **Prinsip:** Scalable. Sederhana. Anti Fraud. Mobile First.

---

## BAGIAN 1 — RE-EVALUATE EVERYTHING

### Asumsi Yang Saya Challenge

| Asumsi Yang Ada | Challenge | Keputusan |
|-----------------|-----------|-----------|
| "Crew butuh banyak form" | ❌ Tidak. Crew sibuk. Makin sedikit input, makin baik. | Setiap form >3 field harus dijustifikasi. |
| "Semua harus tercatat di database" | ❌ Tidak. Crew akan malas mencatat. Data tidak akurat. | Hanya data yang BISA diverifikasi yang wajib. Self-report tanpa verifikasi = sampah. |
| "Owner perlu real-time" | ❌ Tidak. Owner cukup tahu hari ini outlet berjalan normal atau tidak. | Exception-based monitoring. Bukan real-time streaming. |
| "Semua transaksi butuh approval" | ❌ Tidak. Approval untuk anomali, bukan untuk transaksi normal. | Auto-approve threshold untuk expense & void kecil. |
| "Crew bisa diandalkan mencatat" | ❌ Tidak. Crew akan lupa, salah, atau sengaja tidak mencatat. | Sistem harus mencatat otomatis sebanyak mungkin. Manual = riskan. |

### Prinsip Final

1. **Crew adalah user utama.** Bukan owner. Bukan admin. Bukan akuntan.
2. **Waktu crew berharga.** Jangan buang waktu mereka dengan form tidak berguna.
3. **Data yang tidak diverifikasi = sampah.** Hanya kumpulkan data yang bisa dicek.
4. **Otomatis > manual.** Sistem harus mencatat sendiri. Crew cukup konfirmasi.
5. **Exception > report.** Owner cukup lihat yang salah, bukan semua yang benar.
6. **Fraud prevention bukan fraud detection.** Cegah sebelum terjadi, bukan setelah terlanjur.

---

## BAGIAN 2 — THE IDEAL OUTLET OPERATING SYSTEM

### Workflow Final

```
┌──────────────────────────────────────────────────────────────────┐
│ CREW DATANG (5 menit)                                            │
│                                                                  │
│ 1. Login — 1 tap (bio/FaceID) atau 3 detik (password)           │
│ 2. Lihat target hari ini di dashboard                            │
│ 3. Pre-opening checklist (wajib, < 2 menit):                     │
│    ☐ Kebersihan outlet OK                                        │
│    ☐ Stok bahan utama cukup                                      │
│    ☐ Peralatan POS berfungsi                                     │
│                                                                  │
│ Output: Checklist selesai                                        │
│ Risiko dicegah: Outlet buka dalam kondisi kotor/stok kosong      │
├──────────────────────────────────────────────────────────────────┤
│ OPEN SHIFT (30 detik)                                            │
│                                                                  │
│ 4. Jika >1 branch → pilih branch (1 tap)                         │
│ 5. Buka shift — GPS otomatis (jika diwajibkan owner)             │
│ 6. Redirect otomatis ke POS                                      │
│                                                                  │
│ Output: CashSession OPEN                                         │
│ Risiko dicegah: Crew jualan tanpa shift → transaksi tidak sah    │
├──────────────────────────────────────────────────────────────────┤
│ SELLING PERIOD                                                   │
│                                                                  │
│ 7. POS (default offline) → scan/pilih produk → bayar → selesai   │
│ 8. Online order → tap "Online" → pilih platform → input → done   │
│ 9. Void (jika perlu) → reason pilihan → approval jika > threshold│
│                                                                  │
│ Output: Transaction COMPLETED / VOID                              │
│ Risiko dicegah: Transaksi tidak tercatat, fraud void              │
├──────────────────────────────────────────────────────────────────┤
│ OPERATIONAL EVENTS                                                │
│                                                                  │
│ 10. Terima barang dari depo → 1 tap approve → stock +            │
│ 11. Belanja outlet → pilih item → foto → submit                  │
│ 12. Event usage → pilih jenis (gas/oil/dough) → qty → otomatis   │
│     kurangi stok                                                  │
│ 13. Waste → pilih item + kategori (produksi/kadaluarsa/rusak)     │
│                                                                  │
│ Output: Semua tercatat di InventoryMovement                       │
│ Risiko dicegah: Material tidak terrecord, waste tidak terkontrol  │
├──────────────────────────────────────────────────────────────────┤
│ CASH HANDLING                                                     │
│                                                                  │
│ 14. Cash withdrawal → request → OTP → owner ambil → selesai      │
│ 15. Expense → submit (auto-approve jika ≤ threshold)             │
│                                                                  │
│ Output: CashWithdrawal / OutletExpense tercatat                   │
│ Risiko dicegah: Cash hilang, expense fiktif                       │
├──────────────────────────────────────────────────────────────────┤
│ CLOSING (10 menit)                                               │
│                                                                  │
│ 16. Closing stock opname (wajib) — input fisik → variance        │
│ 17. Hitung cash fisik → input → sistem hitung expected →         │
│     variance → catat alasan jika ≠ 0                             │
│ 18. Tutup shift → summary → shift CLOSED                         │
│ 19. Checklist tutup outlet (wajib)                                │
│                                                                  │
│ Output: Shift CLOSED, semua variance tercatat                    │
│ Risiko dicegah: Stock tidak akurat, cash tidak balance            │
├──────────────────────────────────────────────────────────────────┤
│ OWNER REVIEW (keesokan hari, 5 menit)                            │
│                                                                  │
│ 20. Buka dashboard → lihat exception:                            │
│     - Outlet dengan variance cash > 0                            │
│     - Outlet dengan variance stock > 5%                          │
│     - Void > threshold                                           │
│     - Expense tanpa foto                                         │
│     - Stock opname tidak dilakukan                                │
│ 21. Approve/reject pending items                                  │
│                                                                  │
│ Output: Owner tahu outlet mana yang bermasalah                   │
│ Risiko dicegah: Fraud tidak terdeteksi                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## BAGIAN 3 — CREW EXPERIENCE REDESIGN

### Yang Harus Dihapus ❌

| Item | Alasan |
|------|--------|
| **"isPurchasable", "POSTED", "REQUESTED"** dari UI | Istilah teknis — crew tidak paham |
| **"Setoran Belum Diambil"** | Ganti dengan "Uang Lebih" — lebih jelas |
| **"Primary/Secondary" di assignment** | Tidak perlu — crew cukup punya akses ke branch |
| **Step "channel" di POS offline** | Default offline — online sebagai toggle |
| **URL foto expense** | Hanya camera — hapus input URL |
| **Status "DRAFT" untuk expense** | Crew cukup lihat "terkirim" atau "disetujui" |
| **Tabel "type" di ManagementTable** | Tidak perlu untuk operasional |

### Yang Harus Disederhanakan ✂️

| Sebelum | Sesudah |
|---------|---------|
| 4 tab di Operasional (Terima, Retur, Beli, Kejadian) | 3 tab (Terima, Catat, Beli) — Retur digabung ke Catat |
| Label "Cash awal outlet" + "Penjualan tunai" + "Penarikan" | Satu card "Ringkasan Cash" — besar, jelas, 3 baris |
| Modal pilih branch → pilih → submit | 1 tap langsung |
| Stock opname → pilih kind (OPENING/CLOSING) | Otomatis: opening = sebelum shift, closing = sebelum tutup |

### Yang Harus Jadi Default Action 🎯

| Halaman | Default Action |
|---------|---------------|
| CrewHomePage (shift aktif) | Tombol POS paling besar, paling atas |
| CrewHomePage (shift closed) | Tombol Buka Shift paling besar |
| POS (default) | OFFLINE mode — online sebagai toggle kecil |
| Operasional → Beli | Camera langsung terbuka (HP) |

### Flow Navigasi Ideal

```
Beranda ─────┬── POS (1 tap)
             ├── Setoran Cash (2 tap)
             ├── Operasional (2 tap)
             ├── Performa Saya (2 tap)
             └── Stok Outlet (2 tap)
```

Bottom nav 5 item — tidak lebih. Masing-masing icon + label pendek.

---

## BAGIAN 4 — FRAUD RESISTANCE MODEL

### Cash Fraud

| Skenario | Risiko | Pencegahan | Status |
|----------|--------|------------|--------|
| Crew void transaksi, ambil cash | 🔴 Critical | Wajib reason + approval untuk void > threshold | ❌ Belum |
| Crew buat expense fiktif | 🟡 High | Foto struk + approval owner | ✅ |
| Crew setor cash tanpa OTP | 🔴 Critical | OTP + rate limit + audit trail | ✅ |
| Crew tidak setor cash | 🟡 High | Expected cash vs actual cash — variance langsung kelihatan | ✅ |
| Crew double setor | 🟡 High | OTP sekali pakai | ✅ |
| Crew setor lebih kecil dari nominal | 🔴 Critical | OTP verify + amount match | ✅ |
| Crew close shift tanpa hitung cash | 🟡 Medium | Warning variance, wajib catat alasan | ✅ |

### Stock Fraud

| Skenario | Risiko | Pencegahan | Status |
|----------|--------|------------|--------|
| Crew retur fiktif, ambil barang | 🟡 High | Audit trail InventoryMovement | ✅ |
| Crew waste fiktif | 🟡 High | Waste dengan alasan + kategori | ⚠️ Kategori belum ada |
| Crew opname curang | 🟡 Medium | Variance langsung kelihatan di report | ✅ |
| Crew terima barang fiktif | 🟡 High | DepotTransfer harus approve dari warehouse | ✅ |

### Yang Harus Dibangun 🛠️

| Pencegahan | Prioritas |
|------------|-----------|
| **Void approval** — void > Rp 100.000 butuh second factor (owner/manager) | 🔴 P0 |
| **Void reason wajib** — pilihan alasan, bukan free text | 🔴 P0 |
| **Waste category** — produksi / kadaluarsa / rusak / lainnya | 🟡 P1 |
| **Auto-flag variance besar** — variance cash > Rp 50.000 auto-flag untuk owner | 🟡 P1 |
| **Duplicate transaction detection** — cek kesamaan dalam 60 detik | 🟡 P1 |

---

## BAGIAN 5 — OUTLET EVENT SYSTEM

### Final Taxonomy

#### Event Wajib (Otomatis atau Manual Wajib)

| Event | Cara Catat | Otomatis? | Dampak |
|-------|-----------|-----------|--------|
| Shift dibuka | CashSession.create | ✅ Otomatis | — |
| Shift ditutup | CashSession.close | ✅ Otomatis | — |
| Transaksi | Transaction.create | ✅ Otomatis | Stock -, Cash + |
| Void | Transaction.void | ✅ Otomatis | Stock + |
| Stock opname | StockOpname.create | ✅ Otomatis | Variance |
| Expense | OutletExpense.create | ✅ Manual | Cash -, Stock + |
| Cash withdrawal | CashWithdrawal.create | ✅ Otomatis (via OTP) | Cash - |
| Terima barang | DepotTransfer.approve | ✅ Manual | Stock + |

#### Event Manual (Crew Input)

| Event | Dicatat Dimana | Kategori |
|-------|---------------|----------|
| Ganti minyak | InventoryMovement (retur) | Usage |
| Tambah minyak | InventoryMovement (retur) | Usage |
| Ganti gas | InventoryMovement (retur) | Usage |
| Buka adonan | InventoryMovement (retur) | Usage |
| Buka saos baru | InventoryMovement (retur) | Usage |
| Barang rusak | InventoryMovement (retur) | Waste |
| Barang kadaluarsa | InventoryMovement (retur) | Waste |
| Kebersihan | **BELUM ADA** | Ops |
| Komplain pelanggan | **BELUM ADA** | Ops |

#### Event Otomatis Penuh

| Event | Sumber Data | Trigger |
|-------|------------|---------|
| Stock berkurang | BranchInventoryItem | Setiap transaksi (via recipe) |
| Stock bertambah (GR) | BranchInventoryItem | Goods Receipt |
| Stock bertambah (transfer) | BranchInventoryItem | DepotTransfer approve |
| Kas bertambah | CashSession | Transaksi cash |
| Kas berkurang | CashSession | Withdrawal / Expense |

### Gap 🔴

| Event | Gap | Prioritas |
|-------|-----|-----------|
| **Kebersihan** | Tidak ada catatan | 🟢 Rendah |
| **Komplain pelanggan** | Tidak ada catatan | 🟢 Rendah |
| **Material usage** (gas, oil) | Tercatat tapi tanpa kategori | 🟡 Sedang |

**Keputusan:** Kebersihan dan komplain tidak perlu dicatat di sistem. Cukup checklist fisik. Material usage cukup dengan event yang sudah ada — tambah kategori waste.

---

## BAGIAN 6 — MATERIAL USAGE MODEL

### Evaluasi Realistis

| Material | Bisakah di-track per pcs? | Akurat? | Worth it? | Keputusan |
|----------|--------------------------|---------|-----------|-----------|
| **Tahu Pong** | ✅ Via recipe (TW_BASE) | ✅ Sangat akurat | ✅ | Pertahankan |
| **Adonan** | ✅ Via recipe (TW_BASE) | ✅ Sangat akurat | ✅ | Pertahankan |
| **Minyak** | ❌ Tidak — dipakai bersama | ❌ Tidak akurat | ❌ Tidak | **HAPUS tracking per pcs.** Cukup total pemakaian per shift. |
| **Gas** | ❌ Tidak — 1 tabung bisa untuk ratusan pcs | ❌ Tidak akurat | ❌ Tidak | **HAPUS tracking per pcs.** Cukup catat setiap ganti gas. |
| **Sauce Cup** | ✅ Via recipe | ✅ Akurat | ✅ | Pertahankan |
| **Paper Bag** | ✅ Via recipe | ✅ Akurat | ✅ | Pertahankan |
| **Saus Bag** | ✅ Via recipe | ✅ Akurat | ✅ | Pertahankan |

### Final Decision 🔨

1. **Minyak & Gas tidak perlu di-track per pcs.** Tidak akurat, tidak memberi nilai bisnis. Cukup:
   - Catat setiap kali "Tambah Minyak" = X liter (InventoryMovement type=PURCHASE)
   - Catat setiap kali "Ganti Gas" = 1 tabung (InventoryMovement)
   - Owner lihat total pemakaian per periode, bukan per pcs

2. **Recipe sudah cukup** untuk menghitung variable cost yang akurat (tahu pong, adonan, sauce, packaging).

3. **Waste kategori** — tambah field `category` di event retur/waste:
   - PRODUCTION (sisa produksi)
   - EXPIRED (kadaluarsa)
   - DAMAGED (rusak)
   - OTHER

---

## BAGIAN 7 — CASH SYSTEM FINAL DESIGN

### Konsep Final — Sederhana

Cuma ada 3 konsep yang crew perlu pahami:

```
💵 UANG MASUK = Cash Sales (transaksi tunai)
💸 UANG KELUAR = Expense + Cash Withdrawal
💰 SISA = Uang Masuk - Uang Keluar (+ opening)

🏦 PETTY CASH = Rp 50.000 (wajib ada di laci untuk kembalian)
📤 BISA DISETOR = SISA - PETTY CASH (uang lebih yang boleh diambil owner)
```

### UI — 1 Card, 5 Baris

```
┌─ Ringkasan Cash ─────────────────┐
│ Uang masuk    Rp 1.500.000       │
│ Uang keluar   Rp   200.000       │
│ Sisa          Rp 1.300.000       │ ← angka besar, jelas
│ Petty cash    Rp    50.000       │
│ Bisa disetor  Rp 1.250.000       │ ← highlight kuning/hijau
└──────────────────────────────────┘
```

**Hapus:**
- "Cash awal outlet" — crew tidak perlu tahu
- "Penjualan tunai" — sudah termasuk di "Uang masuk"
- "Penarikan" — sudah termasuk di "Uang keluar"
- "Setoran Belum Diambil" — ganti "Bisa disetor"
- "Petty cash" — cukup sebagai informasi, tidak perlu dihitung manual

### Konsep Dihapus 🗑️

| Konsep Lama | Masalah | Diganti Dengan |
|-------------|---------|---------------|
| "Setoran Belum Diambil" | Crew tidak paham | "Bisa disetor" |
| "Cash awal outlet" | Tidak berguna untuk operasional | — (hapus) |
| "Opening cash" | Crew selalu input 0 | — (hapus dari UI crew) |
| "Petty cash Rp 50.000" | Crew tidak paham kenapa | Tooltip: "Untuk kembalian" |

---

## BAGIAN 8 — KPI SYSTEM

### Crew KPIs (3 KPI)

| KPI | Formula | Target | Tampil Di |
|-----|---------|--------|-----------|
| **PCS Terjual** | Sum(Transaction.totalPcs) | 450/shift | Dashboard + Performance |
| **Cash Variance** | |closingCash - expectedCash| ≤ 0 | Dashboard shift summary |
| **Stock Variance** | |countedQty - systemQty| / systemQty | < 5% | Opname summary |

### Outlet KPIs (5 KPI)

| KPI | Formula | Target |
|-----|---------|--------|
| **Daily Sales** | Sum(Transaction.totalAmount) | Per outlet |
| **PCS per Crew** | totalPcs / jumlahCrew | 450/crew |
| **Cash Variance Rate** | jumlah shift dengan variance > 0 / total shift | < 10% |
| **Stock Accuracy** | 1 - (total variance / total stock) | > 95% |
| **Open Shift Rate** | jumlah shift dibuka / jumlah hari | 100% |

### Owner KPIs (3 KPI)

| KPI | Formula | Target |
|-----|---------|--------|
| **Total Sales All Outlets** | Sum(semua outlet) | Growth 10% MoM |
| **Outlet dengan Variance** | count(variance > threshold) | 0 |
| **Pending Approvals** | count(pending withdrawal + expense) | < 5 |

### KPI Yang Dihapus 🗑️

| KPI | Alasan |
|-----|--------|
| **Attendance count** | Tidak memberi nilai bisnis. Crew harusnya masuk semua. |
| **Estimated bonus detail per hari** | Crew cukup tahu total estimasi, tidak perlu breakdown harian. |
| **Target hit days** | Tidak actionable. Target per shift, bukan per hari. |

---

## BAGIAN 9 — DATABASE REVIEW

### Aktivitas Yang Belum Meninggalkan Jejak 🔴

| Aktivitas | Tabel Baru? | Prioritas |
|-----------|------------|-----------|
| Refund (partial) | Perlu tabel Refund atau extend Transaction | P1 |
| Kebersihan outlet | Tidak perlu — cukup checklist fisik | — |
| Komplain pelanggan | Tidak perlu — handle offline | — |

### Yang Cukup 🔵

| Aktivitas | Jejak | Status |
|-----------|-------|--------|
| Buka shift | CashSession | ✅ |
| Tutup shift | CashSession | ✅ |
| Transaksi | Transaction | ✅ |
| Void | Transaction.status = VOID | ✅ |
| Expense | OutletExpense | ✅ |
| Withdrawal | CashWithdrawal | ✅ |
| Stock opname | StockOpname | ✅ |
| Material usage | InventoryMovement | ✅ |
| Terima barang | DepotTransfer | ✅ |
| Waste | InventoryMovement | ⚠️ Perlu kategori |

### Satu Tabel Baru

```prisma
enum WasteCategory {
  PRODUCTION
  EXPIRED
  DAMAGED
  OTHER
}
```

Tambah field `wasteCategory` ke InventoryMovement atau buat model Waste terpisah.

---

## BAGIAN 10 — UI/UX REVIEW

### Skor Per Halaman (Target: 80)

| Halaman | Skor Saat Ini | Gap | Target |
|---------|-------------|-----|--------|
| CrewHomePage | 70 | Target PCS + stock alert | 85 |
| CrewPosPage | 65 | Offline mode + keyboard fix | 85 |
| CrewCashWithdrawalsPage | 60 | Sederhanakan istilah | 80 |
| CrewOperationalPage | 55 | Gabung retur + kejadian | 80 |
| CrewStockOpnamePage | 65 | — | 75 |
| CrewPerformancePage | 70 | — | 75 |
| CrewSalesTodayPage | 60 | Void dari sini + search | 75 |
| CrewShell | 55 | Bottom nav 5 item konsisten | 80 |

### Priority Fixes 🔧

| Halaman | Fix | Effort | Dampak |
|---------|-----|--------|--------|
| PosPage | Offline mode (localStorage queue) | 5 hari | 🔴 Kritis |
| PosPage | Keyboard scroll fix | 0.5 hari | 🟡 Tinggi |
| CashWithdrawals | Rename istilah + tooltip | 0.5 hari | 🟡 Tinggi |
| Dashboard | Target PCS | 1 hari | 🟡 Tinggi |
| Dashboard | Stock alert | 1 hari | 🟡 Tinggi |
| Operasional | Gabung retur + kejadian | 1 hari | 🟡 Tinggi |
| CrewShell | Bottom nav 5 item | 1 hari | 🟡 Sedang |

---

## BAGIAN 11 — GO-LIVE DECISION

### Score Card

| Area | Skor Saat Ini | Target | Gap | P0 untuk Go-Live? |
|------|-------------|--------|-----|-------------------|
| **Crew Readiness** | 60 | 80 | 20 | 🟡 |
| **Operational Readiness** | 55 | 80 | 25 | 🟡 |
| **Cash Control** | 65 | 85 | 20 | ✅ Sudah cukup |
| **Inventory Control** | 50 | 75 | 25 | 🟡 |
| **Daily Workflow** | 55 | 80 | 25 | 🟡 |
| **Fraud Prevention** | 45 | 80 | 35 | 🔴 BUTUH |
| **Learnability** | 35 | 80 | 45 | 🟡 |
| **Mobile Usability** | 60 | 80 | 20 | 🟡 |

### Apakah Layak Go-Live?

| Outlet | Keputusan | Syarat |
|--------|-----------|--------|
| **1 outlet (besok)** | ✅ **GO** | Owner dampingi. Void < Rp 100k, variance dimonitor manual. |
| **3 outlet (minggu depan)** | ⚠️ **GO WITH CAUTION** | Void approval harus siap. Expense auto-approve. |
| **10 outlet (bulan depan)** | ❌ **NO-GO** | Butuh offline POS + fraud prevention + enforcements |
| **50 outlet (3 bulan)** | ❌ **NO-GO** | Butuh banyak — lihat roadmap |

---

## BAGIAN 12 — IMPLEMENTATION ROADMAP

### P0 — Wajib Sebelum Go-Live (1-2 hari)

| Item | Dampak | Effort |
|------|--------|--------|
| Void approval threshold (configurable) | 🔴 Fraud prevention | 2 jam |
| Void reason pilihan (bukan free text) | 🔴 Fraud prevention | 1 jam |
| Sederhanakan istilah cash (Uang Masuk/Keluar, Bisa Disetor) | 🟡 UX | 1 jam |
| Hapus "Setoran Belum Diambil" ganti "Bisa Disetor" | 🟡 UX | 30 menit |
| Target PCS di dashboard | 🟡 Crew motivasi | 1 jam |

### P1 — Wajib Sebelum 10 Outlet (1-2 minggu)

| Item | Dampak | Effort |
|------|--------|--------|
| POS offline mode (queue transaksi lokal) | 🔴 Operational | 5 hari |
| Waste kategori (PRODUCTION/EXPIRED/DAMAGED/OTHER) | 🟡 Data quality | 2 jam |
| Auto-flag variance besar untuk owner | 🟡 Fraud detection | 1 hari |
| Keyboard scroll fix di POS | 🟡 UX | 4 jam |
| Gabung retur + kejadian di 1 tab | 🟡 UX | 1 hari |
| Stock alert di dashboard | 🟡 Operational | 1 hari |

### P2 — Wajib Sebelum 50 Outlet (1-2 bulan)

| Item | Dampak | Effort |
|------|--------|--------|
| Approval center (1 halaman untuk semua pending) | 🔴 Owner efficiency | 2 hari |
| CrewSchedule + auto-roster | 🟡 HR | 3 hari |
| Minimum stock auto-alert | 🟡 Inventory | 2 hari |
| Refund flow (partial) | 🟡 POS | 3 hari |
| Duplicate transaction detection | 🟡 Fraud | 1 hari |

### P3 — Nice to Have

| Item | Effort | Notes |
|------|--------|-------|
| Diskon/promo engine | 5 hari | Setelah 10 outlet stabil |
| Barcode scanner | 3 hari | Setelah 10 outlet |
| Customer display | 2 hari | Setelah 10 outlet |
| Onboarding tooltip | 3 hari | Setelah 10 outlet |

---

## BAGIAN 13 — HARD RULES

### Rule 1: Tidak Ada Form > 3 Field di Crew Side
Jika operasional crew butuh input >3 field, sistem salah desain.
Kecuali: stock opname (wajib banyak field).

### Rule 2: Setiap Tap Harus Punya Tujuan
Jika ada tombol yang tidak menghasilkan uang atau mencegah fraud, hapus.

### Rule 3: Approval Hanya untuk Anomali
Auto-approve expense ≤ Rp 50.000. Auto-approve void ≤ Rp 100.000.
Owner hanya review yang di luar batas wajar.

### Rule 4: Data Yang Tidak Diverifikasi = Sampah
Jika crew mengisi angka tanpa verifikasi (misal: stok opname asal-asalan), datanya tidak berguna.
Sistem harus mendeteksi anomali dan meminta verifikasi ulang.

### Rule 5: Offline Dulu, Baru Online
POS harus jalan tanpa internet. Transaksi disimpan lokal, sync saat online.

---

## BAGIAN 14 — FINAL VERDICT

### Score Final Target: 80/100

| Area | Skor Sekarang | Target 3 Bulan |
|------|-------------|----------------|
| Crew Readiness | 60 | 85 ✅ |
| Operational Readiness | 55 | 80 ✅ |
| Cash Control | 65 | 85 ✅ |
| Inventory Control | 50 | 75 |
| Daily Workflow | 55 | 80 ✅ |
| Fraud Prevention | 45 | 80 ✅ Butuh P0 |
| Learnability | 35 | 70 |
| Mobile Usability | 60 | 80 ✅ |

### 1 Outlet — Besok: ✅ GO

Instruksi untuk owner:
1. Dampingi crew 1 jam pertama
2. Ajarkan: Login → Buka Shift → POS → Tutup Shift
3. Jelaskan: "Bisa Disetor" = uang yang boleh diambil owner
4. Monitor variance cash setiap hari via dashboard

### 3 Outlet — Minggu Depan: ⚠️ GO WITH:

1. **Void approval** — batasi void > Rp 100rb
2. **Auto-approve expense** — ≤ Rp 50rb auto
3. **Satu halaman monitoring** — owner lihat 3 outlet dalam 1 layar (existing cross branch)

### 10 Outlet — Bulan Depan: ❌ NO-GO

| Syarat | Status |
|--------|--------|
| Offline POS | ❌ Belum |
| Void approval | ❌ Belum |
| Warehouse → branch flow fix | ✅ |
| Stock opname enforcement | ❌ Belum |
| Expense auto-approve | ❌ Belum |
| Owner exception dashboard | ⚠️ Sebagian |

### 50 Outlet — 3 Bulan: ❌ NO-GO

Butuh: P0 + P1 + P2 semua selesai.

### Final Kata

> **KRUNCUY Crew POS sudah cukup baik untuk 1 outlet besok.**
>
> Tapi untuk 10+ outlet, ada 3 hal yang non-negotiable:
>
> 1. **Void approval + reason** — tanpa ini, fraud tidak terhindarkan di scale.
> 2. **POS offline mode** — tanpa ini, satu internet mati = satu outlet berhenti jualan.
> 3. **Sederhanakan istilah** — crew bukan akuntan. "Bisa Disetor" bukan "Setoran Belum Diambil".
>
> **Kerjakan P0 dulu (1-2 hari).** Setelah itu go-live 1 outlet. Sambil jalan, kerjakan P1 untuk persiapan 10 outlet.
>
> Target skor 80/100 dalam 3 bulan. Realistis.

---

*Master Plan — Product Manager POS F&B | Multi Outlet Operations Director*
*11 Juni 2026*

---

## APPENDIX A — DETAILED CODEBASE FINDINGS

### A.1 File Change Impact per P0 Item

| P0 Item | Files to Modify | Estimated Changes |
|---------|----------------|-------------------|
| **Void approval threshold** | `transaction.service.js`, `transaction.controller.js`, `CrewSalesTodayPage.jsx` | Add threshold check + frontend approval modal |
| **Expected cash auto** | `cashSession.service.js` (calc expected), `CrewHomePage.jsx` (display) | Auto-calc in service, display as default in frontend |
| **POS default OFFLINE** | `CrewPosPage.jsx` | Remove channel toggle. Default: OFFLINE. Online as secondary option. |
| **Pre-opening checklist** | `schema.prisma` (new model), `crew.service.js`, `crew.controller.js`, `CrewHomePage.jsx` | New table + API + UI modal |
| **Enforce stock opname** | `crew.service.js` (gate logic), `CrewHomePage.jsx` (blocker UI) | Change gate from warning to blocker |
| **Fix OTP flow** | `cashWithdrawal.service.js` (remove otpCode from response), `CrewCashWithdrawalsPage.jsx` (remove OTP display modal) | 2 files, minor changes |
| **Error messages** | Error boundary wrapper in `App.jsx`, maybe `error.middleware.js` | Wrapper component for all API calls |
| **Keyboard scroll fix** | `CrewPosPage.jsx` | ScrollIntoView on payment button when keyboard opens |

### A.2 Existing Strengths (dari source code)

| Feature | File Reference | Status |
|---------|---------------|--------|
| Pagination framework | `backend/src/core/utils/pagination.js` | ✅ Implemented for 5+ endpoints |
| Refresh token + httpOnly cookie | `backend/src/core/utils/jwt.js` + `session.js` | ✅ Sprint 7 |
| RBAC with branch isolation | `branchContext.middleware.js`, `accessControlCatalog.js` | ✅ Mature |
| Docker setup | `Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml` | ✅ Sprint 6 |
| CI/CD pipeline | `.github/workflows/ci.yml` | ✅ Sprint 6 |
| Integration tests | `tests/helpers/setup.js`, 16 test cases | ✅ Sprint 5 |
| Recipe engine with sub-recipe | `pos.service.js:applyRecipeConsumption()` | ✅ Mature |
| Audit trail | `core/services/auditLog.service.js` | ✅ Mature |
| Cross branch dashboard | `ErpCrossBranchPage.jsx` | ✅ Sprint 4 |
| Notification center | `ErpNotificationsPage.jsx` | ✅ Sprint 4 |

### A.3 Current System Settings (from codebase)

| Key | Default | File | Description |
|-----|---------|------|-------------|
| `crew_bonus_min_pcs` | 25 | `crew.service.js` | Minimum PCS for bonus |
| `crew_bonus_per_pcs` | 250 | `crew.service.js` | Bonus per PCS |
| `crew_bonus_extra_sauce` | 250 | `crew.service.js` | Bonus per extra sauce |
| `pos_target_pcs` | 450 | `pos.service.js` | Daily target PCS |
| `gps_required_openshift` | true | `cashSession.service.js` | GPS validation on/off |
| `cash_minimum_outlet` | 50000 | `cashWithdrawal.service.js` | Petty cash amount |

### A.4 Risk Matrix — Jika Tidak Ada Perubahan

| Risiko | Tanpa P0 | Tanpa P1 | Tanpa P2 |
|--------|----------|----------|----------|
| Void fraud > Rp 100rb | 🔴 Mungkin terjadi hari 1 | 🔴 Masih mungkin | 🟡 Berkurang |
| Crew salah input closing cash | 🔴 Sering terjadi | 🟡 Jarang | 🟢 Minimal |
| Crew bingung pakai sistem | 🔴 Training 1+ hari | 🟡 Training 2 jam | 🟢 30 menit |
| Stok tidak akurat | 🔴 Variance > 10% | 🟡 Variance < 5% | 🟢 Variance < 2% |
| Internet mati → POS mati | 🔴 Outlet tutup | 🔴 Outlet tutup | 🟡 Bisa offline |
| Owner kewalahan approve | 🟡 5 approval/hari | 🔴 50 approval/hari | 🔴 250 approval/hari |
| Data event hilang | 🔴 Tab "Kejadian" | 🟢 Semua persist | 🟢 Terstruktur |

---

*Appendix ini ditambahkan berdasarkan eksplorasi langsung codebase pada 11 Juni 2026.*
*Setiap klaim diverifikasi dengan membaca source code terkait.*
