# KRUNCUY POS ERP — E2E TEST PLAN

> **Versi:** 1.0
> **Tgl:** 11 Juni 2026
> **Project:** Multi-outlet F&B POS & ERP (1–100 outlet)
> **Test Stack:** Playwright (E2E) + Vitest (unit) + node:test (integration)

---

## 1. Executive Summary

KRUNCUY POS ERP memiliki **146 API endpoints, 47 frontend pages, 5 roles, 45 database models**. Saat ini test coverage hanya **0.3%** (4 test files untuk ~30K LOC).

E2E testing diperlukan untuk memastikan:

- **Business flow kritis** tidak rusak setelah perubahan — POS checkout, inventory movement, cash flow
- **Multi-role security** — crew tidak bisa akses ERP, admin tidak bisa dibatasi
- **Multi-branch isolation** — data branch A tidak bocor ke branch B
- **Production readiness** — sistem layak dipakai di 1–100 outlet

**Target:** 80% coverage untuk P0 flow, 50% untuk P1, sebelum production.

---

## 2. Testing Strategy

### Unit Test (Vitest / node:test)
- Fungsi helper (formatCurrency, buildDateRange, pagination)
- Validasi input (Zod schema)
- Kalkulasi payroll, bonus, PCS
- **Tidak perlu Playwright**

### Integration Test (node:test + Prisma)
- API endpoint behavior (200/400/401/403/404)
- Service logic (createTransaction, approveOutletExpense)
- RBAC middleware (requireAuth, requirePermission)
- Database query (findMany dengan filter)
- **Tidak perlu Playwright**

