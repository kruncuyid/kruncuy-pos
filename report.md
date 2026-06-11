# KRUNCUY POS — AUDIT REPORT

> **Auditor:** ERP & F&B Business Consultant (20+ tahun)
> **Tanggal:** 11 Juni 2026
> **Target:** Multi-outlet F&B POS & ERP System

---

# 1. EXECUTIVE SUMMARY

**KRUNCUY POS dalam kondisi: BISA BERJALAN, TAPI BELUM LAYAK PRODUKSI SKALA BESAR.**

Proyek ini memiliki fondasi arsitektur yang solid (modular, RBAC lengkap, branch isolation), tetapi dihantui oleh **celah keamanan kritis**, **kesalahan desain data integrity**, dan **sama sekali tidak siap scale**.

### Score Card

| Dimensi | Skor (0-10) | Bobot | Nilai |
|---------|------------|-------|-------|
| Security | 2/10 | 15% | 0.30 |
| Data Integrity | 3/10 | 12% | 0.36 |
| Architecture | 6/10 | 12% | 0.72 |
| ERP Completeness | 4/10 | 12% | 0.48 |
| Test Coverage | 0.5/10 | 10% | 0.05 |
| Scalability | 1/10 | 10% | 0.10 |
| DevOps & Tooling | 1/10 | 8% | 0.08 |
| Franchise Readiness | 0/10 | 8% | 0.00 |
| Maintainability | 4/10 | 8% | 0.32 |
| Production Hardening | 2/10 | 5% | 0.10 |
| **TOTAL** | | **100%** | **2.51/10** |

### Final Score: **25/100**

---

# 2. CURRENT STATE ASSESSMENT

### Metrik Dasar

| Metrik | Nilai |
|--------|-------|
| Total File | 215 |
| Baris Kode | ~30.412 (12.174 backend + 18.238 frontend) |
| Database Models | 45 |
| Database Enums | 19 |
| API Endpoints | 146 (28 route files) |
| Backend Modules | 28 |
| Frontend Pages | ~47 (33 ERP + 7 Crew + 7 placeholder redirects) |
| Report Definitions | 33 |
| Test Files | 4 (dua backend, dua frontend) |
| Test-to-Code Ratio | **0.3%** |
| Migrations | 12 |
| Placeholder Pages | **21 dari 33 ERP pages** |

### Arsitektur Saat Ini

```
Backend:  Express.js + Prisma ORM + PostgreSQL
Frontend: React 19 + Vite + Tailwind v4 + React Router v7
Auth:     JWT (localStorage) + RBAC (5 roles, ~50 permissions)
Deploy:   NONE (no Docker, no CI/CD, no web server config)
```

### Tim & Proses

```
Testing:       Hanya 4 file untuk 30K LOC — tidak ada integration test
Linting:       Hanya frontend — backend nol
TypeScript:    0% — padahal Prisma sudah generate tipe
Monorepo:      Manual — tidak ada npm workspaces, root package.json tidak ada
```

---

# 3. STRENGTHS

Tidak semuanya buruk. Beberapa hal sudah dilakukan dengan benar:

### 3.1 Modular Architecture ✅

Setiap modul di backend mengikuti pola `routes → controller → service` yang konsisten. Ini memudahkan onboarding developer baru dan isolation of concerns. 28 modul terpisah dengan baik.

### 3.2 RBAC Mature ✅

5 role dengan ~50 permission yang terdefinisi rapi di `accessControlCatalog.js`. Ada hierarki yang jelas (SUPERADMIN → OWNER → ADMIN → PURCHASING → CREW). Frontend sidebar otomatis menyesuaikan dengan permission user.

### 3.3 Branch Isolation ✅

`branchContext.middleware.js` dan `branchAccess.service.js` memastikan crew hanya bisa mengakses branch yang ditugaskan. Ini kritis untuk multi-outlet dan sudah diimplementasi dengan baik.

### 3.4 Dynamic Report System ✅

33 report definitions dengan dynamic column config, export Excel/PDF, dan filter bar. Arsitektur ini fleksibel dan mudah ditambah report baru tanpa mengubah kode existing.

### 3.5 Error Handling ✅

`error.middleware.js` global handler dengan stack trace hanya di development. 404 handler untuk route tidak dikenal. Ini standar industri yang baik.

### 3.6 Comprehensive Data Models ✅

45 model mencakup sebagian besar domain bisnis F&B: transaksi, inventory, cash management, purchasing, payroll, attendance. Ini menunjukkan pemahaman domain yang baik.

---

# 4. WEAKNESSES

### 4.1 Test Coverage: INI MEMALUKAN

**4 test files untuk 30.412 baris kode.**

