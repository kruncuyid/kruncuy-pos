# FINAL AUDIT — CREW OPERATIONS

> **Tanggal:** 11 Juni 2026
> **Auditor:** Product Manager POS + F&B Operations Consultant + Internal Auditor
> **Scope:** Crew POS, Outlet Operations, Daily Workflow
> **Status:** Pre Go-Live

---

## BAGIAN 1 — EXECUTIVE SUMMARY

| Dimensi | Skor | Alasan |
|---------|------|--------|
| **Crew Readiness** | 60/100 | Dashboard sudah informatif, POS sudah cepat. Tapi crew baru butuh training — tidak ada onboarding. |
| **Operational Readiness** | 55/100 | Flow utama (shift, POS, cash) sudah benar. Tapi banyak event harian belum tercatat (gas, minyak, adonan, cleaning). |
| **Cash Control** | 65/100 | OTP flow, cash session, expense — solid. Tapi petty cash concept membingungkan crew baru. Closing shift masih manual input cash. |
| **Inventory Control** | 50/100 | Stock opname ada. Tapi material usage tracking (minyak/pcs, gas/pcs) belum ada. Waste ratio tidak bisa dihitung. |
| **Daily Workflow** | 55/100 | Alur daily cukup jelas. Tapi pre-opening checklist tidak ada. Closing enforcement lemah. |
| **Fraud Prevention** | 45/100 | Void tanpa approval. Tidak ada duplicate transaction detection. Tidak ada audit untuk cash variance besar. |
| **Learnability** | 35/100 | Crew baru akan bingung. Tidak ada tooltip, onboarding, atau panduan. Istilah teknis (isPurchasable, POSTED) muncul di UI. |
| **Mobile Usability** | 60/100 | Sebagian besar halaman mobile-friendly. Tapi beberapa form terlalu panjang, tombol terlalu kecil di某些 tempat. |

### Overall: **53/100** — "Siap untuk Go-Live dengan Supervisi Ketat"

---

## BAGIAN 2 — COMPLETE DAILY CREW JOURNEY

| Step | Actor | UI Page | DB Record | Validation | Output |
|------|-------|---------|-----------|------------|--------|
| Login | Crew | `/crew` (LoginPage → redirect) | — | Username + password → JWT | Dashboard terbuka |
| Cek assignment | Crew | CrewHomePage | BranchAssignment | isActive + date range | Branch yang akan dipakai |
| Pilih branch | Crew | BranchPicker modal (jika >1) | — | Crew punya akses ke branch? | branchId terpilih |
| Pre-opening | Crew | CrewHomePage | — | **BELUM ADA** checklist | — |
| Buka shift | Crew | CrewHomePage → openSession | CashSession | GPS (jika aktif), branch, opening cash | CashSession OPEN |
| Stock opname awal | Crew | `/crew/stock-opname?kind=OPENING` | StockOpname | Semua item terisi | StockOpname OPENING complete |
| POS jualan | Crew | `/crew/pos` | Transaction | Active session, stock cukup | Transaction COMPLETED |
| Void (jika perlu) | Crew | `/crew/sales-today` → detail → void | Transaction status=VOID | Reason, stock reverse | Transaction VOID |
| Terima barang | Crew | `/crew/operational` → Terima | DepotTransfer APPROVED | Active session | BranchInventoryItem + |
| Event harian | Crew | `/crew/operational` → Kejadian | InventoryMovement (via retur) | Item dipilih | Stock tercatat |
| Belanja outlet | Crew | `/crew/operational` → Beli | OutletExpense REQUESTED | Item, nominal, foto | OutletExpense tercatat |
| Cash withdrawal | Crew | `/crew/cash-withdrawals` | CashWithdrawal | OTP, verifikasi | CashWithdrawal COMPLETED |
| Stock opname akhir | Crew | `/crew/stock-opname?kind=CLOSING` | StockOpname | Semua item + oil/gas | StockOpname CLOSING |
| Tutup shift | Crew | CrewHomePage → closeSession | CashSession CLOSED | Closing cash, variance note | CashSession CLOSED |
| Shift summary | Crew | SummaryModal | — | — | Crew lihat ringkasan |
| Pulang | Crew | — | — | — | — |

### Missing Steps 🔴

