# UI/UX & WORKFLOW AUDIT — KRUNCUY POS ERP

> **Auditor:** Product Manager POS + UX Designer + F&B Operations Consultant
> **Acuan:** Best practice POS F&B multi-outlet, QSR, Retail POS modern
> **Tanggal:** 11 Juni 2026
> **Scope:** Company-owned multi-outlet (1–100 outlet)

---

## BAGIAN 1 — OVERALL SCORE

| Dimensi | Skor | Alasan |
|---------|------|--------|
| **UI (Visual Design)** | 55/100 | Tampilan modern dengan Tailwind, gradient, card. Tapi inkonsistensi font size, spacing, dan warna antar halaman. Beberapa halaman terlalu padat. |
| **UX (User Experience)** | 50/100 | Flow umum sudah benar. Tapi banyak langkah yang tidak perlu, feedback yang kurang, dan error handling yang membuat bingung. |
| **Crew Workflow** | 45/100 | Crew harus melalui terlalu banyak step untuk task sederhana. Beberapa flow tidak intuitif. |
| **Owner Workflow** | 55/100 | Dashboard kuat, tapi approval flow lambat. Owner harus klik terlalu banyak untuk lihat kondisi real-time. |
| **Cash Workflow** | 50/100 | Konsep petty cash, OTP, dan expense sudah benar. Tapi perbedaan "setoran belum diambil" vs "sisa cash" membingungkan crew baru. |
| **Inventory Workflow** | 60/100 | Transfer depo, opname, dan movement tracking solid. Tapi retur dan waste kurang terstruktur. |
| **Dashboard** | 65/100 | Chart dan KPI bagus. Tapi crew dashboard kurang actionable — terlalu banyak informasi, terlalu sedikit tindakan. |
| **Navigation** | 40/100 | Sidebar ERP terlalu panjang. Crew navigation terlalu sedikit. Pengelompokan menu tidak konsisten. |
| **Learnability** | 35/100 | Sistem sulit dipelajari tanpa training. Banyak istilah teknis (isPurchasable, REQUESTED, POSTED). Tidak ada onboarding. |
| **Operational Efficiency** | 50/100 | Flow checkout efisien. Tapi approval flow, expense, dan stock opname punya terlalu banyak step untuk operasional harian. |

### Overall UX Maturity: **50/100** — "Perlu Perbaikan Signifikan Sebelum Scale"

---

## BAGIAN 2 — SIDEBAR & NAVIGATION AUDIT

### Kondisi Saat Ini

#### ERP Sidebar — 8 Groups, ~40 Items

```
📊 Dashboard
  ├── Overview
  └── Notifikasi

📦 Master Data
  ├── Products, Categories, Branch Pricing, Recipes
  ├── Inventory Items, Suppliers, Customers, Branches
  └── Master Data

🏪 Operations
  ├── Cross Branch, Transactions, Sales Overview
  ├── Stock Opname, Inventory Movement, Warehouse
  ├── Depot Transfer, Returns, Waste Management
  ├── Shipment Tracking, Branch Orders, Operations Log

🛒 Purchasing
  ├── Purchasing Overview, Purchase Request, Purchase Order
  ├── Goods Receipt, Outlet Expenses, Purchasing Queue

💰 Finance
  ├── Cash Sessions, Cash Withdrawals, Cash Control, Payroll

👥 HR
  ├── Users, Branch Assignments, Attendance, Performance

📄 Reports
  └── Reports Center

⚙️ System
  ├── Access Control, Settings, Audit Logs
  ├── Reference, Compliance
```

### Masalah

