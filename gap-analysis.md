# GAP ANALYSIS — KRUNCUY POS ERP

> **Tanggal:** 11 Juni 2026
> **Audit Basis:** `report.md`, `execution-plan.md`, `backlog.md`, `e2e-test-plan.md`, source code
> **Scope:** Multi-Outlet Company-Owned (1–100 outlet)
> **Franchise:** EXCLUDED

---

## BAGIAN 1 — MODUL YANG SUDAH ADA

| Modul | Status | Kematangan | Catatan |
|-------|--------|-----------|---------|
| **Authentication** | Ada | ✅ Production Ready | JWT + refresh token + httpOnly cookie. Login valid untuk semua role. |
| **RBAC / Access Control** | Ada | ✅ Mature | 5 role, ~50 permissions, frontend sidebar filtering, backend middleware chain. |
| **Branch Management** | Ada | ✅ Production Ready | CRUD branch, GPS coordinate, isActive flag. |
| **User Management** | Ada | ✅ Production Ready | CRUD user, role assignment, branch home base. |
| **Product Management** | Ada | ✅ Production Ready | CRUD produk, kategori, branch pricing, variants per platform. |
| **Menu Recipe** | Ada | ✅ Production Ready | BOM dengan sub-recipe (nested). Cost tracking via inventory deduction. |
| **POS Checkout** | Ada | ✅ Production Ready | Cash, QRIS, Split, Online (GoFood/Grab/Shopee). Multi-step flow. |
| **Transaction Management** | Ada | ✅ Production Ready | List, void, today's transactions. Pagination implemented. |
| **Inventory Management** | Ada | ✅ Production Ready | Items, branch stock, movement tracking, waste, adjustment. |
| **Warehouse Management** | Ada | ✅ Production Ready | Warehouse CRUD, stock, movement, transfer. Bebas branch. |
| **Depot Transfer** | Ada | ✅ Production Ready | Warehouse → Branch, approval flow, cost tracking, FIFO. |
| **Cash Session** | Ada | ✅ Production Ready | Open/close shift, GPS validation, opening/closing cash. |
| **Cash Withdrawal** | Ada | ✅ Production Ready | OTP flow, rate limit, approval chain. OTP leak fixed. |
| **Outlet Expense** | Ada | ✅ Production Ready | Request → approve → stock +, cost tracking via ItemPurchaseLot. |
| **Purchase Request** | Ada | ✅ Production Ready | DRAFT → SUBMITTED → APPROVED → ORDERED. Pagination. |
| **Purchase Order** | Ada | ✅ Production Ready | DRAFT → SENT → APPROVED → RECEIVED. Link ke PR. Warehouse support. |
| **Goods Receipt** | Ada | ✅ Production Ready | Partial receipt, PO status update, cost tracking (ItemPurchaseLot + InventoryCostHistory). |
| **Supplier Invoice** | Ada | ✅ Production Ready | CRUD invoice, payment tracking, auto status (PENDING → PARTIAL → PAID). |
| **Supplier Payment** | Ada | ✅ Production Ready | Create payment, auto update invoice status. |
| **Accounts Payable Aging** | Ada | ✅ Production Ready | Report aging 0-30, 31-60, 61-90, 90+ hari. |
| **Supplier Management** | Ada | ✅ Production Ready | CRUD supplier, soft-delete, purchase history. |
| **Customer Management** | Ada | ✅ Production Ready | CRUD customer, transaksi history, search. |
| **Payroll** | Ada | ⚠️ Basic | Calculate → create → approve → pay. Hardcoded bonus sebelumnya, sudah di-system-setting. Tapi belum ada BPJS, PPh, lembur otomatis. |
| **Crew Performance** | Ada | ✅ Basic | Monthly PCS tracking, target vs actual, bonus estimation, calendar view. |
| **Attendance** | Ada | ✅ Basic | Check-in/check-out, tanggal unik per user. |
| **Stock Opname** | Ada | ✅ Production Ready | Opening/closing opname, variance tracking, oil/gas tracking untuk closing. |
| **ERP Dashboard** | Ada | ✅ Production Ready | Charts (area, bar, pie, donut), KPIs, date filter, branch filter, online/offline breakdown, PCS target. |
| **Cross Branch Dashboard** | Ada | ✅ Production Ready | Perbandingan semua outlet, sales, PCS, growth, low stock alert. |
| **Dynamic Reports** | Ada | ✅ Production Ready | 33 report definitions, Excel/PDF export, filter bar, pagination. |
| **Audit Trail** | Ada | ✅ Production Ready | Immutable action log, search, pagination, entity filter. |
| **Notification Center** | Ada | ✅ Basic | Aggregasi alert stok, pending withdrawal, pending expense. Belum real-time push. |
| **Settings** | Ada | ✅ Production Ready | System settings, feature flags, bonus config, GPS toggle, cash minimum. |
| **Branch Assignment** | Ada | ✅ Production Ready | Crew → branch assignment with date range. |
| **Master Data (reference)** | Ada | ✅ Basic | Reference data API, units, channels, platforms. |