| Step | Dampak |
|------|--------|
| **Pre-opening checklist** (kebersihan, alat, bahan) | Crew tidak standar dalam persiapan outlet |
| **Cleaning checklist** (sebelum pulang) | Outlet bisa tutup tanpa bersih-bersih |
| **Morning briefing** (target hari ini) | Crew tidak tahu target PCS hari ini |
| **End-of-day report** cetak | Tidak ada laporan harian yang bisa dibawa pulang |

---

## BAGIAN 3 — OPERATIONAL ACTIVITY COVERAGE AUDIT

| Aktivitas | Status | Keterangan |
|-----------|--------|------------|
| Buka shift | ✅ Ada | CashSession OPEN |
| Tutup shift | ✅ Ada | CashSession CLOSED + summary |
| Stock opname awal | ✅ Ada | StockOpname OPENING |
| Stock opname akhir | ✅ Ada | StockOpname CLOSING + variance |
| Transaksi cash | ✅ Ada | Transaction + paymentMethod CASH |
| Transaksi QRIS | ✅ Ada | Transaction + paymentMethod QRIS |
| Transaksi online | ✅ Ada | Transaction + salesChannel ONLINE |
| Split payment | ✅ Ada | Transaction + paymentDetails type=SPLIT |
| Refund | ❌ **Tidak ada** | Tidak ada flow refund terpisah — void adalah satu-satunya cara |
| Void | ⚠️ Sebagian | Void ada, tapi tidak ada approval untuk void nominal besar |
| Diskon | ❌ **Tidak ada** | Tidak ada diskon per item atau per transaksi |
| Promo | ❌ **Tidak ada** | Tidak ada engine promo |
| Cash withdrawal | ✅ Ada | OTP flow + rate limit |
| Petty cash | ⚠️ Sebagian | Konsep ada (cash_minimum_outlet), UI kurang jelas |
| Outlet expense | ✅ Ada | REQUESTED → POSTED, stock +, cost tracking |
| Emergency purchase | ✅ Ada | Lewat OutletExpense |
| Retur barang | ✅ Ada | Lewat crewApi.submitRetur |
| Waste barang | ⚠️ Sebagian | Waste ada via retur, tapi tidak ada kategori waste (produksi/kadaluarsa/rusak) |
| Barang rusak | ⚠️ Sebagian | Bisa dicatat via retur dengan alasan |
| Stok habis | ⚠️ Sebagian | Stok=0 tidak otomatis menonaktifkan produk di POS |
| Stok kritis | ✅ Ada | Di Notification Center |
| Terima barang dari depo | ✅ Ada | DepotTransfer → approve |
| Kirim barang ke depo | ❌ **Tidak ada** | Tidak ada flow retur ke depo dari crew |
| Buka adonan baru | ⚠️ Sebagian | Bisa dicatat via event Kejadian → stok berkurang |
| Tambah minyak | ⚠️ Sebagian | Bisa dicatat via event Kejadian |
| Ganti minyak | ⚠️ Sebagian | Bisa dicatat via event Kejadian |
| Pasang gas baru | ⚠️ Sebagian | Bisa dicatat via event Kejadian |
| Gas habis | ❌ **Tidak ada** | Tidak ada alert "gas habis" |
| Buka saos baru | ⚠️ Sebagian | Bisa dicatat via event Kejadian |
| Buka packaging baru | ⚠️ Sebagian | Bisa dicatat via event Kejadian |
| Cleaning checklist | ❌ **Tidak ada** | Tidak ada cleaning log |
| Checklist tutup outlet | ❌ **Tidak ada** | Tidak ada checklist sebelum pulang |

### Kesimpulan: **22 dari 31 aktivitas** sudah bisa dicatat (71%). Sisanya 9 aktivitas belum fully supported.

---

## BAGIAN 4 — OUTLET EVENT LOGGING AUDIT

### Event Wajib