Itu rasio **0.3%**. Sebuah proyek ERP yang menangani uang, inventory, dan payroll dengan hanya 4 test — dua di antaranya cuma ngecek formatter. Tidak ada satu pun test untuk:

- Authentication & authorization flows
- Transaksi POS (checkout, void, refund)
- Inventory movement (in/out/transfer/adjustment)
- Payroll calculation
- Cash withdrawal OTP flow
- API endpoint behavior

```
File: backend/tests/reportGenerators.test.js     — cek apakah semua key ada di object
File: backend/tests/reportHelpers.test.js         — 4 helper functions
File: frontend/.../reportViewConfig.test.js       — cek view config exist
File: frontend/.../reportFormatters.test.js       — cek formatCurrency dkk
```

**Risiko:** Satu refactor di `transaction.service.js` bisa merusak sistem tanpa ada yang sadar sampai terjadi salah hitung di production.

### 4.2 No TypeScript

Prisma sudah generate tipe lengkap untuk semua model. Tapi dikonsumsi oleh JavaScript polos. Ini seperti punya peta harta karun tapi dibutakan. Setiap access ke `prisma.user.findUnique()` tidak punya autocomplete, tidak ada compile-time checking.

**Dampak:** Setiap perubahan schema → manual cek semua file yang受到影响. Satu typo di field name = runtime error di production.

### 4.3 No Backend Linting

`backend/package.json` tidak punya script lint. Tidak ada ESLint, tidak ada Prettier. Kode berkualitas hanya bergantung pada disiplin developer. Untuk proyek yang sudah 12K LOC backend, ini tidak bisa diterima.

### 4.4 No Monorepo Tooling

Project ini monorepo manual. Tidak ada npm workspaces, tidak ada Turborepo/Nx. `cd backend && npm install` dan `cd frontend && npm install` dilakukan terpisah. Root `package.json` tidak ada.

### 4.5 21 ERP Halaman Mash Placeholder

Dari 33+ halaman ERP, **21 masih render `ErpFeaturePage`** — komponen kosong dengan deskripsi dan bullet points. Sidebar menunjukkan menu tersebut seolah fungsional, tapi user yang klik akan dapat halaman kosong.

Placeholder routes di `App.jsx:414-443`:
```
/erp/master-data, /erp/purchasing, /erp/purchasing-queue
/erp/shipment-tracking, /erp/operations-log, /erp/branch-orders
/erp/cash-control, /erp/compliance, /erp/reference
(dan 12 lainnya)
```

Ini berarti ~40% fitur ERP belum ada implementasinya.

---

# 5. MISSING FEATURES

### 5.1 Customer Model — **CRITICAL**

Tidak ada model `Customer` di database. Transaksi tersimpan tanpa relasi ke pelanggan. Ini berarti:

- Tidak bisa追踪 riwayat pembelian per pelanggan
- Tidak bisa program loyalitas
- Tidak bisa CRM
- Tidak bisa customer segmentation
- Data penjualan hanya agregat — tidak ada who

**Ini kehilangan besar untuk bisnis F&B modern yang butuh customer retention.**

### 5.2 Supplier Invoice & Payment — **HIGH**

Procurement cycle berhenti di Goods Receipt. Tidak ada:
- `SupplierInvoice` — tagihan dari supplier
- `SupplierPayment` — pembayaran ke supplier
- Accounts Payable aging
- Due date tracking

Tanpa ini, purchasing module hanya setengah jadi. Bisnis tidak bisa追踪 utang ke supplier.

### 5.3 Production Batch & Yield — **MEDIUM**

`MenuRecipe` (BOM) sudah ada, tapi tidak ada:
- `ProductionBatch` — produksi dalam jumlah banyak
- `Yield` — hasil aktual vs standar
- Waste tracking dari produksi

Untuk F&B yang produksi sendiri (bukan sekadar jualan), ini kritis.

### 5.4 Multi-Company — **NOT EVEN STARTED**

Seluruh sistem hanya mendukung **satu legal entity**. Tidak ada:
- Company model
- Cross-company reporting
- Consolidated financial statements
- Inter-company transactions

Jika franchise berkembang dan butuh PT terpisah per wilayah, sistem harus dirombak total.

### 5.5 Franchise Module — **NOT EVEN STARTED**

Skor: **0/10**. Tidak ada satupun fitur franchise:
- Royalty fee calculation
- Franchise fee management
- Territory management
- Franchisee dashboard
- Centralized supply chain pricing
- Brand compliance audit

### 5.6 Centralized Multi-Branch Dashboard — **MEDIUM**