### Summary Kematangan

| Level | Count | Modul |
|-------|-------|-------|
| **Mature** | 2 | RBAC, Branch Management |
| **Production Ready** | 24 | Auth, Products, Recipe, POS, Transactions, Inventory, Warehouse, Depot Transfer, Cash Session, Cash Withdrawal, Outlet Expense, PR, PO, GR, Supplier Invoice, Supplier Payment, AP Aging, Supplier, Customer, Stock Opname, ERP Dashboard, Cross Branch, Dynamic Reports, Audit Trail, Settings, Branch Assignment |
| **Basic** | 5 | Payroll, Crew Performance, Attendance, Notification Center, Master Data |

---

## BAGIAN 2 — MODUL YANG BELUM ADA

| Modul | Prioritas | Untuk | Alasan |
|-------|-----------|-------|--------|
| **Purchase Return / Debit Note** | 🔴 High | 1 outlet | Barang rusak/salah kirim — tidak bisa return. Model sudah ada di schema, backend belum diimplementasi. |
| **GR Void / Cancel** | 🔴 High | 1 outlet | GR salah — tidak bisa dibatalkan. Stock terlanjur naik. |
| **Discount / Promo Engine** | 🟡 Medium | 3 outlet | Tidak ada diskon per item, promo buy-get, atau voucher. Untuk F&B ini penting. |
| **Production Batch** | 🟡 Medium | 3 outlet | Untuk central kitchen — produksi dalam batch besar, track yield variance. |
| **E2E Test Suite** | 🔴 High | 1 outlet | Hanya 7 Playwright test. Perlu minimal 20+ untuk P0 coverage. |
| **Performance / Load Test** | 🟡 Medium | 10 outlet | Script k6 sudah ada, belum pernah dijalankan. |
| **CRM / Loyalty Program** | 🟢 Low | 30 outlet | Customer tracking sudah ada, tapi tidak ada poin/rewards. |
| **Multi-Currency** | 🟢 Low | 100 outlet | Tidak relevan untuk F&B lokal saat ini. |
| **General Ledger / Accounting** | 🟢 Low | 30 outlet | Tidak ada jurnal akuntansi, P&L, balance sheet. Untuk ERP serius ini penting. |
| **API Documentation** | 🟡 Medium | 3 outlet | Tidak ada Swagger/OpenAPI. Integrasi pihak ketiga sulit. |
| **Webhook / Integration** | 🟢 Low | 30 outlet | Tidak ada event webhook untuk integrasi eksternal. |

---

## BAGIAN 3 — BUSINESS FLOW GAP

### POS Flow

| Aspek | Nilai | Alasan |
|-------|-------|--------|
| Checkout cash | ✅ Sudah benar | Multi-step flow, payment method lengkap |
| Checkout QRIS | ✅ Sudah benar | Fixed amount |
| Checkout Split | ✅ Sudah benar | 50:50 atau custom split |
| Checkout Online | ✅ Sudah benar | GoFood, GrabFood, ShopeeFood |
| Void transaksi | ⚠️ Perlu revisi | Void langsung reverse stock tanpa approval. Seharusnya butuh second factor atau approval untuk void bernilai besar. |
| Diskon | ❌ Missing step | Tidak ada diskon per item atau per transaksi |
| Refund | ❌ Missing step | Tidak ada flow refund terpisah — void adalah satu-satunya cara |
| Customer link | ⚠️ Kurang efisien | Customer bisa diisi manual, tapi tidak mandatory. POS seharusnya bisa quick-select customer. |
| Extra sauce tracking | ⚠️ Kurang efisien | PCS untuk extra sauce dihitung manual. Perlu dibedakan dari core PCS. |