| # | Masalah | Severity |
|---|---------|----------|
| 1 | **40 menu items terlalu banyak** untuk ERP. User kewalahan. | 🔴 High |
| 2 | **Group "Operations" terlalu besar** — 11 item. Harus dipecah. | 🔴 High |
| 3 | **"Shipment Tracking" dan "Branch Orders"** adalah placeholder tanpa data — hanya menambah clutter. | 🟡 Medium |
| 4 | **HR cuma 4 item** — bisa digabung ke System atau Settings. | 🟢 Low |
| 5 | **"Purchasing Overview"** isinya duplikasi dari "Purchasing Queue". | 🟡 Medium |
| 6 | **"Master Data"** punya 8 item — terlalu banyak untuk 1 group. | 🟡 Medium |
| 7 | **Supplier Invoice** ada di Master Data, bukan di Purchasing — inconsistent. | 🔴 High |
| 8 | **"Cross Branch"** ada di Operations, tapi seharusnya di Dashboard. | 🟡 Medium |
| 9 | **"Cash Control"** isinya duplikasi dari Cash Sessions. | 🟢 Low |
| 10 | **"Compliance"** dan **"Reference"** adalah halaman kosong (EmptyState). | 🟡 Medium |

### Rekomendasi Sidebar Ideal

```
📊 Dashboard
  ├── Overview (default)
  └── Cross Branch

🛒 POS & Sales
  ├── Transactions
  ├── Sales Overview
  └── POS Catalog (crew)

📦 Inventory
  ├── Inventory Items
  ├── Warehouse
  ├── Stock Opname
  ├── Inventory Movement
  └── Waste / Returns

🏭 Purchasing
  ├── Purchase Request
  ├── Purchase Order
  ├── Goods Receipt
  ├── Supplier Invoices
  └── Suppliers

💰 Finance
  ├── Cash Sessions
  ├── Cash Withdrawals
  └── Outlet Expenses

👥 People
  ├── Users
  ├── Crew Performance
  └── Payroll

📈 Reports
  └── Reports Center

⚙️ Settings
  ├── System Settings (GPS, Bonus, Cash Min)
  ├── Access Control
  ├── Audit Log
  └── Master Reference
```

**Perubahan:** 40 item → 26 item. Group "Operations" dipecah ke "Inventory" + "Finance". Group "HR" di-merge ke "People".

---

## BAGIAN 3 — CREW WORKFLOW AUDIT

### Flow Saat Ini

```
Login → Beranda → [Buka Shift] → POS → Jualan
                     ↓                              ↓
               [Stock Opname] ← closing      [Cash Withdrawal]
                     ↓                              ↓
               [Operational] → Retur / Expense / Terima Barang
```

### Masalah

| Step | Masalah | Severity |
|------|---------|----------|
| **Open Shift** | Crew harus buka shift di Beranda, lalu navigate manual ke POS. Harusnya setelah buka shift → auto redirect ke POS. | 🔴 High |
| **POS Checkout** | 5 step (channel → platform → menu → payment → done). Terlalu panjang untuk offline walk-in customer. Offline cukup: menu → bayar. | 🔴 High |
| **Stock Opname** | Terpisah dari shift flow. Crew harus ingat buka opname sebelum shift. Tidak ada reminder atau sequence enforcement. | 🟡 Medium |
| **Cash Withdrawal** | Crew harus ke halaman terpisah. Flow OTP membingungkan — "Setujui & Generate OTP" lalu muncul kode, lalu "Verifikasi". Crew tidak paham bedanya generate vs verify. | 🔴 High |
| **Operational Page** | 3 tab (Terima Barang, Retur, Belanja) — crew jarang paham perbedaannya. Tab "Belanja" menggunakan istilah "isPurchasable" yang teknis. | 🟡 Medium |
| **Expense** | Crew harus isi URL foto struk. Di HP, foto dari kamera harus diupload dulu ke hosting. Tidak praktis. | 🟡 Medium |
| **Close Shift** | Closing cash harus diisi manual. Crew bisa salah input. Harusnya ada expected cash yang ditampilkan sebagai referensi. | 🟡 Medium |

### Perbandingan dengan POS Profesional