`ErpDashboard` hanya menampilkan summary untuk hari ini. Tidak ada:
- Cross-branch comparison (mana outlet terbaik/terburuk)
- Trend analysis (week-over-week, month-over-month)
- Anomaly detection (sales drop mendadak)
- Real-time monitoring (push notifikasi jika ada anomaly)

---

# 6. BUSINESS FLOW ISSUES

### 6.1 Invoice Number Collision (transaction.service.js:4-10)

```javascript
function generateInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = String(now.getTime()).slice(-6);  // ❌ hanya 6 digit
  return `KR-${date}-${time}`;
}
```

`Date.now().slice(-6)` mengambil 6 digit terakhir dari timestamp millisecond. Dalam satu millisecond yang sama (satu konteks konkuren), dua transaksi bisa menghasilkan invoice number yang identik.

**Dampak:** Unique constraint violation di database. Transaksi gagal di production. Semakin tinggi traffic POS, semakin sering terjadi collision.

**Solusi:** Gunakan database sequence, UUID, atau minimal `crypto.randomBytes()`.

### 6.2 Hardcoded Business Constants

| Lokasi | Nilai | Masalah |
|--------|-------|---------|
| `payroll.service.js:55` | `bonusPerPcs = 250` | Harusnya dari system setting |
| `pos.service.js:156` | `targetPcs = 450` | Harusnya dari system setting per branch |
| `crew.service.js:7` | `BONUS_PER_PCS = 250` | Duplikasi dari payroll.service |

Ironisnya, `crew.service.js` sudah membaca system settings (`crew_bonus_per_pcs`, `crew_bonus_min_pcs`) untuk perhitungan performa crew — tapi `payroll.service.js` masih pakai hardcode. Ini inkonsistensi yang menunjukkan kurangnya refactoring.

### 6.3 Outlet Expense: Status REQUESTED Tidak Ada

`OutletExpenseStatus` enum hanya punya `DRAFT`, `POSTED`, `VOID`. Tidak ada status `REQUESTED` atau `PENDING_APPROVAL`. Artinya semua outlet expense langsung aktif tanpa approval flow. Padahal deskripsi ErpFeaturePage untuk `/erp/outlet-expenses` menyebutkan alur approval.

### 6.4 CrewOperationalPage Bypass Service Layer (`CrewOperationalPage.jsx:62`)

```javascript
const { default: api } = await import("../../../core/api/api");
await api.post("/inventory/movements", {
  inventoryItemId: returForm.inventoryItemId,
  type: "WASTE",
  quantity: -value,
  ...
});
```

Ini bypass service layer completely. Tidak ada validasi, tidak ada audit log, tidak ada business rules. Frontend langsung POST ke endpoint API dengan dynamic `import()`. Ini **pintu belakang** yang berbahaya.

### 6.5 Return Service Tanpa Branch Filter (`return.service.js`)

```javascript
async function list(query) {
  const where = { status: ..., supplierId: ... };  // ❌ no branch filter
  return prisma.purchaseReturn.findMany({ where, ... });
}
```

User authenticated manapun bisa melihat semua return dari semua branch. Tidak ada filter branch. Tidak ada branch context. Ini information disclosure.

---

# 7. DATABASE ISSUES

### 7.1 Duplicate Keys di Seed File (`seed.js:53-58`)

```javascript
{
  code: "MANTRIJERON",
  ...
  lat: -7.8142,
  lng: 110.3589,
  lat: -7.8142,   // ❌ overwrites previous lat
  lng: 110.3589,  // ❌ overwrites previous lng
  lat: -7.8142,   // ❌ overwrites again
  lng: 110.3589,  // ❌ overwrites again
},
```

Ini adalah **copy-paste bug** yang jelas. JavaScript diam-diam mengambil nilai terakhir, jadi tidak ada runtime error. Tapi ini menunjukkan kode seed ditulis asal-asalan. Ini terjadi di MANTRIJERON, UMBULHARJO, dan MINGGIR.

### 7.2 Soft-Delete Inconsistency

| Module | Delete Method |
|--------|--------------|
| User | **Hard delete** (`prisma.user.delete`) |
| Payroll | **Hard delete** |
| BranchProduct | **Soft delete** (`isActive: false`) |
| InventoryItem | **Soft delete** (`isActive: false`) |
| Product | **Soft delete** (`isActive: false`) |

Tidak ada standar. User yang sudah dihapus hard-delete — padahal semua foreign key di model lain masih refer ke User. Jika ada transaksi yang direferensi ke user yang dihapus, Prisma akan throw error atau data jadi orphan.

### 7.3 Tidak Ada Customer Model

Sudah dibahas di 5.1. Ini missing table yang paling kentara.

### 7.4 Tidak Ada Index untuk Query Umum