### Inventory Flow

| Aspek | Nilai | Alasan |
|-------|-------|--------|
| Stock deduction via recipe | ✅ Sudah benar | Sub-recipe support, recursive resolution |
| Stock reversal via void | ✅ Sudah benar | Adjust direction=+1 |
| Branch stock management | ✅ Sudah benar | BranchInventoryItem upsert |
| Warehouse stock | ✅ Sudah benar | WarehouseStock + movement |
| Depot Transfer | ✅ Sudah benar | Full cost tracking, approval flow |
| Stock Opname | ✅ Sudah benar | Opening/closing, variance |
| Waste tracking | ⚠️ Perlu revisi | Waste tercatat tapi tidak ada kategori waste (produksi, kadaluarsa, rusak). Juga tidak ada approval untuk waste nilai besar. |
| Retur ke supplier | ❌ Missing step | Purchase Return model ada, backend belum diimplementasi |
| GR Void | ❌ Missing step | Tidak bisa batalkan GR yang salah |
| Production Batch | ❌ Missing step | Untuk central kitchen, produksi batch tidak ter-track |

### Purchasing Flow

| Aspek | Nilai | Alasan |
|-------|-------|--------|
| PR → PO → GR | ✅ Sudah benar | Full cycle, status management |
| Partial receipt | ✅ Sudah benar | PO → PARTIALLY_RECEIVED, qtyReceived tracking |
| Supplier Invoice | ✅ Sudah benar | Manual entry, payment tracking |
| Supplier Payment | ✅ Sudah benar | Auto-update invoice status |
| AP Aging | ✅ Sudah benar | Report aging buckets |
| Overdue detection | ⚠️ Perlu revisi | OVERDUE status ada di enum tapi tidak pernah di-set otomatis. Butuh scheduler. |
| Purchase Return | ❌ Missing step | Model sudah ada, backend belum |
| Auto invoice from GR | ❌ Missing step | Invoice harus di-entry manual — tidak auto-generate dari GR |

### Cash Flow

| Aspek | Nilai | Alasan |
|-------|-------|--------|
| Open/close shift | ✅ Sudah benar | GPS validation, opening/closing cash |
| Cash withdrawal OTP | ✅ Sudah benar | Request → OTP → verify, rate limited |
| Outlet expense | ✅ Sudah benar | Request → approve, stock +, cost tracking |
| Petty cash | ✅ Sudah benar | Setting cash_minimum_outlet |
| Cash reconciliation | ✅ Sudah benar | Report expected vs actual cash |
| Daily cash report | ⚠️ Perlu revisi | Report sudah ada, tapi tidak ada automated daily summary |
| Expense approval threshold | ⚠️ Kurang efisien | Semua expense butuh approval. Tidak ada threshold untuk expense kecil yang bisa auto-approve. |

### Payroll Flow

| Aspek | Nilai | Alasan |
|-------|-------|--------|
| Calculate bonus | ✅ Sudah benar | Baca system setting, hitung dari PCS |
| Payroll lifecycle | ✅ Sudah benar | DRAFT → APPROVED → PAID |
| Attendance → payroll | ✅ Sudah benar | Attendance count included in calculation |
| BPJS / tax | ❌ Missing step | Tidak ada perhitungan BPJS, PPh 21 |
| Overtime auto-calc | ⚠️ Kurang efisien | Overtime bisa diisi manual, tidak ada auto-kalkulasi |
| Leave management | ❌ Missing step | Tidak ada cuti, izin, sakit |
| 13th month / THR | ❌ Missing step | Tidak ada perhitungan THR |

### Reporting Flow

| Aspek | Nilai | Alasan |
|-------|-------|--------|
| 33 report definitions | ✅ Sudah benar | Coverage luas (sales, inventory, cash, crew) |
| Excel export | ✅ Sudah benar | xlsx library |
| PDF export | ✅ Sudah benar | jsPDF + autotable |
| Date filter | ✅ Sudah benar | Date range on all reports |
| Branch filter | ✅ Sudah benar | Branch selection |
| Pagination | ✅ Sudah benar | Meta pagination response |
| Cross-branch comparison | ✅ Sudah benar | Cross Branch Dashboard |
| Automated schedule | ❌ Missing step | Tidak ada report scheduling (daily email, auto-generate) |
| Trend analysis | ⚠️ Kurang efisien | Dashboard ada area chart 7 hari, tapi tidak ada month-over-month atau year-over-year |