| Aspek | POS Profesional | KRUNCUY |
|-------|----------------|---------|
| **Open Shift** | 1 klik → langsung POS | 2 klik (buka shift → navigate ke POS) |
| **Checkout** | 2–3 klik (item → bayar) | 4–5 klik (channel → platform → menu → bayar → done) |
| **Cash Withdrawal** | 1 tombol → uang keluar | 4 step (request → OTP → verify → complete) |
| **Expense** | Input nominal + foto dari kamera | Input + URL foto (tidak praktis) |
| **Close Shift** | Expected cash auto, cashier confirm | Manual input closing cash |
| **Stock Opname** | Otomatis setiap shift (wajib) | Manual — crew bisa skip |

### Rekomendasi

1. Buka shift → auto redirect ke POS
2. Simplify POS: offline checkout = 2 step, online = 3 step
3. OTP flow: cukup "Generate & Tampilkan" → "Verifikasi" — hilangkan "Setujui" yang ambigu
4. Expense: support upload foto langsung (camera capture), bukan URL
5. Close shift: tampilkan expected cash sebagai default, cashier konfirmasi

---

## BAGIAN 4 — OWNER WORKFLOW AUDIT

### Flow Saat Ini

```
Login → ERP Dashboard (overview semua outlet)
  ↓
Cross Branch (detail per outlet)
  ↓
Transactions (cek transaksi)
  ↓
Reports (analisis lebih dalam)
```

### Masalah

| # | Masalah | Severity |
|---|---------|----------|
| 1 | **Approval flow tersebar** — owner harus visit 4 halaman berbeda untuk approve: Cash Withdrawal, Outlet Expense, Purchase Request, Purchase Order. Tidak ada "Approval Center" terpusat. | 🔴 High |
| 2 | **Pending notification tidak real-time** — Notification Center hanya aggregasi, tidak push. Owner harus refresh. | 🟡 Medium |
| 3 | **Cross Branch sudah bagus** tapi tidak ada "drill down" — klik branch → detail branch. | 🟡 Medium |
| 4 | **Stock alert di Notification Center** tapi tidak ada di Dashboard utama. Owner harus buka 2 halaman untuk lihat. | 🟡 Medium |
| 5 | **Cash variance** tidak langsung terlihat di dashboard — harus buka report. | 🟡 Medium |

### Rekomendasi

1. **Approval Center** — satu halaman yang berisi semua pending: withdrawals, expenses, PR, PO. Owner approve/reject dari 1 tempat.
2. **Dashboard Improvement** — tambah widget: "Pending Approval" count, "Stock Alert" count, "Cash Variance" flag.
3. **Notification Badge** — di sidebar, angka merah untuk pending items.

---

## BAGIAN 5 — CASH WORKFLOW AUDIT

### Masalah

| # | Masalah | Severity |
|---|---------|----------|
| 1 | **"Setoran Belum Diambil" vs "Sisa Cash"** — crew baru bingung. Konsep petty cash (Rp 50.000) tidak dijelaskan. | 🔴 High |
| 2 | **OTP flow di Crew** — tombol "Setujui & Generate OTP" membingungkan. Crew pikir mereka approve, padahal hanya generate. | 🔴 High |
| 3 | **Expense photo URL** — crew di HP harus: foto struk → upload ke cloud → copy URL → paste. Terlalu rumit. | 🔴 High |
| 4 | **Cash reconciliation report** sudah ada tapi tidak terintegrasi di close shift flow. | 🟡 Medium |
| 5 | **Petty cash (Rp 50.000)** — konsep "uang yang tidak boleh diambil" tidak dijelaskan dengan baik di UI. | 🟡 Medium |
| 6 | **Closing shift** — tidak menampilkan expected cash. Crew harus hitung manual. Risiko salah input. | 🔴 High |

### Rekomendasi

1. Tambah camera capture langsung di form expense (gunakan input type file, upload ke server)
2. Expected cash otomatis dihitung saat close shift — tampilkan sebagai default
3. Ubah label "Setoran Belum Diambil" menjadi "Uang lebih dari petty cash" dengan tooltip
4. Sederhanakan OTP: "Buat OTP" → tampilkan kode → crew kasih ke owner