Prisma schema memiliki `@@index` di beberapa model, tapi banyak model query berat yang tidak punya index optimal:

- `Transaction` — `@@index([branchId, createdAt])` — ada index, tapi tidak mencakup filter `status` yang sering dipakai
- `InventoryMovement` — tidak ada index composite untuk `[branchId, type, createdAt]`
- `AuditLog` — tidak ada index untuk `[userId, action, createdAt]`
- `StockOpnameItem` — tidak ada index untuk `[stockOpnameId, inventoryItemId]`

Dengan 146 endpoint yang melakukan `findMany()` tanpa pagination, kurangnya index akan memperparah performance degradation.

### 7.5 Decimal Precision Tidak Konsisten

- `BranchInventoryItem.currentStock` → `Decimal(18,3)` — 3 desimal
- `WarehouseStock.quantity` → `Decimal(18,3)` — 3 desimal
- `InventoryMovement.quantity` → `Decimal(18,3)` — 3 desimal
- `TransactionItem.price` → `Decimal(18,2)` — 2 desimal
- `TransactionItem.subtotal` → `Decimal(18,2)` — 2 desimal

Inventory pakai 3 desimal, transaksi pakai 2. Untuk F&B yang menjual per gram (misalnya 0.250 kg), ini bisa menyebabkan rounding error dalam perhitungan COGS.

---

# 8. SECURITY ISSUES

### 8.1 [CRITICAL] OTP Dikembalikan dalam Cleartext (`cashWithdrawal.service.js:438,473,505,547`)

Ini adalah **security flaw paling serius** di seluruh sistem.

```javascript
// Line 438
const otpCode = generateOtpCode();           // generate plaintext
const otpSalt = crypto.randomBytes(16).toString("hex");
const otpHash = hashOtp(otpCode, otpSalt, withdrawal.id);  // hash

// Line 473 — response
return {
  ...withdrawal,
  otpCode,           // ❌ MENGIRIM PLAINTEXT!
  otpExpiresAt,
};
```

Logika OTP sudah benar: di-hash dengan SHA-256 + salt + withdrawalId. Tapi hash itu tidak pernah digunakan untuk validasi — karena OTP malah dikirim balik dalam bentuk aslinya.

**Dampak:** 
- Siapa pun yang bisa membaca response API (termasuk frontend developer tools, network sniffer di jaringan lokal, atau man-in-the-middle) bisa langsung melihat OTP.
- Ini membatalkan seluruh tujuan OTP sebagai second factor.
- Crew bisa melakukan withdrawal tanpa perlu OTP dari owner — cukup generate OTP sendiri, baca dari response, lalu verifikasi.

**Skor Risiko: CRITICAL — 10/10**

### 8.2 [CRITICAL] JWT Disimpan di localStorage (`session.js`)

Semua session data disimpan di `localStorage`:
- `kruncuy_token` — JWT (berlaku 7 hari)
- `kruncuy_user` — user profile
- `kruncuy_access` — permission array

**Masalah:** localStorage dapat diakses oleh JavaScript apapun yang berjalan di halaman yang sama. Satu XSS (bahkan reflected XSS di URL parameter) memberikan attacker full access ke token dan permission.

**Solusi standar industri:** httpOnly cookie untuk token, refresh token pattern, atau setidaknya short-lived access token (15 menit) + refresh token (7 hari).

**Skor Risiko: CRITICAL — 9/10**

### 8.3 [CRITICAL] Branch Assignments POST/PATCH Hanya Guard `:read` (`branchAssignment.routes.js:8`)

```javascript
router.use(requireAuth, requirePermission("branch-assignments:read"));  // ❌ read permission
router.get("/", controller.getAssignments);        // GET — read ✅
router.post("/", controller.createAssignment);     // POST — write ❌
router.patch("/:id/deactivate", controller.deactivateAssignment); // PATCH — write ❌
```

Semua route di router ini hanya membutuhkan permission `:read`. Artinya **siapa pun dengan akses baca ke branch assignments bisa membuat dan menonaktifkan assignment**.

Ini privilege escalation yang jelas. Seharusnya POST/PATCH membutuhkan `branch-assignments:write`.

**Skor Risiko: CRITICAL — 8/10**

### 8.4 [HIGH] Permission Array Disimpan Client-Side Bisa Ditamper

`session.js` menyimpan `kruncuy_access` yang berisi array permissions. User bisa mengedit localStorage mereka untuk menambahkan permission.

**Mitigasi:** Backend juga mengecek permission di setiap request. Tapi frontend menggunakan data ini untuk:
1. Menampilkan/menyembunyikan navigasi sidebar
2. Menampilkan/menyembunyikan tombol (misalnya void transaction)