### E2E Test (Playwright)
- **User flows** dari login sampai selesai (buka shift → jualan → tutup shift)
- **Multi-role navigation** (crew hanya bisa /crew/*, admin bisa /erp/*)
- **Form submission** (create PO, input GR, approve)
- **Render & redirect** (unauthenticated → /login, wrong role → home)
- **HARUS Playwright** (karena butuh browser)

### Manual QA
- Visual layout (dashboard chart, responsive mobile)
- Edge case environment (network lambat, GPS mati, database disconnect)
- User acceptance test oleh owner/crew

---

## 3. Test Priority

### P0 — Must Pass Before Production

Flow yang kalau rusak bisnis berhenti:

| # | Area | Skenario | Alasan |
|---|------|----------|--------|
| P0.1 | Auth | Login semua role | Gak bisa login = gak bisa pakai sistem |
| P0.2 | Auth | Unauthenticated redirect | Data bocor ke publik |
| P0.3 | Auth | Role-based access | Crew bisa akses ERP = fraud |
| P0.4 | POS | Open shift → checkout → close shift | Core bisnis — outlet jualan |
| P0.5 | POS | Void transaksi | Refund pelanggan |
| P0.6 | POS | Checkout online (GoFood/Grab) | Online channel adalah revenue |
| P0.7 | Cash | Cash withdrawal OTP flow | Uang outlet |
| P0.8 | Cash | Outlet expense → approve | Belanja operasional |
| P0.9 | Inventory | Stock movement setelah transaksi | Stok harus akurat |
| P0.10 | Dashboard | ERP dashboard load | Owner pantau bisnis |

### P1 — Must Pass Before 3 Outlet

Flow penting untuk multi-outlet awal:

| # | Area | Skenario | Alasan |
|---|------|----------|--------|
| P1.1 | Branch | Crew hanya lihat branch sendiri | Isolasi data multi-outlet |
| P1.2 | Branch | Admin lihat semua branch | Kontrol management |
| P1.3 | Purchasing | PR → PO → GR → stock naik | Barang masuk |
| P1.4 | Inventory | Transfer warehouse → branch | Distribusi stok |
| P1.5 | Inventory | Stock opname → variance | Akurasi stok fisik |
| P1.6 | Report | Sales report (daily) | Laporan owner |
| P1.7 | Report | Cross branch dashboard | Perbandingan outlet |
| P1.8 | Payroll | Payroll calculate → approve → pay | Gaji crew |
| P1.9 | Master Data | Customer CRUD | Data pelanggan |
| P1.10 | Master Data | Product + Recipe | Menu jualan |

### P2 — Must Pass Before 10 Outlet

Flow untuk scale:

| # | Area | Skenario | Alasan |
|---|------|----------|--------|
| P2.1 | Pagination | List endpoint dengan page/limit | 10 outlet × 100 transaksi/hari |
| P2.2 | Report | Export Excel/PDF | Laporan formal |
| P2.3 | Purchasing | Supplier Invoice → Payment | Hutang supplier |
| P2.4 | Inventory | Waste tracking | Food cost control |
| P2.5 | Cash | Cash reconciliation report | Audit kas |
| P2.6 | HR | Crew performance + bonus | Manajemen SDM |
| P2.7 | Setting | GPS toggle on/off | Fleksibilitas operasional |
| P2.8 | Setting | Bonus setting per branch | Multi-outlet beda aturan |

### P3 — Nice to Have

| # | Area | Skenario |
|---|------|----------|
| P3.1 | Edge | Concurrent checkout collision |
| P3.2 | Edge | Database down → graceful error |
| P3.3 | Edge | Rate limit exceeded |
| P3.4 | Edge | Token expired → refresh → retry |
| P3.5 | UI | Mobile responsive crew pages |
| P3.6 | Report | All 33 report definitions render |

---

## 4. Test Matrix

| Module | Scenario | Role | Priority | Data Needed | Expected Result | Automate? |
|--------|----------|------|----------|-------------|----------------|-----------|
| Auth | Login valid credentials | All | P0 | User seed | Redirect ke home role | ✅ Playwright |
| Auth | Login invalid password | Public | P0 | — | Error "salah" | ✅ Playwright |
| Auth | Login inactive user | Public | P0 | User isActive=false | Error "tidak aktif" | ✅ Integration |
| Auth | Token expired | All | P0 | Expired JWT | Redirect /login | ✅ Integration |
| Auth | Unauthenticated → /erp | Public | P0 | — | Redirect /login | ✅ Playwright |
| POS | Open shift with GPS | CREW | P0 | Active branch | Shift status OPEN | ✅ Integration |
| POS | Open shift without GPS (allowed) | CREW | P0 | gps_required=false | Shift OPEN | ✅ Integration |
| POS | Checkout cash | CREW | P0 | Products in cart | Transaction created | ✅ Integration |
| POS | Checkout insufficient stock | CREW | P0 | Low stock item | Error stok | ✅ Integration |
| POS | Void transaction | CREW | P0 | Completed tx | Status VOID, stock back | ✅ Integration |
| POS | Close shift | CREW | P0 | Active shift | Shift CLOSED | ✅ Integration |
| Cash | Request withdrawal | CREW | P0 | Active shift | Status REQUESTED | ✅ Integration |
| Cash | Generate OTP | CREW | P0 | REQUESTED withdrawal | OTP issued | ✅ Integration |
| Cash | Verify OTP correct | CREW | P0 | OTP issued | Status COMPLETED | ✅ Integration |
| Cash | Verify OTP wrong | CREW | P0 | OTP issued | Error, retry | ✅ Integration |
| Cash | Outlet expense → approve | ADMIN | P0 | Items + active shift | Status POSTED, stock + | ✅ Integration |
| Inventory | Stock after sale | CREW | P0 | Product with recipe | Stock decremented | ✅ Integration |
| Inventory | Stock after void | CREW | P0 | Voided tx | Stock restored | ✅ Integration |
| Branch | Crew access own branch | CREW | P1 | Crew assigned | Only branch data | ✅ Integration |
| Branch | Crew access other branch | CREW | P1 | Different branch | 403 forbidden | ✅ Integration |
| Purchase | PR create → submit → approve | PURCHASING | P1 | Supplier + items | Status APPROVED | ✅ Playwright |
| Purchase | PO create → submit → approve | PURCHASING | P1 | Approved PR | Status APPROVED | ✅ Playwright |
| Purchase | GR create → stock naik | PURCHASING | P1 | Approved PO | Stock +, PO RECEIVED | ✅ Integration |
| Transfer | Create depot transfer | ADMIN | P1 | Warehouse + branch | Status PENDING | ✅ Integration |
| Transfer | Approve depot transfer (crew) | CREW | P1 | PENDING transfer | Status APPROVED, stock move | ✅ Integration |
| Payroll | Calculate payroll | ADMIN | P1 | Crew with sales | Bonus + base | ✅ Integration |
| Payroll | Approve payroll | ADMIN | P1 | DRAFT payroll | Status APPROVED | ✅ Integration |
| Payroll | Pay payroll | ADMIN | P1 | APPROVED payroll | Status PAID | ✅ Integration |
| Opname | Complete opening opname | CREW | P1 | Active shift | StockOpname OPENING | ✅ Integration |
| Opname | Complete closing opname | CREW | P1 | Opening done | Variance calculated | ✅ Integration |
| Report | ERP dashboard loads | ADMIN | P0 | Transactions today | Summary + charts | ✅ Playwright |
| Report | Cross branch page | ADMIN | P1 | Multiple branches | Branch comparison | ✅ Playwright |
| Report | Export Excel | ADMIN | P2 | Report data | File download | ✅ Playwright |

---

## 5. Role-Based Test Matrix

| Role | Allowed Pages | Forbidden Pages | Critical Actions |
|------|---------------|-----------------|------------------|
| **SUPERADMIN** | Semua `/erp/*`, `/crew/*` | — | Access control, settings, full CRUD |
| **OWNER** | Semua `/erp/*` | — | Dashboard, approve, reports |
| **ADMIN** | `/erp/*` kecuali access-control | `/erp/access-control` | CRUD operasional, approve expense |
| **PURCHASING** | `/erp/purchasing*`, `/erp/inventory`, `/erp/suppliers*`, `/erp/reports` | `/erp/users`, `/erp/access-control`, `/erp/payroll`, `/erp/cash-withdrawals` | PR, PO, GR, supplier |
| **CREW** | `/crew/*` | Semua `/erp/*` | POS, open/close shift, stock opname, withdrawal |

---

## 6. Business Flow E2E

### Flow A — Daily Outlet Operation

```
Login crew → Buka shift (GPS) → POS checkout (cash) → 
POS checkout (QRIS) → POS checkout (online) → 
Outlet expense → Request withdrawal → 
Generate OTP → Verify OTP → Close shift
```

**Data yang dibutuhkan:**
- Crew user with branch assignment
- Active branch with GPS coordinates
- Products with recipes
- Inventory stock > 0
- Cash minimum setting

**Verifikasi:**
- Shift status OPEN → CLOSED
- Transactions count > 0
- Stock berkurang sesuai recipe
- Cash movements tercatat
- Withdrawal COMPLETED

### Flow B — Purchasing to Stock

```
Login purchasing → Buat PR → Submit → 
Login admin → Approve PR → 
Login purchasing → Buat PO (link PR) → Submit → 
Login admin → Approve PO → 
Login purchasing → Buat GR → Stock warehouse + 
Login admin → Supplier Invoice → Payment
```

**Data yang dibutuhkan:**
- Supplier dengan produk
- Warehouse/depo aktif
- Inventory items

**Verifikasi:**
- PR: DRAFT → SUBMITTED → APPROVED → ORDERED
- PO: DRAFT → SENT → APPROVED → RECEIVED
- GR: warehouseStock bertambah
- Invoice: PENDING → PAID

### Flow C — Depo to Branch Transfer

```
Login admin → Create depot transfer (warehouse → branch) →
Login crew → Terima barang → Approve →
Stock warehouse -, stock branch +
```

**Data yang dibutuhkan:**
- Warehouse dengan stok
- Branch tujuan
- Crew di branch tujuan dengan active shift

**Verifikasi:**
- Transfer: PENDING_APPROVAL → APPROVED
- warehouseStock berkurang
- branchInventoryItem bertambah
- InventoryMovement tercatat

### Flow D — Stock Opname

```
Login crew → Buka shift → Opening opname →
Input fisik → Variance 0 →
Login crew (end of day) → Closing opname →
Input fisik ulang → Variance dihitung
```

**Data yang dibutuhkan:**
- Branch dengan inventory items
- Items with isOpnameRequired=true

**Verifikasi:**
- Opening opname: isCompleted=true
- Closing opname: varianceQty dihitung
- Items with variance > 0 flagged

### Flow E — Payroll Cycle

```
Login admin → View crew performance →
Attendance + sales → Hitung bonus →
Buat payroll → Approve → Pay
```

**Data yang dibutuhkan:**
- Crew dengan attendance + sales
- Bonus setting (global)
- Payroll period (bulan ini)

**Verifikasi:**
- Payroll: DRAFT → APPROVED → PAID
- bonusAmount = corePcs × bonusRate
- netAmount = base + bonus - deductions

### Flow F — Owner Daily Monitoring

```
Login owner → ERP Dashboard →
Cross branch dashboard →
Sales report (daily) →
Stock alert →
Cash reconciliation
```

**Data yang dibutuhkan:**
- Multiple branches with today's transactions
- Branch with low stock items
- Cash sessions with variance

**Verifikasi:**
- Dashboard menunjukkan semua branch
- Cross branch menampilkan perbandingan
- Stock alert muncul untuk stok ≤ minimum
- Cash reconciliation match

---

## 7. Playwright Test Plan

### 7.1 auth.e2e.spec.js

**Setup:** Seed data dengan SUPERADMIN, CREW, PURCHASING

| Skenario | Login Role | Steps | Expected |
|----------|-----------|-------|----------|
| Login page renders | — | Buka /login | Input + button visible |
| Login valid admin | admin/admin123 | Isi form → submit | Redirect /erp |
| Login valid crew | crew/crew@2026 | Isi form → submit | Redirect /crew |
| Login invalid password | admin/wrong | Submit | Error message visible |
| Unauthenticated → /erp | — | Buka /erp | Redirect /login |

### 7.2 role-access.e2e.spec.js

**Setup:** Seed data dengan semua role

| Skenario | Login Role | Steps | Expected |
|----------|-----------|-------|----------|
| Crew denied /erp | CREW | Buka /erp/* | Redirect /crew |
| Admin can /erp | ADMIN | Buka /erp | Page loads |
| PURCHASING denied /erp/users | PURCHASING | Buka /erp/users | Redirect /erp |
| Crew can /crew/pos | CREW | Buka /crew/pos | POS page loads |
| SUPERADMIN can access-control | SUPERADMIN | Buka /erp/access-control | Page loads |

### 7.3 pos-flow.e2e.spec.js

**Setup:** CREW user, active branch, inventory stock, active cash session

| Skenario | Steps | Expected |
|----------|-------|----------|
| Crew home loads | Buka /crew | Shift status visible |
| Open shift | Klik "Buka Shift" | Shift active |
| POS page renders | Buka /crew/pos | Category + products |
| Checkout offline | Add items → Bayar → CASH | Invoice generated |
| Checkout QRIS | Add items → Bayar → QRIS | Invoice |
| Void test | Buka /crew/sales-today → klik tx → void | Status VOID |
| Close shift | Klik "Tutup Shift" → closing cash | Shift closed |

### 7.4 inventory-flow.e2e.spec.js

**Setup:** CREW with active shift, inventory items

| Skenario | Steps | Expected |
|----------|-------|----------|
| Stock outlet page | Buka /crew/stock-outlet | Items with stock |
| Stock opname | Buka /crew/stock-opname → opening → input qty | Opname complete |
| Retur barang | Buka /crew/operational → retur → pilih item → submit | Stock decreased |

### 7.5 purchasing-flow.e2e.spec.js

**Setup:** Supplier, inventory items, PURCHASING + ADMIN users

| Skenario | Login Role | Steps | Expected |
|----------|-----------|-------|----------|
| Buat PR | PURCHASING | Buka /erp/purchase-requests → create → submit | PR SUBMITTED |
| Approve PR | ADMIN | Buka /erp/purchase-requests → approve | PR APPROVED |
| Buat PO | PURCHASING | Buka /erp/purchase-orders → create (link PR) → submit | PO SENT |
| Approve PO | ADMIN | Buka /erp/purchase-orders → approve | PO APPROVED |
| Buat GR | PURCHASING | Buka /erp/goods-receipts → select PO → input qty | GR created, stock + |

### 7.6 cash-flow.e2e.spec.js

**Setup:** CREW with active shift, cash session

| Skenario | Steps | Expected |
|----------|-------|----------|
| Request withdrawal | Buka /crew/cash-withdrawals → request | REQUESTED |
| Generate OTP | Klik "Setujui & Generate OTP" | OTP code visible |
| Copy OTP | Klik "Salin OTP" | Clipboard has OTP |
| View history | Buka /crew/cash-withdrawals | Withdrawal listed |

### 7.7 payroll-flow.e2e.spec.js

**Setup:** CREW with attendance + sales, bonus setting exists

| Skenario | Login Role | Steps | Expected |
|----------|-----------|-------|----------|
| Payroll page | ADMIN | Buka /erp/payroll | List payroll |
| Create payroll | ADMIN | Create → select crew | DRAFT created |
| Approve payroll | ADMIN | Approve | APPROVED |
| Pay payroll | ADMIN | Pay | PAID |

### 7.8 report-flow.e2e.spec.js

**Setup:** Transactions data, multiple branches

| Skenario | Login Role | Steps | Expected |
|----------|-----------|-------|----------|
| ERP dashboard | ADMIN | Buka /erp | Charts + KPIs render |
| Cross branch | ADMIN | Buka /erp/cross-branch | Branch comparison |
| Sales recap | ADMIN | Buka /erp/reports/sales-recap | Report table |
| Date filter | ADMIN | Pilih tanggal → filter | Data berubah |

---

## 8. Test Data Plan

### Users

| Username | Password | Role | Branch |
|----------|----------|------|--------|
| admin | admin123 | SUPERADMIN | Gondokusuman |
| owner | owner@2026 | OWNER | Gondokusuman |
| crew | crew@2026 | CREW | Gondokusuman |
| crew-a | crew@2026 | CREW | Tugu |
| crew-b | crew@2026 | CREW | Mantrijeron |
| purchasing | purch@2026 | PURCHASING | Gondokusuman |

### Branches
- Gondokusuman (active)
- Tugu (active)
- Mantrijeron (active)
- Umbulharjo (active)

### Warehouse
- Depo Gondokusuman (active, minimal 3 stock items)

### Products
- TW_5K — Tahu Walik 5K (price: 5000, pcs: 5)
- TW_10K — Tahu Walik 10K (price: 10000, pcs: 11)
- BG_5K — Bakso Goreng 5K (price: 5000, pcs: 6)
- EXTRA_SAUS — Extra Saus (price: 2000, pcs: 0)

### Inventory Items
- Tahu Pong (RAW_MATERIAL, initial: 240)
- Adonan (RAW_MATERIAL, initial: 18.5)
- Minyak Goreng (RAW_MATERIAL, initial: 24)
- Sauce Cup (PACKAGING, initial: 300)
- Paper Bag (PACKAGING, initial: 200)

### Settings
- `pos_target_pcs` = 450 (global)
- `gps_required_openshift` = true (global)
- `crew_bonus_per_pcs` = 250 (global)
- `cash_minimum_outlet` = 50000 (global)
- `crew_bonus_min_pcs` = 25 (global)

### Suppliers
- At least 1 active supplier

### Cash Session
- At least 1 open session (for POS testing)
- At least 1 closed session with transactions (for cash reconciliation)

---

## 9. What NOT to Test With Playwright

Playwright adalah browser automation — lambat dan mahal (token). Jangan gunakan untuk:

| Area | Alasan | Ganti Dengan |
|------|--------|-------------|
| Payroll calculation detail | Matematika, bukan UI | Integration test (`node --test`) |
| Inventory cost calculation | Matematika | Integration test |
| Permission middleware logic | Backend pure | Integration test (mock request) |
| Pagination response format | JSON structure | Integration test |
| Date range validation | Backend logic | Unit test |
| FormatCurrency | Pure function | Unit test (Vitest) |
| Invoice number generation | String format | Unit test |
| OTP hash comparison | Crypto | Unit test |
| API rate limiting | Backend middleware | Integration test |
| Stock decrement precision | Decimal math | Integration test |
| Database constraint violation | Error handling | Integration test |
| Export file content | File format | Integration test (buffer check) |

**Rule of thumb:** Jika skenario bisa diuji dengan `curl` + `assert`, jangan pakai Playwright.

---

## 10. Recommended Execution Order

### Phase 1 — Foundation (sekarang)
```
1. auth.e2e.spec.js          → P0, paling stabil
2. role-access.e2e.spec.js   → P0, keamanan
```

### Phase 2 — Core Business (prioritas tinggi)
```
3. pos-flow.e2e.spec.js      → P0, core bisnis
4. cash-flow.e2e.spec.js     → P0, uang
```

### Phase 3 — Multi-Outlet (setelah core stabil)
```
5. inventory-flow.e2e.spec.js → P1, stok
6. purchasing-flow.e2e.spec.js → P1, procurement
```

### Phase 4 — Management (tahap akhir)
```
7. payroll-flow.e2e.spec.js  → P1-P2, SDM
8. report-flow.e2e.spec.js   → P1, monitoring
```

### Integration Tests (parallel, tanpa Playwright)
```
auth.service.test.js         → login, token, permission
transaction.service.test.js  → create, void, inventory deduction
cash-withdrawal.test.js      → OTP generate, hash, verify
purchasing.service.test.js   → PR → PO → GR flow
inventory-cost.test.js       → purchase lot, cost history
```

---

## 11. Cost-Saving Strategy

Karena budget terbatas:

### 11.1 Saat Development
- **Jalankan hanya P0 E2E** setiap kali push
- P1-P2 cukup integration test (lebih cepat, lebih murah)
- Gunakan `--workers=1` untuk menghindari rate limiter login
- Backend & frontend harus running sebelum test

### 11.2 Reuse Login State
- Playwright `storageState` — login sekali, reuse untuk semua test dalam file yang sama
- Jangan login ulang di setiap `beforeEach`
- Satu worker per test file (bukan per test)

### 11.3 Prioritaskan Integration Test
- Setiap handler E2E bisa diganti dengan integration test yang 10× lebih cepat
- Contoh: daripada E2E approve PO (buka browser → klik → tunggu), cukup integration test hit API langsung
- **E2E hanya untuk** flow yang melibatkan redirect, render, atau interaksi browser

### 11.4 Parallelism yang Bijak
- Jangan jalankan semua E2E dalam 1 command
- Kelompokkan: P0 dulu, lalu P1, lalu P2
- Jika P0 gagal → fix → baru lanjut P1

### 11.5 Rate Limiter Workaround
- Naikkan `authLimiter.max` ke 100 saat testing
- Atau restart backend setiap batch test
- Atau gunakan token yang sama untuk semua test dalam 1 file

### 11.6 Test per Module, Bukan per Page
- Satu test file untuk 1 modul bisnis, bukan 1 file per halaman
- Contoh: `pos-flow.e2e.spec.js` mencakup open shift, checkout, close shift — bukan 3 file terpisah

---

## 12. Final Checklist

### Sebelum Production — WAJIB

| # | Item | Status |
|---|------|--------|
| ☐ | Semua P0 E2E lulus | |
| ☐ | Auth: login semua role | |
| ☐ | Auth: unauthenticated redirect | |
| ☐ | Role access: crew tidak bisa /erp | |
| ☐ | Role access: purchasing tidak bisa /erp/users | |
| ☐ | POS: checkout + void | |
| ☐ | Inventory: stock bergerak setelah transaksi | |
| ☐ | Cash: withdrawal OTP flow | |
| ☐ | Cash: outlet expense → approve | |
| ☐ | Dashboard: ERP dashboard render | |
| ☐ | Rate limiter: auth (20/15min) | |
| ☐ | Rate limiter: OTP verify (5/15min) | |
| ☐ | CORS: hanya allowed origin | |
| ☐ | HSTS/Helmet headers | |

### Sebelum Multi-Outlet

| # | Item | Status |
|---|------|--------|
| ☐ | Branch isolation: crew hanya lihat branch sendiri | |
| ☐ | Purchasing: PR → PO → GR → stock + | |
| ☐ | Transfer: warehouse → branch | |
| ☐ | Stock opname: opening + closing | |
| ☐ | Payroll: calculate → approve → pay | |
| ☐ | Pagination: list endpoint return meta | |
| ☐ | Report: export Excel/PDF | |
| ☐ | GPS setting toggle ON/OFF | |

### Sebelum Scale (10+ Outlet)

| # | Item | Status |
|---|------|--------|
| ☐ | Performance test: 100 concurrent POS | |
| ☐ | Database indexes on all frequent queries | |
| ☐ | Pagination on all list endpoints | |
| ☐ | Supplier Invoice + Payment flow | |
| ☐ | Cross-branch dashboard | |
| ☐ | Cash reconciliation report | |
| ☐ | Inventory cost tracking (FIFO) | |
| ☐ | Backup strategy tested | |
| ☐ | Error tracking (Sentry) | |

### Infrastruktur

| # | Item | Status |
|---|------|--------|
| ☐ | Docker Compose: API + Web + DB | |
| ☐ | CI/CD: lint → test → build | |
| ☐ | Environment variable: production .env | |
| ☐ | JWT_SECRET: production-grade | |
| ☐ | Database: backup cron job | |
| ☐ | Monitoring: health endpoint | |
| ☐ | Logging: structured JSON | |