---

## BAGIAN 6 — INVENTORY WORKFLOW AUDIT

### Masalah

| # | Masalah | Severity |
|---|---------|----------|
| 1 | **Stock Opname tidak enforce** — crew bisa buka shift tanpa opname. Seharusnya opname wajib sebelum shift. | 🔴 High |
| 2 | **Retur (Operational Page)** — tab "Retur" dan tab "Waste Management" di ERP membingungkan. Apa bedanya? | 🟡 Medium |
| 3 | **Warehouse adjust stock** baru ditambahkan — sudah OK, tapi tidak ada history log untuk adjustment. | 🟡 Medium |
| 4 | **Depot Transfer approve** — crew klik "Sesuai" tanpa lihat detail item (sekarang sudah ada modal detail) — [SUDAH FIX]. | 🟢 Low |
| 5 | **No barcode/scan** — untuk 10+ outlet, scanning barang akan sangat membantu. Tapi MVP mungkin belum perlu. | 🟢 Low |

### Rekomendasi

1. Wajibkan stock opname opening sebelum shift bisa dibuka (frontend validation)
2. Gabung "Retur" dan "Waste" jadi satu tab "Barang Keluar" dengan kategori (RETUR / WASTE / EXPIRED)
3. Tambah log untuk setiap warehouse stock adjustment

---

## BAGIAN 7 — DASHBOARD AUDIT

### Crew Dashboard

| Widget | Ada | Berguna? | Rekomendasi |
|--------|-----|----------|-------------|
| Shift Status | ✅ | ✅ Sangat berguna | — |
| Today's Sales (Omzet) | ✅ | ✅ | OK, sudah bagus |
| Payment Chart | ✅ | ✅ | Stacked bar + legenda sudah informatif |
| Ringkasan Cash | ✅ | ✅ | —
| Setoran Belum Diambil | ✅ | ⚠️ Membingungkan | Ubah label + tambah tooltip |
| Estimated Bonus | ✅ | ✅ | —
| Daily Tasks Checklist | ✅ | ✅ | OK |

### ERP Dashboard (Owner)

| Widget | Ada | Berguna? | Rekomendasi |
|--------|-----|----------|-------------|
| Omzet Online/Offline | ✅ | ✅ | Sangat informatif |
| PCS vs Target | ✅ | ✅ | Progress bar jelas |
| Sales Trend 7 Hari | ✅ | ✅ | Area chart bagus |
| Payment Donut | ✅ | ✅ | —
| Branch Bars | ✅ | ✅ | —
| Weekly Growth | ✅ | ✅ | —
| Branch Snapshots | ✅ | ✅ | Bisa diklik untuk detail? Tidak. |
| **Pending Approval Count** | ❌ | 🔴 Kritis | Harus ada! |
| **Stock Alert Count** | ❌ | 🟡 Penting | Ada di Notification Center, tidak di dashboard |

### Cross Branch Dashboard

| Widget | Ada | Berguna? |
|--------|-----|----------|
| Summary cards | ✅ | ✅ |
| Branch comparison table | ✅ | ✅ |
| Growth indicators | ✅ | ✅ |

---

## BAGIAN 8 — TOP 30 UX PROBLEMS