---

## BAGIAN 4 — TOP 20 KELEMAHAN TERBESAR

| Rank | Kelemahan | Kategori | Dampak |
|------|-----------|----------|--------|
| 1 | **Tidak ada validation untuk void nominal besar** | Fraud | Crew bisa void transaksi Rp 10 juta tanpa approval. Void langsung reverse stock tanpa audit khusus. |
| 2 | **Purchase Return tidak diimplementasi** | Data Integrity | Barang rusak/salah kirim tidak bisa diretur ke supplier. Stok dan biaya tidak bisa dikoreksi. |
| 3 | **GR tidak bisa di-void** | Data Integrity | GR salah → stok terlanjur naik. Tidak ada mekanisme koreksi. Satu-satunya cara: adjustment manual. |
| 4 | **Tidak ada scheduler/background job** | Operational Risk | OVERDUE status tidak pernah di-set. Setting cache tidak pernah di-refresh. Backup tidak otomatis. |
| 5 | **Overdue invoice tidak terdeteksi otomatis** | Operational Risk | Invoice lewat jatuh tempo tetap status PENDING. Tidak ada notifikasi. Utang tidak terkontrol. |
| 6 | **Tidak ada diskon/promo** | Business | F&B tanpa promo = rugi. Tidak bisa bundle, diskon member, atau flash sale. |
| 7 | **Produksi batch tidak ter-track** | Operational Risk | Untuk F&B yang produksi sendiri, tidak ada visibility yield variance. Food cost tidak akurat. |
| 8 | **Retur ke supplier tidak bisa (Purchase Return)** | Data Integrity | Sudah di #2 — dimasukkan dua kali karena severity tinggi. |
| 9 | **Test coverage masih 0.3%** | Scalability | 4 test files + 7 Playwright = tidak cukup untuk 146 endpoint. Satu refactor bisa rusak tanpa sadar. |
| 10 | **Payroll tidak ada BPJS/PPh** | Operational Risk | Saat employe resmi, BPJS dan PPh 21 wajib. Tanpa ini payroll tidak bisa dipakai untuk kary tetap. |
| 11 | **Tidak ada approval threshold untuk expense** | Operational Risk | Expense kecil (Rp 5.000) harus melalui approval flow yang sama dengan expense besar (Rp 5.000.000). Tidak efisien. |
| 12 | **Void transaction tanpa reason yang terstruktur** | Audit | Reason untuk void berupa free text. Seharusnya pilihan alasan (salah input, cancel, refund) untuk audit. |
| 13 | **Customer tidak mandatory di POS** | Business | Transaksi tanpa identitas customer. Tidak bisa CRM, loyalitas, atau riwayat. |
| 14 | **Diskon tidak ada** | Business | Poin 6 — duplikasi untuk emphasis. |
| 15 | **Tidak ada refund flow** | Business | Refund dan void adalah beda proses. Refund bisa partial, void adalah total. Tidak ada partial refund. |
| 16 | **Report scheduling tidak ada** | Operational | Owner harus buka sistem setiap hari untuk laporan. Tidak ada auto-email. |
| 17 | **Tidak ada performance load test** | Scalability | Script k6 ada tapi belum pernah jalan. Tidak tahu pasti apakah sistem handle 100 POS concurrent. |
| 18 | **GR dengan warehouseId belum di-test penuh** | Data Integrity | Fitur warehouseId di GR masih baru. Belum di-test untuk partial receipt ke warehouse. |
| 19 | **Search di beberapa page tidak konsisten** | UX | Ada page pakai search, ada yang tidak. Filter kadang client-side, kadang server-side. |
| 20 | **Tidak ada auto-backup scheduler** | Operational | Script backup ada tapi tidak dijadwalkan otomatis. Risiko data loss. |

---

## BAGIAN 5 — JIKA MEMBUKA 3 OUTLET BESOK

### Yang Akan Berjalan Baik ✅