| Event | Wajib? | Data | Dampak Cash | Dampak Stock | Dampak KPI | Status |
|-------|--------|------|-------------|-------------|-------------|--------|
| Cash Opened | ✅ Wajib | nominal | + | — | — | ✅ CashSession.openingCash |
| Cash Closed | ✅ Wajib | nominal | — | — | Variance | ✅ CashSession.closingCash |
| Cash Withdrawal | ✅ Wajib | nominal | — | — | — | ✅ CashWithdrawal |
| Expense | ✅ Wajib | nominal + foto | — | +/- | Food cost | ✅ OutletExpense |
| Oil Added | ✅ Wajib | liter | — | — | Oil/pcs | ⚠️ Lewat event Kejadian |
| Oil Replaced | ✅ Wajib | liter | — | Waste | Waste ratio | ⚠️ Lewat event Kejadian |
| Gas Changed | ✅ Wajib | tabung | — | — | Gas/pcs | ⚠️ Lewat event Kejadian |
| Dough Prepared | ✅ Wajib | kg | — | — | Adonan/pcs | ⚠️ Lewat event Kejadian |
| Waste | ✅ Wajib | item + qty + alasan | — | — | Waste ratio | ✅ retur/waste |
| Stock Opname | ✅ Wajib | semua item | — | +/- | Variance | ✅ StockOpname |
| Customer Complaint | ⏳ Sebaiknya | keterangan | — | — | Kepuasan | ❌ Tidak ada |
| Cleaning | ⏳ Sebaiknya | — | — | — | — | ❌ Tidak ada |
| Equipment Issue | ⏳ Sebaiknya | keterangan | — | — | — | ❌ Tidak ada |

### Gap 🔴

Event material usage (oil, gas, dough, sauce) tercatat via "Kejadian" tab → retur. Tapi:
1. Tidak ada dashboard yang menampilkan **usage/pcs** secara real-time
2. Tidak ada perbandingan **actual vs standard** (misal: standar 0.03L minyak/pcs, aktual 0.035L)
3. Data tersimpan sebagai InventoryMovement, tapi tidak ada report yang menghitung rasio pemakaian

---

## BAGIAN 5 — CASH CONTROL AUDIT

### Diagram Alur Cash Ideal

```
Pelanggan bayar cash
  ↓
POS mencatat transaksi (cashierId, totalAmount)
  ↓
Cash di laci bertambah (fisik)
  ↓
Setiap akhir shift:
  → Hitung cash fisik
  → Bandingkan dengan expected cash (opening + sales - expense - withdrawal)
  → Variance = fisik - expected
  → Jika variance ≠ 0, catat alasan
  → Tutup shift
  ↓
Owner review:
  → Lihat shift summary
  → Lihat variance
  → Jika variance besar, investigasi
```

### Celah Manipulasi 🔴

| Celah | Risiko | Pencegahan | Status |
|-------|--------|------------|--------|
| **Void tanpa approval** | Crew void Rp 500.000, ambil cash-nya | Approval untuk void > threshold | ❌ Tidak ada |
| **Expense fiktif** | Crew buat expense palsu, ambil cash | Foto struk, approval owner | ✅ Foto + approval |
| **Setoran tidak disetor** | Crew bilang sudah disetor, uang masih di saku | OTP flow, audit trail | ✅ OTP |
| **Double setor** | Crew setor uang yang sama 2× | OTP sekali pakai | ✅ |
| **Cash tidak dihitung** | Crew tutup shift tanpa hitung cash | Wajib input closing cash | ✅ (tapi bisa input 0) |
| **Variance tidak dicatat** | Crew tutup shift tanpa catat alasan selisih | Wajib isi note jika variance ≠ 0 | ✅ (baru ditambahkan) |

### Yang Membingungkan Crew 🔴

1. **"Setoran Belum Diambil"** — crew pikir itu utang mereka. Padahal uang lebih dari petty cash yang boleh diambil owner.
2. **"Petty Cash"** — crew tidak paham kenapa Rp 50.000 tidak boleh diambil.
3. **OTP flow** — crew bingung: generate OTP → kasih ke owner → owner verifikasi. Crew pikir mereka approve penarikan, padahal mereka cuma bikin kode.

### Rekomendasi

1. **Rename "Setoran Belum Diambil"** → "Uang Lebih (siap diambil owner)"
2. **Tooltip/help** di dekat petty cash: "Rp 50.000 untuk kembalian"
3. **Auto-approve expense kecil** (≤ Rp 50.000) — kurangi beban admin

---

## BAGIAN 6 — INVENTORY & MATERIAL USAGE AUDIT

### Yang Sudah Bisa Dihitung

| Metrik | Cara | Akurat? |
|--------|------|---------|
| Stok per item | BranchInventoryItem.currentStock | ✅ |
| Movement per item | InventoryMovement | ✅ |
| Variance opname | StockOpnameItem.varianceQty | ✅ |
| PCS terjual | Transaction.totalPcs | ✅ |
| Cost per pcs | ItemPurchaseLot + InventoryCostHistory | ✅ |