Ini menciptakan **false sense of security**. User yang menamper permission-nya akan melihat tombol-tombol yang sebenarnya tidak bisa mereka gunakan. Tapi UX-nya tetap jelek.

**Skor Risiko: HIGH — 7/10**

### 8.5 [HIGH] GPS Validation Bisa Dilewati (`cashSession.service.js`)

```javascript
if (!payload.lat || !payload.lng) { /* skip validation */ }
const userLat = Number(payload.lat);   // jika NaN
const userLng = Number(payload.lng);   // jika NaN

if (!userLat || !userLng) { throw error }  // !NaN = true → lolos ❌

const d = getDistanceFromLatLng(userLat, userLng, branch.lat, branch.lng);
if (d > 20) { throw "Anda tidak berada di outlet" }
           // NaN > 20 = false → selalu lolos! ❌
```

Jika GPS mengembalikan `NaN`, validasi `!NaN` adalah `true` (lolos). Kemudian `getDistanceFromLatLng()` dengan input NaN akan menghasilkan NaN. Dan `NaN > 20` adalah `false` — sehingga **crew bisa open shift dari mana saja**.

**Skor Risiko: HIGH — 6/10**

### 8.6 [MEDIUM] FRONTEND_URL Tidak Ada di Production `.env`

File `backend/.env` (yang dipakai untuk production/development) **tidak memiliki `FRONTEND_URL`**. Sementara di `env.js`:

```javascript
frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
```

Fallback-nya adalah `localhost:5173`. Artinya CORS hanya mengizinkan localhost. Production deployment akan gagal karena frontend dari domain manapun akan kena CORS error.

**Skor Risiko: MEDIUM — 5/10**

### 8.7 [LOW] Tidak Ada Brute-Force Protection di Endpoint Kritis

Rate limiter global 100 request/menit sudah ada. Tapi endpoint kritis seperti:
- `POST /api/auth/login` — rate limit 20/15 menit ✅
- `POST /api/cash-withdrawals/:id/verify` — **tidak ada rate limit khusus** ❌

OTP endpoint tanpa rate limit memungkinkan brute-force attack (6 digit OTP = 1 juta kombinasi). Dengan 100 request/menit (limit global), perlu ~7 hari untuk brute-force semua kombinasi — tapi tidak ada yang mencegah attacker stay dalam limit.

**Skor Risiko: LOW — 3/10**

---

# 9. SCALING ISSUES

### 9.1 Zero Pagination on All 146 Endpoints

Ini adalah **single biggest architectural problem** untuk scaling. Setiap `findMany()` di semua service tidak memiliki `take` atau `skip`:

```javascript
// transaction.service.js
async function list(user, branchContext, query) {
  const where = buildBranchWhere(user, branchContext);
  return prisma.transaction.findMany({ where, include: { items: true } });
  // ❌ No pagination — will return ALL transactions
}
```

**Pada 100 transaksi per hari per outlet:**
- 3 outlet → 300 transaksi/hari → 9.000/bulan → masih OK
- 30 outlet → 3.000 transaksi/hari → 90.000/bulan → mulai lambat
- 100 outlet → 10.000 transaksi/hari → 3.6 juta/tahun → crash
- 500 outlet → 50.000 transaksi/hari → 18 juta/tahun → impossible

### 9.2 O(N) Include Chain

Banyak endpoint menggunakan `include` untuk eager-load relasi tanpa batas. Contoh:

```javascript
// Contoh pattern yang umum:
prisma.transaction.findMany({
  where: { ... },
  include: {
    items: true,
    cashier: { select: { name: true } },
    branch: { select: { name: true } },
    cashSession: true,
  }
})
```

Semakin banyak data, semakin lambat query. Tanpa pagination, ini adalah **death spiral**: makin banyak transaksi, makin lambat setiap request, makin lama response time, makin besar kemungkinan timeout.

### 9.3 Invoice Number Collision pada Traffic Tinggi

`Date.now().slice(-6)` menghasilkan hanya 1.000.000 kemungkinan nilai. Pada sistem dengan 100+ transaksi per detik (multiple outlet, peak hour), collision probability mendekati 100%.

### 9.4 OTP Brute-Force pada Scale

6-digit OTP (1.000.000 kemungkinan) tanpa rate limit per-endpoint menjadi semakin berbahaya seiring scale. Attacker bisa menjalankan distributed brute-force dari banyak outlet.

### 9.5 Tidak Ada Database Read Replica Strategy

Semua query (read dan write) menggunakan Prisma client yang sama. Tidak ada pemisahan read/write connection. Pada skala 100+ outlet, query read yang berat (reports, dashboard) akan memblokir write transaksional.

---