1. **POS checkout** — cash, QRIS, split, online semua jalan
2. **Shift management** — open, close, GPS validation
3. **Cash withdrawal OTP** — aman dengan rate limit
4. **Inventory deduction via recipe** — otomatis, termasuk sub-recipe
5. **Branch isolation** — crew Tugu hanya lihat data Tugu
6. **ERP Dashboard** — owner lihat semua outlet dalam 1 layar
7. **Cross Branch** — perbandingan performa outlet
8. **Dynamic reports** — 33+ report siap pakai

### Yang Berpotensi Bermasalah ⚠️

1. **Tidak ada diskon/promo** — 3 outlet butuh promo launching. Sistem belum siap.
2. **Void tanpa approval** — crew outlet A void transaksi besar tanpa kontrol owner.
3. **Purchase Return** — supplier kirim barang rusak, tidak ada flow retur.
4. **GR Void** — admin salah input GR, stok terlanjur naik, tidak bisa dibatalkan.
5. **Payroll tanpa BPJS** — jika ada karyawan tetap, BPJS wajib. Sistem tidak siap.
6. **Test coverage** — 0.3% coverage. Setiap perubahan berisiko regresi.

### Wajib Diperbaiki dalam 30 Hari 🔴

| Priority | Item | Estimasi |
|----------|------|----------|
| 🔴 P1 | Implementasi Purchase Return backend | 2 hari |
| 🔴 P1 | Void approval threshold (void > X butuh second factor) | 1 hari |
| 🔴 P1 | GR void — reverse stock | 1 hari |
| 🟡 P2 | E2E test P0 (auth, POS, cash) | 3 hari |
| 🟡 P2 | Restock mekanisme diskon/promo minimal (persentase) | 3 hari |

---

## BAGIAN 6 — JIKA MEMBUKA 10 OUTLET

### Bottleneck Terbesar

| Bottleneck | Dampak |
|-----------|--------|
| **Semua expense need approval** | 10 outlet × 5 expense/hari = 50 approval/hari. Admin kewalahan. |
| **Payroll manual per crew** | 10 outlet × 5 crew = 50 payroll entries per bulan. Tidak scalable. |
| **Tidak ada scheduled report** | Owner harus buka dashboard 10 outlet satu per satu. |
| **Performance belum teruji** | 10 outlet × 100 transaksi/hari = 1.000 transaksi/hari. Query belum di-load test. |
| **No central kitchen / production tracking** | 10 outlet butuh suplai dari pusat. Tidak ada production batch planning. |

### Risiko Terbesar

| Risiko | Severity | Mitigasi |
|--------|----------|----------|
| Void fraud 10× lipat | 🔴 High | Implement void threshold approval |
| Stock mismatch antar outlet | 🔴 High | Stock opname rutin + variance report |
| Payroll salah hitung | 🟡 Medium | Integration test payroll + manual review |
| Cash reconciliation lambat | 🟡 Medium | Automated daily cash report |

### Prioritas Berikutnya

1. Auto-approve threshold untuk expense kecil (≤ Rp 50.000 auto-approve)
2. Scheduled report via email (daily sales summary ke owner)
3. Load test dengan 100 concurrent users
4. Production batch untuk central kitchen
5. Refund flow (partial refund)

---

## BAGIAN 7 — JIKA MEMBUKA 30–100 OUTLET

### Yang Harus Dirombak 🔄

| Area | Yang Dirombak | Alasan |
|------|--------------|--------|
| **Payroll** | Harus auto-calculate BPJS + PPh + THR | 100 outlet × 5 crew = 500 payroll. Manual tidak mungkin. |
| **Inventory** | Batch/lot management + expiry date | Makanan kadaluarsa di 100 outlet = waste besar. |
| **Procurement** | Central purchasing dengan supplier contract | 100 outlet beli sendiri = harga tidak standar. Perlu purchasing pusat. |
| **Reporting** | Consolidated financial statement | 100 outlet perlu P&L konsolidasi, bukan per-outlet. |
| **Infrastructure** | Database read replica + connection pooling | 100 outlet × 200 query/hari = 20.000 query/hari. Single DB tidak cukup. |

### Yang Harus Dipersiapkan