### Yang Belum Bisa Dihitung 🔴

| Metrik | Kenapa | Data Kurang |
|--------|--------|-------------|
| **Minyak/pcs** | Minyak dipakai untuk beberapa produk sekaligus | Tidak ada pencatatan "tambah minyak = X liter" yang link ke PCS |
| **Gas/pcs** | Sama — gas dipakai untuk semua produk | Tidak ada pencatatan "ganti gas = 1 tabung" |
| **Adonan/pcs** | Adonan dipakai per produk (sudah via recipe) | ⚠️ Sebenarnya sudah — kalau recipe benar |
| **Waste ratio** | Waste tercatat tapi tidak ada kategori | Waste perlu kategori: produksi vs kadaluarsa vs rusak |
| **Yield variance** | Actual vs standard recipe | Tidak ada produksi batch | 

### Sebenarnya...

Kalau recipe sudah benar (TW_BASE → Tahu Pong x1 + Adonan 0.12kg), maka setiap transaksi sudah otomatis menghitung pemakaian. Minyak dan gas tidak bisa di-track per pcs karena dipakai bersama. Ini wajar di industri F&B — minyak dan gas adalah **overhead**, bukan variable cost per unit.

### Rekomendasi

1. **Tracking minyak terpisah** — event "Tambah Minyak" dengan liter → InventoryMovement type=PURCHASE.
2. **Tracking gas** — event "Ganti Gas" → hitung pemakaian per shift.
3. **Dashboard material usage** — tampilkan total pemakaian minyak + gas per hari/minggu.
4. **Tidak perlu hitung minyak/pcs** — terlalu kompleks, tidak akurat. Cukup total pemakaian per periode.

---

## BAGIAN 7 — CREW DASHBOARD AUDIT

### Dashboard Saat Ini — Yang Ada

| Widget | Apakah Menjawab? |
|--------|------------------|
| Shift status ✅ | "Saya sedang shift atau tidak?" ✅ |
| Penjualan Hari Ini ✅ | "Berapa omzet saya?" ✅ |
| Transaksi + PCS ✅ | "Berapa PCS saya?" ✅ |
| Payment chart ✅ | — |
| Cash summary ✅ | "Apakah cash aman?" ✅ |
| Estimasi bonus ✅ | "Berapa bonus saya?" ✅ |
| Quick actions ✅ | "Apa tugas saya sekarang?" ✅ |
| Pending approvals ✅ | "Ada approval yang menunggu?" ✅ |

### Yang Kurang 🔴

| Yang Kurang | Dampak |
|-------------|--------|
| **Target PCS hari ini** | Crew tahu PCS, tapi tidak tahu target. "Apakah saya mencapai target?" |
| **Stock alert count** | Tidak ada indikator stok kritis di dashboard. Crew harus buka halaman terpisah. |
| **Tugas tertunda count** | "Apakah ada opname yang belum dilakukan?" |
| **Morning target display** | Crew buka shift → langsung lihat "Target hari ini: 450 PCS" |
| **Variance cash sebelumnya** | Crew tidak tahu apakah kemarin ada selisih cash |

### Rekomendasi

1. **Tambah target PCS** — baca dari system setting `pos_target_pcs`
2. **Tambah stock alert badge** — jika ada stok ≤ minimum, tampilkan ikon peringatan
3. **Tambah task count** — badge "Opname pending" jika opname closing belum dilakukan

---

## BAGIAN 8 — MOBILE USABILITY AUDIT

### Asumsi
- Android murah (layar 5-6 inch, RAM 3GB)
- Internet 4G (kadang stabil, kadang tidak)
- Crew sambil melayani pelanggan (satu tangan, cepat)

### Masalah 🔴

| No | Masalah | Severity |
|----|---------|----------|
| 1 | **POS default online** — crew harus klik "Online" dulu padahal 90% offline | Medium |
| 2 | **Search di POS tidak ada debounce** — setiap karakter trigger filter | Low |
| 3 | **Cart drawer full screen** — baik, tapi tidak ada swipe-to-dismiss | Low |
| 4 | **Foto expense URL** — masih mungkin ada yang pakai URL (laptop) | Low |
| 5 | **Loading state** — skeleton bagus, tapi terlalu banyak skeleton bertumpuk | Low |
| 6 | **Error message teknis** — kadang "Cannot read property" muncul | Medium |
| 7 | **Keyboard blocking payment input** — di HP, keyboard nutup tombol bayar | 🔴 High |
| 8 | **Tidak ada offline mode** — kalau internet mati, POS tidak bisa dipakai | 🔴 High |