# 10. FRANCHISE READINESS

**Skor: 0/100**

### Assessment

| Fitur Franchise | Status | Dampak |
|----------------|--------|--------|
| Multi-Company | ❌ Tidak ada | Franchisee adalah entitas legal terpisah |
| Royalty Fee | ❌ Tidak ada | Tidak bisa hitung royalty % dari omzet |
| Franchise Fee | ❌ Tidak ada | Tidak ada one-time fee management |
| Territory Management | ❌ Tidak ada | Tidak ada pembatasan wilayah |
| Franchisee Dashboard | ❌ Tidak ada | Franchisee butuh laporan terbatas |
| Centralized Supply Chain | ❌ Tidak ada | Pricing ke franchisee vs company-owned berbeda |
| Brand Compliance Audit | ❌ Tidak ada | Tidak ada tool audit outlet |
| Centralized Menu Management | ❌ Sebagian | BranchProduct ada tapi tidak untuk franchise |
| Centralized Reporting | ❌ Tidak ada | Laporan konsolidasi hanya untuk 1 entity |

### Analisis

Sistem ini dibangun untuk **single-entity, multi-outlet** — yaitu satu perusahaan dengan banyak cabang. Untuk franchise (banyak perusahaan, masing-masing dengan banyak cabang), arsitektur saat ini perlu dirombak total.

**Masalah fundamental:**
1. Tidak ada `Company` atau `Tenant` model — semua data flat dalam satu database tanpa isolasi tenant
2. Tidak ada pricing tier — satu harga jual untuk semua "outlet", padahal franchisee membeli dari pusat dengan harga berbeda
3. Tidak ada royalty/management fee — ini adalah revenue stream utama franchise
4. Reporting tidak bisa dipisah per franchisee — semua data tercampur

---

# 11. ERP READINESS SCORE

### Scoring Detail

| Dimensi | Skor | Alasan |
|---------|------|--------|
| **Master Data Management** | 5/10 | User, Product, Inventory sudah ada. Customer hilang. Multi-company hilang. |
| **Procurement** | 4/10 | Purchase Request → PO → Goods Receipt ada. Tapi Supplier Invoice, Payment, AP tidak ada. |
| **Inventory Management** | 6/10 | Branch inventory, warehouse, movement tracking sudah baik. Tapi tidak ada batch/lot management, serial number, atau production. |
| **POS & Sales** | 6/10 | Checkout flow lengkap (cash, QRIS, split, online). Tapi void flow lemah (bisa abuse), tidak ada customer link. |
| **Cash Management** | 5/10 | Cash session, withdrawal, OTP flow ada. Tapi OTP leak membatalkan security. Tidak ada daily cash reconciliation report. |
| **HR & Payroll** | 4/10 | Attendance, performance tracking ada. Tapi payroll masih hardcode, tidak ada BPJS/tax calculation, tidak ada leaves/absence management. |
| **Reporting** | 6/10 | 33 definitions dengan export Excel/PDF. Tapi tidak ada cross-branch comparison, trend analysis, atau automated scheduling. |
| **Finance** | 2/10 | Tidak ada general ledger, tidak ada AR/AP, tidak ada profit & loss, tidak ada balance sheet. |
| **System Administration** | 5/10 | RBAC, audit log, settings ada. Tapi backup/restore tidak ada, monitoring tidak ada. |
| **Integration** | 2/10 | Tidak ada API documentation, tidak ada webhook, tidak ada third-party integration framework. |

**ERP Readiness Score: 4.5/10**

---

# 12. RECOMMENDED ARCHITECTURE

### Immediate Fixes (Tanpa Refactor Besar)

```
1. HAPUS otpCode dari response API          → critical security fix (30 menit)
2. Tambah pagination middleware              → 3 hari di semua endpoint
3. Ganti invoice number ke UUID/crypto       → 1 jam
4. Fix branchAssignment permission           → 30 menit
5. Fix seed.js duplicate keys                → 10 menit
6. Tambah FRONTEND_URL di .env               → 1 menit
7. Tambah NaN check di GPS validation        → 15 menit
8. Tambah rate limiter di OTP verify         → 1 jam
9. Externalize hardcoded constants           → 2 hari
10. Tambah linting di backend               → 1 jam
```

### Target Architecture (6-12 bulan)