1. **Database replication** — Pisahkan read/write connection. Report query jangan ganggu transaksi POS.
2. **Caching layer** — Redis untuk catalog POS, settings, branch data. Kurangi DB load.
3. **Message queue** — Event-driven inventory. Transaksi → publish event → async update stock.
4. **API rate limiting per tenant** — Bukan global rate limit. Satu outlet abuse jangan ganggu outlet lain.
5. **Monitoring & alerting** — Error rate, response time P99, stock alert, cash anomaly. Real-time.
6. **GDPR / data privacy** — 100 outlet = banyak data pelanggan. Perlu kebijakan data.

### Yang Harus Diukur

| Metric | Target | Alat |
|--------|--------|------|
| POS checkout latency | < 500ms P99 | APM (Sentry) |
| API response time | < 200ms P50, < 1s P95 | Logger + monitoring |
| Error rate | < 0.1% | Sentry |
| Database query time | < 50ms average | Prisma logging |
| Stock accuracy | > 99% | Opname variance report |
| Cash variance | < 0.5% | Cash reconciliation |
| Uptime | > 99.9% | Health check + monitoring |
| Test coverage | > 60% | CI pipeline |

---

## BAGIAN 8 — FINAL SCORE

| Dimensi | Skor (0–100) | Alasan |
|---------|-------------|--------|
| **Business Process** | **65/100** | Sebagian besar flow sudah benar (POS, purchasing, inventory, cash). Gap utama: diskon/promo, refund, purchase return. |
| **ERP Completeness** | **55/100** | Dari 25 modul ERP dasar, ~20 sudah ada. Tapi payroll masih basic (no BPJS/PPh), tidak ada production, tidak ada GL. |
| **Security** | **70/100** | OTP leak fixed, permission escalation fixed, rate limiter aktif. Tapi void tanpa approval, tidak ada audit untuk void besar. JWT di sessionStorage (lebih aman dari localStorage tapi masih rentan XSS). |
| **Inventory Control** | **75/100** | Branch + warehouse + movement + sub-recipe + cost tracking (ItemPurchaseLot + InventoryCostHistory). Gap: purchase return, GR void, waste kategori, expiry date. |
| **Cash Control** | **70/100** | OTP flow, cash session, expense approval, reconciliation report. Gap: tidak ada threshold auto-approve, overdue invoice tidak auto-detect. |
| **Purchasing** | **65/100** | PR → PO → GR → Invoice → Payment — siklus lengkap. Gap: purchase return, GR void, auto-invoice dari GR. |
| **Payroll** | **35/100** | Paling lemah. Bonus + basic salary sudah bisa. Tapi BPJS, PPh 21, THR, lembur, cuti — semua tidak ada. Untuk 1–3 outlet mungkin OK, untuk 10+ outlet harus dirombak. |
| **Scalability** | **40/100** | Pagination sudah di beberapa endpoint, index sudah ditambah. Tapi: tidak ada read replica, tidak ada caching, tidak ada message queue, belum di-load test. Untuk 10 outlet mungkin OK. 30+ outlet akan bermasalah. |
| **Production Readiness** | **50/100** | Docker + CI/CD + backup script + structured logging sudah ada. Tapi: test coverage 0.3%, Playwright hanya 7 test, belum ada monitoring production (Sentry terkonfigurasi tapi belum aktif), backup belum auto-scheduled. |

### Overall Score

| Metrik | Skor |
|--------|------|
| **Rata-rata** | **58/100** |
| **Tertinggi** | Inventory Control (75) |
| **Terendah** | Payroll (35) |

### Final Verdict

**KRUNCUY POS ERP saat ini berada di level "Production Ready untuk 1–3 Outlet dengan Supervisi."**

Untuk 1 outlet: ✅ Siap.
Untuk 3 outlet: ✅ Siap dengan catatan (perbaiki void, purchase return, GR void).
Untuk 10 outlet: ⚠️ Butuh penguatan payroll, auto-approve, dan load test.
Untuk 30+ outlet: ❌ Butuh refactor infrastruktur (read replica, caching, message queue).

**Skor akhir: 58/100 — Naik dari 25/100 (audit awal) karena semua critical security sudah fixed, fitur ERP sudah dilengkapi, dan infrastruktur sudah mulai dibangun. Tapi masih jauh dari "enterprise grade."**