### Rekomendasi

1. Prioritaskan **offline-first** untuk POS — simpan transaksi di local storage, kirim saat online
2. **Scroll ke payment button** saat keyboard muncul
3. **Error message** harus human-readable — "Gagal memuat data" bukan "TypeError: ..."

---

## BAGIAN 9 — FRAUD & HUMAN ERROR AUDIT

| Celah | Tingkat | Pencegahan | Ada? |
|-------|---------|------------|------|
| Void transaksi tanpa reason | 🔴 High | Wajib reason dengan pilihan alasan | ❌ Free text |
| Void transaksi tanpa approval | 🔴 High | Approval untuk void > threshold | ❌ Tidak |
| Double checkout | 🟡 Medium | Duplicate detection | ❌ Tidak |
| Cash withdrawal fake OTP | 🔴 High | Rate limit 5/15 menit | ✅ |
| Expense fiktif | 🟡 Medium | Foto struk + approval owner | ✅ |
| Stock opname curang | 🟡 Medium | Variance langsung kelihatan | ✅ |
| Close shift tanpa cash | 🟡 Medium | Warning variance | ✅ |
| Duplicate expense | 🟡 Medium | — | ❌ Tidak |
| Manipulasi stok via retur | 🟡 Medium | Audit trail InventoryMovement | ✅ |
| Login orang lain | 🔴 High | Password masing-masing | ✅ |

### Yang Paling Berbahaya 🔴

1. **Void tanpa approval** — crew bisa void Rp 10jt + ambil cash. Tidak ada yang cegah.
2. **Internet mati** — POS tidak bisa dipakai. Transaksi tidak tercatat. Crew bisa ambil cash tanpa sistem tahu.
3. **Tidak ada duplicate transaction detection** — 2 crew bisa checkout order yang sama.

---

## BAGIAN 10 — DATABASE AUDIT

| Aktivitas | Tabel | Audit Trail? | Perlu Perbaikan? |
|-----------|-------|-------------|------------------|
| Buka shift | CashSession | ✅ | — |
| Tutup shift | CashSession | ✅ | — |
| Transaksi | Transaction | ✅ | — |
| Void | Transaction (status) | ✅ | — |
| Refund | ❌ **Tidak ada** | ❌ | 🔴 Perlu dibuat |
| Expense | OutletExpense | ✅ | — |
| Cash withdrawal | CashWithdrawal | ✅ | — |
| Stock opname | StockOpname | ✅ | — |
| Retur/waste | InventoryMovement | ✅ | — |
| Terima barang | DepotTransfer | ✅ | — |
| Gas changed | InventoryMovement (via retur) | ⚠️ | ⚠️ Tidak ada kategori khusus |
| Oil added | InventoryMovement (via retur) | ⚠️ | ⚠️ Tidak ada kategori khusus |
| Cleaning | ❌ **Tidak ada** | ❌ | 🔴 Perlu dibuat |
| Customer complaint | ❌ **Tidak ada** | ❌ | 🟡 Nice to have |
| Equipment issue | ❌ **Tidak ada** | ❌ | 🟡 Nice to have |

### Aktivitas yang Tidak Meninggalkan Jejak 🔴

1. **Refund** — tidak ada tabel refund. Harus void + buat transaksi baru.
2. **Cleaning** — tidak ada catatan kapan terakhir dibersihkan.
3. **Material usage** (gas, oil) — tercatat tapi tidak terstruktur (tanpa kategori).

---

## BAGIAN 11 — UI AUDIT

### CrewHomePage — 70/100
✅ Jelas, actionable, shift status prominent, quick actions baik
❌ Target PCS tidak ada. Stock alert tidak ada.

### CrewPosPage — 65/100
✅ Cepat untuk offline, cart baik, payment methods lengkap
❌ Tidak ada offline mode. Keyboard blocking payment button.

### CrewCashWithdrawalsPage — 60/100
✅ Cash summary jelas, OTP flow baik
❌ "Setoran Belum Diambil" membingungkan. Petty cash tidak dijelaskan.

### CrewOperationalPage — 55/100
✅ Tab layout baik, event kejadian baru
❌ 4 tab mungkin terlalu banyak untuk HP. Foto expense masih URL (walaupun sudah ada camera).