```
kruncuy-pos/
├── packages/
│   ├── @kruncuy/shared/           # TypeScript types, Prisma types, validation schemas
│   │   └── src/
│   │       ├── types/             # Prisma-generated types + custom types
│   │       ├── validators/        # Zod schemas shared backend-frontend
│   │       └── constants/         # Business constants, enums
│   ├── @kruncuy/api/              # Express REST API → TypeScript
│   │   └── src/
│   │       ├── core/              # Middleware, services, config
│   │       ├── modules/           # 28 modules → TypeScript
│   │       └── generated/         # Prisma client
│   └── @kruncuy/web/              # React SPA → TypeScript
│       └── src/
│           ├── features/          # Pages + services
│           └── components/        # UI kit
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── nginx.conf
├── docker-compose.yml             # PostgreSQL + API + Web
├── turbo.json                     # Turborepo orchestration
└── .github/workflows/
    ├── ci.yml                     # Lint → Type-check → Test → Build
    └── deploy.yml                 # Build images → push registry → deploy
```

### Key Architectural Decisions

1. **Pagination Middleware**: Wrapper untuk semua `findMany` — `req.query.page` dan `req.query.limit` otomatis diproses, return `{ data, meta: { total, page, limit, totalPages } }`.

2. **Event-Driven Inventory**: Gunakan queue/event pattern untuk inventory updates. Transaksi → emit event → inventory consumer process. Jangan langsung `applyRecipeConsumption()` dalam satu request transaksi.

3. **Refresh Token Pattern**: Access token 15 menit (httpOnly cookie) + Refresh token 7 hari. Hapus localStorage JWT pattern.

4. **Database Read Replicas**: Prisma mendukung connection pooling. Pisahkan read/write connection. Query report dan dashboard pakai read replica.

5. **Tenant Isolation**: Untuk franchise, tambahkan `tenantId` di semua model utama. Atau gunakan schema-per-tenant di PostgreSQL.

---

# 13. RECOMMENDED ROADMAP

### Phase 1: Security & Data Integrity — **30 Hari**

| Priority | Task | Effort | Risk |
|----------|------|--------|------|
| 🔴 P1 | Fix OTP cleartext leak | 30 menit | CRITICAL |
| 🔴 P1 | Fix branchAssignment permission guard | 30 menit | CRITICAL |
| 🔴 P1 | Ganti invoice number ke UUID/crypto | 1 jam | HIGH |
| 🔴 P1 | Fix GPS NaN validation | 15 menit | HIGH |
| 🔴 P1 | Tambah FRONTEND_URL di .env | 1 menit | HIGH |
| 🟡 P2 | Implementasi pagination di semua endpoint | 3 hari | HIGH |
| 🟡 P2 | Fix CrewOperationalPage bypass | 1 jam | HIGH |
| 🟡 P2 | Tambah branch filter di return service | 30 menit | MEDIUM |
| 🟡 P2 | Externalize hardcoded constants ke system settings | 2 hari | MEDIUM |
| 🟡 P2 | Fix seed.js duplicate keys | 10 menit | LOW |

### Phase 2: Engineering Excellence — **90 Hari**

| Priority | Task | Effort |
|----------|------|--------|
| 🟡 P2 | Tambah ESLint di backend | 1 jam |
| 🟡 P2 | Setup testing framework + integration test untuk auth | 5 hari |
| 🟡 P2 | Integration test untuk transaksi POS (checkout + void) | 5 hari |
| 🟡 P2 | Integration test untuk inventory movement | 3 hari |
| 🟡 P2 | Integration test untuk payroll calculation | 2 hari |
| 🟡 P2 | Integration test untuk cash withdrawal OTP flow | 3 hari |
| 🟡 P2 | Setup Docker + docker-compose | 2 hari |
| 🟡 P2 | Setup CI pipeline (lint → test → build) | 2 hari |
| 🟢 P3 | Setup npm workspaces + root package.json | 1 hari |

### Phase 3: Feature Completeness — **6 Bulan**

| Task | Effort |
|------|--------|
| Implementasi Customer model + API + frontend | 2 minggu |
| Implementasi Supplier Invoice & Payment | 2 minggu |
| Implementasi sisa 21 placeholder ERP pages | 4 minggu |
| Implementasi Production Batch & Yield | 2 minggu |
| Implementasi Cash Reconciliation Report | 1 minggu |
| Implementasi Cross-Branch Comparison Dashboard | 2 minggu |
| Implementasi Soft-Delete standardization | 1 minggu |

### Phase 4: Enterprise & Franchise — **12 Bulan**

| Task | Effort |
|------|--------|
| TypeScript migration (backend) | 3 bulan |
| TypeScript migration (frontend) | 2 bulan |
| Multi-Company/Tenant architecture | 2 bulan |
| Franchise module (royalty, fee, territory) | 2 bulan |
| Franchisee dashboard | 1 bulan |
| Centralized supply chain pricing | 1 bulan |
| Refresh token + httpOnly JWT | 2 minggu |
| Event-driven inventory system | 1 bulan |

---