| Rank | Problem | Area | Impact |
|------|---------|------|--------|
| 1 | **OTP flow ambiguous** — "Setujui & Generate" membuat crew bingung | Crew | 🔴 Fraud risk |
| 2 | **Close shift without expected cash** — crew harus hafal atau hitung manual | Cash | 🔴 Human error |
| 3 | **POS offline 5 steps** — terlalu panjang untuk walk-in customer | POS | 🔴 Speed |
| 4 | **No approval center** — owner harus cek 4 halaman berbeda | Owner | 🔴 Efficiency |
| 5 | **Expense photo URL** — crew HP tidak bisa upload langsung | Crew | 🔴 Usability |
| 6 | **Stock opname not enforced** — crew bisa skip, stok tidak akurat | Inventory | 🔴 Data integrity |
| 7 | **Sidebar 40 items** — overload informasi, user kewalahan | Navigation | 🟡 Usability |
| 8 | **"Setoran Belum Diambil" unclear** — crew tidak paham konsep petty cash | Cash | 🟡 Confusion |
| 9 | **No onboarding/empty state guidance** — halaman kosong tidak kasih petunjuk | UX | 🟡 Learnability |
| 10 | **Supplier Invoice di Master Data** — harusnya di Purchasing | Navigation | 🟡 Confusion |
| 11 | **No barcode/scan support** — input item manual lambat | POS | 🟡 Speed |
| 12 | **Cancel/close button inconsistency** — ada yang "×", ada "Tutup", ada "Batal" | UX | 🟡 Consistency |
| 13 | **Modal vs Drawer inconsistency** — kadang modal, kadang drawer untuk fungsi mirip | UX | 🟡 Consistency |
| 14 | **No "back" navigation on many pages** — user terjebak di halaman detail | UX | 🟡 Usability |
| 15 | **Loading states inconsistent** — ada skeleton, ada spinner, ada "Loading..." text | UX | 🟡 Consistency |
| 16 | **Error messages too technical** — kadang "Cannot read property" instead of "Gagal memuat" | UX | 🟡 Clarity |
| 17 | **Delete without confirmation** — beberapa tempat langsung hapus tanpa konfirmasi | UX | 🟡 Safety |
| 18 | **Date picker format inconsistent** — ada yang "date" input, ada text | UX | 🟡 Consistency |
| 19 | **No keyboard shortcuts** — untuk POS, keyboard shortcut penting untuk speed | POS | 🟡 Efficiency |
| 20 | **POS item search missing** — harus scroll semua produk | POS | 🟡 Speed |
| 21 | **Pagination position inconsistent** — ada di atas, ada di bawah, ada di kedua | UX | 🟡 Consistency |
| 22 | **No bulk actions** — harus edit item satu-satu (misal: nonaktifkan 10 produk) | UX | 🟡 Efficiency |
| 23 | **Filter kadang server-side, kadang client-side** — membingungkan | UX | 🟡 Consistency |
| 24 | **No "select all" in table** — harus centang satu-satu | UX | 🟡 Efficiency |
| 25 | **Success message inconsistency** — kadang toast, kadang alert, kadang modal | UX | 🟡 Consistency |
| 26 | **No debounce on search input** — setiap karakter trigger API call | UX | 🟡 Performance |
| 27 | **Mobile responsiveness partial** — beberapa halaman tidak mobile-friendly | UX | 🟡 Usability |
| 28 | **No print receipt from POS properly formatted** — window.print() raw | POS | 🟡 Quality |
| 29 | **Empty state "Belum ada data" tanpa action** — user tidak tahu harus ngapain | UX | 🟡 Guidance |
| 30 | **No dark mode consistent** — ThemeToggle ada tapi tidak sempurna | UX | 🟡 Quality |

---

## BAGIAN 9 — WORKFLOW REDESIGN