### CrewStockOpnamePage — 65/100
✅ Opening/closing jelas, variance langsung kelihatan
❌ Nomor. Cukup baik.

### CrewPerformancePage — 70/100
✅ Kalender visual baik, bonus jelas
❌ Tidak ada masalah berarti.

### CrewSalesTodayPage — 60/100
✅ Invoice copy baik, detail transaksi jelas
❌ Tidak ada void dari sini. Tidak ada search/filter.

### CrewShell — 55/100
✅ Navigasi bawah cukup jelas
❌ Icon Boxes dipakai 2× (ambiguous). Tidak ada link ke Penjualan Hari Ini.

---

## BAGIAN 12 — TOP 50 OPERATIONAL GAPS

| Rank | Gap | Area | Severitas |
|------|-----|------|-----------|
| 1 | **Tidak ada offline mode** — POS mati total tanpa internet | POS | 🔴 |
| 2 | **Void tanpa approval** — crew bisa void kapan saja | Fraud | 🔴 |
| 3 | **Tidak ada refund flow** — hanya void total | POS | 🔴 |
| 4 | **Tidak ada duplicate transaction detection** | POS | 🔴 |
| 5 | **Pre-opening checklist tidak ada** | Ops | 🟡 |
| 6 | **Closing checklist tidak ada** | Ops | 🟡 |
| 7 | **Tidak ada dashboard target PCS** | Dashboard | 🟡 |
| 8 | **Tidak ada stock alert di dashboard** | Dashboard | 🟡 |
| 9 | **Material usage tidak terstruktur** | Inventory | 🟡 |
| 10 | **Gas/oil tracking tanpa kategori** | Inventory | 🟡 |
| 11 | **Waste tanpa kategori** | Inventory | 🟡 |
| 12 | **Diskon tidak ada** | POS | 🟡 |
| 13 | **Promo tidak ada** | POS | 🟡 |
| 14 | **Keyboard blocking payment di POS** | UX | 🟡 |
| 15 | **Refund tidak ada di database** | DB | 🔴 |
| 16 | **Cleaning tidak tercatat** | Ops | 🟡 |
| 17 | **Customer complaint tidak tercatat** | Ops | 🟢 |
| 18 | **Equipment issue tidak tercatat** | Ops | 🟢 |
| 19 | **Tidak ada onboarding tooltip** | UX | 🟡 |
| 20 | **Error message teknis muncul ke user** | UX | 🟡 |
| 21 | **"Setoran Belum Diambil" membingungkan** | UX | 🟡 |
| 22 | **Petty cash tidak dijelaskan** | UX | 🟡 |
| 23 | **OTP flow ambiguous** | UX | 🟡 |
| 24 | **Search di POS tanpa debounce** | UX | 🟢 |
| 25 | **Tidak ada "Kirim Barang ke Depo"** | Inventory | 🟡 |
| 26 | **Tidak ada auto-approve expense kecil** | Cash | 🟡 |
| 27 | **Crew tidak bisa lihat target shift** | Dashboard | 🟡 |
| 28 | **Tidak ada gas habis alert** | Inventory | 🟡 |
| 29 | **Skeleton loading terlalu banyak** | UX | 🟢 |
| 30 | **Icon Boxes ambiguous di navigasi** | UX | 🟢 |
| 31 | **Void reason free text — seharusnya pilihan** | Fraud | 🟡 |
| 32 | **Tidak ada end-of-day report cetak** | Ops | 🟡 |
| 33 | **Morning briefing tidak ada** | Ops | 🟢 |
| 34 | **Crew tidak bisa lihat shift summary kemarin** | Dashboard | 🟡 |
| 35 | **Tidak ada "salin laporan"** | Ops | 🟢 |
| 36 | **Stock opname tidak enforce** | Inventory | 🟡 |
| 37 | **Opening cash selalu 0** | Cash | 🟡 |
| 38 | **Tidak ada history expense per crew** | Cash | 🟢 |
| 39 | **Tidak ada peringatan jika stok < 0** | Inventory | 🟡 |
| 40 | **Variance besar tidak auto-flagged** | Cash | 🟡 |
| 41 | **Tidak ada mode malam** | UX | 🟢 |
| 42 | **Tidak ada "pull to refresh"** | UX | 🟢 |
| 43 | **Tidak ada haptic feedback** | UX | 🟢 |
| 44 | **Loading terlalu sering** | UX | 🟡 |
| 45 | **Tidak ada swipe gesture di cart** | UX | 🟢 |
| 46 | **Input terlalu besar untuk 1 tangan** | UX | 🟡 |
| 47 | **Tidak ada shortcut keyboard** | POS | 🟢 |
| 48 | **Barcode scanner tidak ada** | POS | 🟢 |
| 49 | **Customer display tidak ada** | POS | 🟢 |
| 50 | **Tidak ada integrasi dengan platform online** | POS | 🟢 |