# 14. CRITICAL ACTIONS

### 30 Hari — "Jangan Sampai Dibobol"

1. **✅ HAPUS `otpCode` dari response API** — ini membuat OTP flow tidak berguna. Ganti response jadi `{ success: true }` tanpa OTP.
2. **✅ FIX `branchAssignment.routes.js`** — tambah `requirePermission("branch-assignments:write")` untuk POST dan PATCH.
3. **✅ FIX `generateInvoiceNumber()`** — ganti dari `Date.now().slice(-6)` ke `crypto.randomBytes(3).toString("hex")`.
4. **✅ FIX GPS validation — tambah `isNaN()` check.**
5. **✅ TAMBAH `FRONTEND_URL` di `.env` production.**
6. **✅ TAMBAH pagination di 5 endpoint paling kritis** (transactions, cash-withdrawals, reports, inventory-items, users).
7. **✅ HAPUS atau REFACTOR CrewOperationalPage direct API call.**
8. **✅ TAMBAH branch filter di return.service.js `list()`.**
9. **✅ TAMBAH rate limiter di `POST /api/cash-withdrawals/:id/verify`.**
10. **✅ EXTERNALIZE hardcoded constants** ke system settings (bonusPerPcs, targetPcs, dll).

### 90 Hari — "Jangan Sampai Ambruk"

1. **TES: Integration test minimal untuk auth + transaksi + inventory.** Target: coverage 20%.
2. **INFRA: Docker + docker-compose + CI pipeline.**
3. **ARSITEKTUR: Pagination middleware di semua endpoint.**
4. **ARSITEKTUR: Soft-delete standardization (pilih satu: semua hard atau semua soft).**
5. **FITUR: Implementasi Customer model.**
6. **FITUR: Implementasi Supplier Invoice + Payment.**
7. **KODE: Tambah ESLint di backend + fix semua lint error.**
8. **KODE: Setup npm workspaces.**

### 1 Tahun — "Jadi Enterprise Grade"

1. **Migration ke TypeScript** — backend dulu, frontend menyusul.
2. **Tenant/Multi-Company architecture** untuk franchise readiness.
3. **Franchise module** — royalty, fee, territory, franchisee dashboard.
4. **Refresh token + httpOnly JWT** — hapus localStorage pattern.
5. **Event-driven inventory** — async processing untuk stock updates.
6. **Production Batch & Yield tracking.**
7. **Financial module** — minimal P&L per branch + consolidated.

---

# 15. FINAL VERDICT

### Score Summary

| Dimensi | Skor |
|---------|------|
| **Business Score** | 35/100 |
| **ERP Score** | 45/100 |
| **Architecture Score** | 60/100 |
| **Security Score** | 20/100 |
| **Franchise Score** | 0/100 |
| **Scalability Score** | 10/100 |
| **Overall** | **25/100** |

### Kesimpulan

**KRUNCUY POS adalah proyek dengan fondasi arsitektur yang baik, tetapi dihantui oleh security flaw kritis dan sama sekali tidak siap scale.**

Hal yang sudah benar:
- Modular architecture ✅
- RBAC dan branch isolation ✅
- Dynamic report system ✅
- Coverage domain bisnis yang luas ✅

Hal yang harus segera diperbaiki:
- **Security**: OTP leak, localStorage JWT, permission escalation, GPS bypass — semua critical
- **Data Integrity**: Invoice collision, seed bug, soft-delete inconsistency
- **Testing**: 0.3% coverage — ini memalukan untuk sistem yang menangani uang
- **Pagination**: Zero pagination di semua endpoint — akan crash di 50+ outlet
- **Missing Features**: Customer, Supplier Invoice, Production, Multi-Company, Franchise

### Apakah Saya Mau Investasi?

**Tidak untuk saat ini.**

Jika saya adalah CEO yang akan membeli sistem ini untuk 500 outlet, saya TIDAK AKAN menginvestasikan uang sebelum:

1. Semua critical security issue diperbaiki (termasuk OTP leak dan localStorage JWT)
2. Pagination diimplementasikan di semua endpoint
3. Test coverage minimal 20%
4. Customer model ditambahkan
5. Infrastructure (Docker, CI/CD) sudah ada
6. Ada bukti sistem bisa handle 100+ transaksi per detik (performance test)

Setelah itu semua selesai, sistem ini punya potensi menjadi ERP F&B yang solid.

**Estimasi waktu untuk siap investasi: 6-12 bulan dengan tim 3-5 developer.**

---

*Audit dilakukan oleh ERP/F&B Business Consultant — 11 Juni 2026*
*Tidak ada pujian yang tidak layak. Tidak ada kelemahan yang disembunyikan.*