### Ideal Outlet Operation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ PRE-OPENING (5 menit)                                       │
│                                                             │
│ 1. Crew login → otomatis diarahkan ke halaman shift          │
│ 2. Stock Opname Opening (WAJIB) — input fisik → otomatis    │
│ 3. Buka Shift (GPS) → redirect ke POS                       │
│                                                             │
│ Tujuan: Pastikan stok awal akurat sebelum jualan            │
│ Output: Shift OPEN, StockOpname OPENING selesai             │
│ Risiko dicegah: Stok tidak akurat, fraud opening shift       │
├─────────────────────────────────────────────────────────────┤
│ SELLING PERIOD                                               │
│                                                             │
│ 4. POS Checkout (default offline)                            │
│    - Scan/search produk → pilih qty → bayar → selesai       │
│    - Online: channel → platform → menu → bayar              │
│ 5. Void (jika perlu) — reason pilihan, approval jika > limit│
│                                                             │
│ Tujuan: Transaksi cepat dan akurat                           │
│ Output: Transaction COMPLETED / VOID                         │
│ Risiko dicegah: Fraud void, salah input                      │
├─────────────────────────────────────────────────────────────┤
│ OPERATIONAL EVENTS (selama shift)                            │
│                                                             │
│ 6. Terima Barang dari Depo — 1 klik approve → stock +       │
│ 7. Expense Darurat — nominal + foto (camera) → submit       │
│ 8. Retur/Waste — pilih item + kategori + qty → submit       │
│ 9. Cash Withdrawal — request → OTP (dari HP/WA) → verify    │
│                                                             │
│ Tujuan: Operasional berjalan tanpa hambatan                  │
│ Output: Stock movement, expense tercatat                     │
│ Risiko dicegah: Barang tidak tercatat, expense fiktif        │
├─────────────────────────────────────────────────────────────┤
│ CLOSING (10 menit)                                           │
│                                                             │
│ 10. Stock Opname Closing — input fisik → variance terhitung  │
│ 11. Close Shift — expected cash ditampilkan → konfirmasi     │
│     → Cash variance langsung ketahuan                        │
│ 12. Otomatis: ringkasan shift (sales, PCS, cash, variance)  │
│                                                             │
│ Tujuan: Rekonsiliasi harian selesai                          │
│ Output: Shift CLOSED, StockOpname CLOSING selesai           │
│ Risiko dicegah: Selisih cash tidak terdeteksi                │
├─────────────────────────────────────────────────────────────┤
│ OWNER REVIEW (pagi hari)                                     │
│                                                             │
│ 13. Login → Dashboard → lihat semua outlet                   │
│ 14. Approval Center — approve/reject pending items           │
│ 15. Exception Report — outlet dengan variance besar          │
│                                                             │
│ Tujuan: Kontrol penuh, tidur nyenyak                         │
│ Output: Semua approved/reviewed                              │
│ Risiko dicegah: Fraud tidak terdeteksi                       │
└─────────────────────────────────────────────────────────────┘
```

---

## BAGIAN 10 — WHAT WOULD YOU REMOVE?

| Item | Alasan |
|------|--------|
| **"Purchasing Overview" page** | Duplikasi dari "Purchasing Queue" — hapus atau merge |
| **"Compliance" page** | Tidak ada data — hapus sampai ada fitur compliance |
| **"Reference" page** | Tidak ada data — hapus atau gabung dengan Master Data |
| **"Cash Control" page** | Duplikasi dari Cash Sessions — hapus |
| **"Branch Orders" page** | Tidak ada data — hapus sampai ada fitur |
| **"Shipment Tracking" page** | Tidak ada data — hapus atau gabung dengan Depot Transfer |
| **"Operations Log" page** | Duplikasi dari Audit Log — hapus |
| **OTP flow "Setujui" button** | Ganti dengan "Buat OTP" — lebih jelas |
| **Upload photo URL field** | Ganti dengan file upload langsung (camera) |
| **Step "channel" di POS offline** | POS offline tidak perlu pilih channel — default OFFLINE |

**Total dihapus: 7 halaman + 3 elemen UI.** Sidebar dari 40 → ~30 item.

---

## BAGIAN 11 — WHAT WOULD YOU BUILD NEXT?

Berdasarkan dampak terhadap operasional (bukan teknis):

| Rank | Improvement | Dampak | Effort |
|------|-------------|--------|--------|
| 1 | **Approval Center** — 1 halaman untuk semua pending approval | 🔴 Owner efficiency | 2 hari |
| 2 | **Expected cash di close shift** — tampilkan otomatis, kurangi human error | 🔴 Cash accuracy | 1 hari |
| 3 | **Simplify POS offline** — 2 step (item → bayar) | 🔴 Speed | 2 hari |
| 4 | **Camera capture untuk expense** — upload langsung dari HP | 🔴 Usability | 1 hari |
| 5 | **Auto-redirect ke POS setelah open shift** | 🔴 Crew speed | 0.5 hari |
| 6 | **Wajibkan stock opname sebelum shift** | 🔴 Inventory accuracy | 1 hari |
| 7 | **Sidebar restructure** — 40 → ~30 item | 🟡 Navigation | 1 hari |
| 8 | **OTP flow rename** — "Buat OTP" bukan "Setujui & Generate" | 🟡 Clarity | 0.5 hari |
| 9 | **Pending approval badge di sidebar** | 🟡 Awareness | 1 hari |
| 10 | **POS product search** — cari produk by name/code | 🟡 Speed | 1 hari |
| 11 | **Enforce stock opname closing before close shift** | 🟡 Data integrity | 1 hari |
| 12 | **Drill-down dari Cross Branch ke detail branch** | 🟡 Owner insight | 2 hari |
| 13 | **Keyboard shortcut untuk POS (F1-F8)** | 🟡 Speed | 3 hari |
| 14 | **Refund flow** — partial refund, beda dengan void | 🟡 Business | 3 hari |
| 15 | **Auto-approve expense kecil (≤ Rp 50.000)** | 🟡 Efficiency | 1 hari |
| 16 | **Barcode/QR scan untuk POS dan inventory** | 🟡 Speed | 5 hari |
| 17 | **Onboarding tooltip untuk halaman baru** | 🟡 Learnability | 3 hari |
| 18 | **Mobile camera untuk stock opname (foto fisik)** | 🟡 Audit trail | 2 hari |
| 19 | **Scheduled report via email** | 🟡 Owner convenience | 2 hari |
| 20 | **Dark mode fix** | 🟡 Quality | 1 hari |

---

## BAGIAN 12 — FINAL VERDICT

### Apakah Sistem Ini Sudah Layak?

| Outlet | Layak? | Syarat |
|--------|--------|--------|
| **1 outlet** | ✅ **Layak dengan supervisi** | Owner harus dampingi crew di 1-2 minggu pertama. Risiko utama: crew bingung dengan OTP flow dan close shift. |
| **3 outlet** | ⚠️ **Layak dengan catatan** | Wajib perbaiki: (1) Approval center, (2) Expected cash di close shift, (3) Simplify POS offline. Tanpa ini, 3 outlet akan kacau. |
| **10 outlet** | ❌ **Belum layak** | Butuh: (1) Simplifikasi flow, (2) Enforce stock opname, (3) Auto-approve threshold, (4) Dashboard pending notification. |

### 3 Hal yang Paling Penting untuk Scale

1. **Approval Center** — tanpa ini, owner di 3+ outlet akan kewalahan approve di 4 halaman terpisah
2. **Simplify Crew Flow** — POS offline harus 2 klik, bukan 5. Close shift harus auto-calculate expected cash
3. **Enforce Stock Opname** — tanpa ini, inventory accuracy akan turun drastis di 3+ outlet

### Kata Terakhir

> **KRUNCUY POS ERP secara fungsional sudah kuat — modul bisnisnya lengkap, datanya terstruktur, RBACnya matang. Tapi secara UX, sistem ini masih terasa seperti "kumpulan fitur" bukan "produk jadi."**
> 
> *Seorang Product Manager POS tidak akan bertanya "fitur apa lagi yang kurang?" tetapi "bagaimana saya membuat crew selesai lebih cepat?"*
>
> **Fokus ke simplification, bukan addition.**

---

*Audit oleh Product Manager POS + F&B Operations Consultant*
*Tidak ada pujian yang tidak layak. Tidak ada kritik yang tidak konstruktif.*