---

## BAGIAN 13 — GO-LIVE CHECKLIST

### 🔴 Wajib — Sebelum Go-Live

| # | Item | Status |
|---|------|--------|
| ☐ | **Void threshold & approval** — void > Rp 100.000 butuh second factor | ❌ |
| ☐ | **Error message human-readable** — no technical errors in UI | ⚠️ Partial |
| ☐ | **POS offline fallback** — simpan transaksi lokal jika API down | ❌ |
| ☐ | **Stock opname enforcement** — wajib sebelum shift (setelah fitur dibangun) | ⚠️ Ada alert |
| ☐ | **Cash variance note enforcement** — wajib catat alasan jika variance ≠ 0 | ✅ |
| ☐ | **OTP flow sudah benar** — "Buat Kode Serah Terima" bukan "Setujui & Generate" | ✅ |

### 🟡 Sebaiknya — Sebelum Go-Live

| # | Item | Status |
|---|------|--------|
| ☐ | Pre-opening checklist | ❌ |
| ☐ | Target PCS di dashboard | ❌ |
| ☐ | Stock alert di dashboard | ❌ |
| ☐ | Cleaning checklist di closing | ❌ |
| ☐ | Auto-approve expense ≤ Rp 50.000 | ❌ |
| ☐ | Void dengan reason pilihan (bukan free text) | ❌ |
| ☐ | Shift summary printable | ❌ |
| ☐ | Keyboard scroll fix di POS | ❌ |

### 🟢 Nanti

| # | Item |
|---|------|
| ☐ | Diskon/promo engine |
| ☐ | Barcode scanner |
| ☐ | Customer display |
| ☐ | Komplain pelanggan |
| ☐ | Material usage dashboard |
| ☐ | Refund flow |
| ☐ | Kirim barang ke depo |

---

## BAGIAN 14 — FINAL VERDICT

### 1 Outlet — ✅ LAYAK dengan Catatan

**Layak digunakan**, dengan syarat:
- Owner harus dampingi crew di 1-2 hari pertama
- Pastikan crew paham: buka shift → POS → tutup shift
- Beri training singkat tentang cash withdrawal OTP
- Pantau variance cash setiap hari

**Risiko utama:** Internet mati → POS tidak bisa dipakai.

### 3 Outlet — ⚠️ LAYAK dengan Supervisi

**Butuh persiapan:**
- Void approval threshold harus diimplementasi
- Pre-opening checklist minimal
- Dashboard target PCS
- Stock alert di dashboard

**Risiko utama:** Void fraud, stock tidak akurat (tanpa opname enforcement).

### 10 Outlet — ❌ BELUM LAYAK

**Butuh sebelum scale:**
- Void approval + reason pilihan
- Offline-first POS
- Auto-approve expense kecil
- Material usage tracking (gas, oil)
- Enforce stock opname
- Dashboard monitoring variance
- Approval center untuk owner

**Risiko terlalu besar tanpa ini.**

### Kata Terakhir

> **Sistem secara fundamental sudah benar dan usable.** Flow open shift → POS → close shift berjalan dengan baik. Cash control dengan OTP sudah standar industri. Stock opname sudah mencakup opening/closing.
>
> **Tapi ada 3 hal yang benar-benar perlu diperbaiki sebelum scale:**
>
> 1. **Void approval** — celah fraud terbesar. Void > threshold harus butuh second factor.
> 2. **POS offline** — di F&B, internet bisa mati kapan saja. POS harus tetap jalan.
> 3. **Pre-opening checklist** — tanpa ini, crew tidak standar dalam operasional.
>
> **Untuk 1 outlet minggu depan: siap. Untuk 10 outlet bulan depan: butuh kerja.**

---

*Audit Final — Product Manager POS + F&B Operations Consultant*
*Tidak ada pujian yang tidak layak. Tidak ada kritik yang tidak konstruktif.*
