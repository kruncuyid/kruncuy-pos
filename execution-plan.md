# Execution Plan KRUNCUY POS ERP

> **Dasar:** `report.md` — Audit 11 Juni 2026
> **Scope:** POS ERP Multi-Outlet Company-Owned (1–100 outlet)
> **Status:** DRAFT — Menunggu Approval

---

## Scope

Execution plan ini mencakup seluruh perbaikan untuk **KRUNCUY POS ERP company-owned, multi-outlet** — mulai dari 1 outlet hingga 100 outlet. Semua rekomendasi dari `report.md` yang relevan untuk operasional branch sendiri (bukan franchise) dimasukkan ke dalam 5 level prioritas.

Target akhir:
- **Sistem yang AMAN** — tidak ada critical security flaw
- **Sistem yang RAPI** — kode bersih, test coverage minimal, tooling modern
- **Sistem yang SCALABLE** — mampu handle 100 outlet tanpa redesign
- **Sistem yang LENGKAP** — semua fitur ERP dasar terimplementasi

---

## Excluded Scope

Item berikut **TIDAK dikerjakan** dalam execution plan ini karena masuk ranah franchise:

| Item | Alasan |
|------|--------|
| Franchise module | Diluar scope company-owned |
| Royalty fee calculation | Hanya relevan untuk franchise |
| Franchise fee management | Hanya relevan untuk franchise |
| Territory management | Hanya relevan untuk franchise |
| Franchisee dashboard | Hanya relevan untuk franchise |
| Brand compliance audit | Hanya relevan untuk franchise |
| Multi-Company / Tenant architecture | Untuk franchise multi-PT |
| Centralized supply chain pricing (franchise tier) | Pricing berbeda untuk franchisee |
| Tenant isolation di database | Untuk franchise multi-entity |

> **Catatan:** Multi-company dan tenant architecture mungkin diperlukan di masa depan untuk enterprise dengan banyak PT. Tapi untuk 1–100 outlet company-owned, single-entity sudah mencukupi.

---

## Priority 1 — Critical Security & Data Integrity

**Tujuan:** Menutup semua celah yang memungkinkan kebocoran data, privilege escalation, dan manipulasi data.

**Estimasi: 3–5 hari**

### 1.1 Fix OTP Cleartext Leak
| Aspek | Detail |
|-------|--------|
| **File** | `backend/src/modules/cash-withdrawals/cashWithdrawal.service.js:438,473,505,547` |
| **Masalah** | OTP dikembalikan dalam plaintext di response API (`otpCode` dalam response) — membatalkan seluruh fungsi OTP sebagai second factor |
| **Fix** | Hapus `otpCode` dari response. Cukup return `{ success: true, otpExpiresAt }`. Hash tetap dipakai untuk validasi di endpoint verify. Frontend perlu diubah agar tidak lagi menampilkan OTP code ke user — ganti dengan pesan "OTP telah dikirim" atau alur notifikasi lain |
| **Estimasi** | 1 jam |
| **Frontend Impact** | `CrewCashWithdrawalsPage.jsx` — modal yang menampilkan OTP code harus diubah |
| **Risk** | CRITICAL |

### 1.2 Fix Branch Assignment Permission
| Aspek | Detail |
|-------|--------|
| **File** | `backend/src/modules/branch-assignments/branchAssignment.routes.js:8` |
| **Masalah** | Router-level `requirePermission("branch-assignments:read")` mengizinkan POST dan PATCH hanya dengan permission READ |
| **Fix** | Hapus `router.use()` permission guard. Pasang `requirePermission("branch-assignments:write")` di route POST dan PATCH. Pertahankan `:read` di route GET |
| **Estimasi** | 30 menit |
| **Risk** | CRITICAL |

### 1.3 Fix Invoice Number Collision
| Aspek | Detail |
|-------|--------|
| **File** | `backend/src/modules/transactions/transaction.service.js:4-10` |
| **Masalah** | `String(now.getTime()).slice(-6)` — hanya 6 digit terakhir millisecond. Collision pada concurrent create |
| **Fix** | Ganti dengan `crypto.randomBytes(4).toString("hex").toUpperCase()` — 8 karakter hex, collision probability sangat rendah. Atau gunakan database sequence jika ingin sequential |
| **Estimasi** | 1 jam |
| **Risk** | HIGH |

### 1.4 Fix GPS NaN Validation
| Aspek | Detail |
|-------|--------|
| **File** | `backend/src/modules/cash-sessions/cashSession.service.js` |
| **Masalah** | `!NaN` bernilai `true`, sehingga validasi lolos untuk input NaN. `NaN > 20` selalu `false`, sehingga crew bisa open shift dari mana saja |
| **Fix** | Tambah `isNaN(userLat) || isNaN(userLng)` check setelah `Number()` conversion. Perbaiki conditional logic |
| **Estimasi** | 15 menit |
| **Risk** | HIGH |

### 1.5 Fix FRONTEND_URL di .env
| Aspek | Detail |
|-------|--------|
| **File** | `backend/.env`, `backend/src/core/config/env.js` |
| **Masalah** | `backend/.env` tidak memiliki `FRONTEND_URL`. Fallback ke `localhost:5173`. CORS akan gagal di production |
| **Fix** | Tambah `FRONTEND_URL` di `.env`. Update `.env.example` jika perlu |
| **Estimasi** | 1 menit |
| **Risk** | HIGH |

### 1.6 Fix Rate Limiter di OTP Verify
| Aspek | Detail |
|-------|--------|
| **File** | `backend/src/modules/cash-withdrawals/cashWithdrawal.routes.js` |
| **Masalah** | Endpoint `POST /api/cash-withdrawals/:id/verify` tidak punya rate limiter spesifik. 6-digit OTP bisa di-brute-force |
| **Fix** | Tambah rate limiter: max 5 percobaan per 15 menit per withdrawal ID. Gunakan `express-rate-limit` yang sudah ada di project |
| **Estimasi** | 1 jam |
| **Risk** | MEDIUM |

### 1.7 Fix Branch Filter di Return Service
| Aspek | Detail |
|-------|--------|
| **File** | `backend/src/modules/returns/return.service.js` |
| **Masalah** | `list()` tidak menyertakan branch filter — semua return dari semua branch terlihat |
| **Fix** | Gunakan `buildBranchWhere(user, branchContext)` pattern seperti di module lain. Tambahkan parameter branchId di service |
| **Estimasi** | 30 menit |
| **Risk** | MEDIUM |

### 1.8 Fix CrewOperationalPage Direct API Bypass
| Aspek | Detail |
|-------|--------|
| **File** | `frontend/src/features/crew/pages/CrewOperationalPage.jsx:62` |
| **Masalah** | Frontend langsung `api.post("/inventory/movements", ...)` tanpa service layer. Bypass semua validasi dan audit log |
| **Fix** | Buat service function di `crewApi` atau `returnApi`. Panggil service function, bukan raw API. Tambahkan endpoint dedicated di backend jika belum ada |
| **Estimasi** | 2 jam |
| **Risk** | HIGH |

### 1.9 Externalize Hardcoded Constants
| Aspek | Detail |
|-------|--------|
| **File** | `payroll.service.js:55`, `pos.service.js:156`, `crew.service.js:7` |
| **Masalah** | `bonusPerPcs = 250`, `targetPcs = 450` — hardcoded, tidak bisa dikonfigurasi |
| **Fix** | Baca dari `SystemSetting` table. Gunakan key `crew_bonus_per_pcs`, `crew_target_pcs`, dll. Fallback ke nilai default jika belum di-set. Crew.service sudah membaca system setting — payroll.service harus diselaraskan |
| **Estimasi** | 1 hari |
| **Risk** | MEDIUM |

### 1.10 Fix Seed Duplicate Keys
| Aspek | Detail |
|-------|--------|
| **File** | `backend/prisma/seed.js:53-58,64-68,75-79` |
| **Masalah** | Properti `lat:` dan `lng:` diulang 3× dalam object yang sama — copy-paste bug |
| **Fix** | Hapus duplikasi. Pertahankan satu pasang `lat`/`lng` per branch |
| **Estimasi** | 10 menit |
| **Risk** | LOW |

---

## Priority 2 — Scalability Foundation

**Tujuan:** Memastikan sistem tidak crash saat data bertambah hingga 100 outlet.

**Estimasi: 1–2 minggu**

### 2.1 Pagination di Semua Endpoint Penting

Implementasi pagination pada endpoint yang paling sering diakses:

| Endpoint | Priority | Reason |
|----------|----------|--------|
| `GET /api/transactions` | 🔴 P1 | Paling sering diakses, data paling banyak |
| `GET /api/transactions/today` | 🟡 P2 | Data terbatas, tapi tetap perlu pagination |
| `GET /api/cash-withdrawals` | 🟡 P2 | Bisa ribuan record |
| `GET /api/reports/:reportKey` | 🟡 P2 | Report data bisa besar |
| `GET /api/inventory/items` | 🟡 P2 | Ratusan item per branch |
| `GET /api/inventory/branches/:id/items` | 🟡 P2 | Sama |
| `GET /api/users` | 🟢 P3 | Data terbatas, tetap perlu untuk konsistensi |
| `GET /api/branches` | 🟢 P3 | Data terbatas |
| `GET /api/products` | 🟢 P3 | Bisa ratusan produk |
| `GET /api/purchase-requests` | 🟡 P2 | Perlu filter + pagination |
| `GET /api/purchase-orders` | 🟡 P2 | Perlu filter + pagination |
| `GET /api/depot-transfers` | 🟡 P2 | Perlu filter + pagination |
| `GET /api/returns` | 🟢 P3 | Data lebih sedikit |

### 2.2 Standarisasi Response Pagination

Buat format response konsisten:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Langkah:**
1. Buat helper `paginatedResponse(data, total, page, limit)` di `core/utils/`
2. Update semua controller untuk menggunakan helper ini
3. Update frontend services untuk membaca `meta` object

### 2.3 Database Index yang Diperlukan

| Table | Index | Reason |
|-------|-------|--------|
| `Transaction` | `@@index([branchId, status, createdAt])` | Filter branch + status + date range |
| `TransactionItem` | `@@index([transactionId])` | Foreign key query |
| `InventoryMovement` | `@@index([branchId, type, createdAt])` | Filter movement by branch + type |
| `AuditLog` | `@@index([userId, action, createdAt])` | Filter audit trail |
| `StockOpnameItem` | `@@index([stockOpnameId, inventoryItemId])` | Lookup opname items |
| `OutletExpense` | `@@index([branchId, status, createdAt])` | Filter expense by branch |

### 2.4 Optimasi Query findMany

1. Batasi `include` — jangan eager-load semua relasi. Gunakan `select` untuk field yang diperlukan saja
2. Tambah `take` default di semua `findMany()` — minimal 20, maksimal 100
3. Untuk query yang membutuhkan total count, gunakan `prisma.$transaction([model.count({ where }), model.findMany({ ... })])` untuk atomicity

### 2.5 Hindari Include Chain Berlebihan

**Pattern yang harus dihindari:**
```javascript
prisma.transaction.findMany({
  include: {
    items: { include: { product: { include: { category: true } } } },
    cashier: true,
    branch: true,
    cashSession: { include: { withdrawals: true } }
  }
})
```

**Pattern yang benar:**
```javascript
prisma.transaction.findMany({
  select: {
    id: true, invoiceNumber: true, totalAmount: true, createdAt: true,
    items: { select: { id: true, name: true, qty: true, subtotal: true } },
    cashier: { select: { name: true } },
    branch: { select: { name: true } }
  }
})
```

---

## Priority 3 — Engineering Quality

**Tujuan:** Menaikkan standar engineering, test coverage, dan infrastructure.

**Estimasi: 1–2 bulan**

### 3.1 Backend Linting

| Task | Detail |
|------|--------|
| Install ESLint | `npm install -D eslint` di backend |
| Konfigurasi | Flat config atau `.eslintrc.json` dengan standard rules |
| Script | Tambah `"lint": "eslint src/"` di `package.json` |
| Auto-fix | Jalankan `--fix` untuk masalah otomatis |

### 3.2 Prettier

| Task | Detail |
|------|--------|
| Install | `npm install -D prettier` di root/backend/frontend |
| Konfigurasi | `.prettierrc` — single quote, trailing comma, tab width 2 |
| Integration | Integrasi dengan ESLint via `eslint-config-prettier` |
| Script | `"format": "prettier --write src/"` |

### 3.3 Testing Framework Setup

| Task | Detail |
|------|--------|
| Backend | Gunakan `node --test` (native, sudah ada). Setup test helper untuk Prisma |
| Frontend | Vitest (sudah ada). Setup test helper untuk React components |
| Database | Setup test database atau in-memory SQLite untuk integration test |
| CI | Test harus jalan di CI pipeline |

### 3.4 Integration Test: Auth
- Login success (email + password valid)
- Login fail (password salah, user tidak aktif)
- Token verification (valid token, expired token, invalid token)
- Permission check (user dengan akses vs tanpa akses)
- Branch context (user global access vs single branch)

### 3.5 Integration Test: POS Transaction
- Checkout cash (full flow)
- Checkout QRIS
- Checkout split payment
- Void transaction
- Void dengan reason
- Checkout tanpa active shift → error
- Checkout dengan item invalid → error

### 3.6 Integration Test: Inventory Movement
- Stock deduction saat checkout
- Stock reversal saat void
- Purchase → stock in
- Waste → stock out
- Transfer → warehouse → branch
- Transfer approval

### 3.7 Integration Test: Payroll
- Calculate bonus (berdasarkan PCS)
- Create payroll record
- Approve payroll
- Pay payroll
- Duplicate period → error

### 3.8 Integration Test: Cash Withdrawal OTP
- Request withdrawal
- Generate OTP
- Verify OTP (correct code)
- Verify OTP (wrong code → error)
- Verify OTP (expired → error)
- Cancel withdrawal

### 3.9 NPM Workspaces

Restrukturisasi monorepo dengan npm workspaces:

```
kruncuy-pos/
├── package.json          # Root workspace config
├── backend/
│   ├── package.json      # Workspace: @kruncuy/api
├── frontend/
│   ├── package.json      # Workspace: @kruncuy/web
```

`root/package.json`:
```json
{
  "private": true,
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "dev": "npm run dev --workspace=backend & npm run dev --workspace=frontend",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

### 3.10 Docker

| File | Content |
|------|---------|
| `Dockerfile.api` | Node 22 Alpine, install deps, Prisma generate, start server |
| `Dockerfile.web` | Node 22 Alpine, build static, serve with nginx |
| `docker-compose.yml` | PostgreSQL 16 + API + Web |
| `.dockerignore` | node_modules, .git, .env |

### 3.11 CI Pipeline

**GitHub Actions — `.github/workflows/ci.yml`:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, install, lint]
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
    steps: [checkout, setup-node, install, prisma-generate, migrate, test]
  build:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, install, frontend-build]
```

---

## Priority 4 — ERP Feature Completion

**Tujuan:** Melengkapi fitur ERP yang hilang untuk operasional daily.

**Estimasi: 2–3 bulan**

### 4.1 Customer Model

**Database:**
```prisma
model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  transactions Transaction[]

  @@index([phone])
  @@index([name])
}
```

**API:**
- `GET /api/customers` — list customers (dengan search by name/phone)
- `POST /api/customers` — create customer
- `GET /api/customers/:id` — customer detail with transaction history

**Transaction Link:**
- Tambah `customerId` optional di Transaction model
- Checkout POS bisa menyertakan customer (opsional)

**UI:**
- Halaman Customer management di ERP
- Customer quick-select di POS checkout
- Riwayat transaksi per customer

### 4.2 Supplier Invoice & Payment

**Database:**
```prisma
model SupplierInvoice {
  id           String   @id @default(cuid())
  supplierId   String
  purchaseOrderId String?
  invoiceNumber String
  totalAmount  Decimal  @db.Decimal(18,2)
  dueDate      DateTime
  status       SupplierInvoiceStatus @default(PENDING)
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  supplier     Supplier @relation(fields: [supplierId], references: [id])
  payments     SupplierPayment[]
  purchaseOrder PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id])

  @@unique([supplierId, invoiceNumber])
  @@index([supplierId, status])
  @@index([dueDate])
}

enum SupplierInvoiceStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

model SupplierPayment {
  id            String   @id @default(cuid())
  supplierInvoiceId String
  amount        Decimal  @db.Decimal(18,2)
  paymentDate   DateTime
  paymentMethod String
  notes         String?
  createdAt     DateTime @default(now())

  invoice       SupplierInvoice @relation(fields: [supplierInvoiceId], references: [id])

  @@index([supplierInvoiceId])
}
```

**API:**
- CRUD Supplier Invoice
- CRUD Supplier Payment
- Invoice aging report (due date, overdue)

### 4.3 Accounts Payable (Basic)

- Dashboard AP aging: current, 30, 60, 90+ days
- Total outstanding per supplier
- Payment history per invoice

### 4.4 Production Batch

**Konteks:** Untuk outlet yang produksi sendiri (central kitchen).

**Database:**
```prisma
model ProductionBatch {
  id             String   @id @default(cuid())
  recipeId       String
  batchNumber    String
  plannedQty     Decimal  @db.Decimal(18,3)
  actualQty      Decimal  @db.Decimal(18,3)
  status         ProductionBatchStatus @default(PLANNED)
  notes          String?
  producedAt     DateTime?
  createdAt      DateTime @default(now())

  recipe         MenuRecipe @relation(fields: [recipeId], references: [id])
  items          ProductionBatchItem[]

  @@index([recipeId])
  @@index([batchNumber])
}

model ProductionBatchItem {
  id              String  @id @default(cuid())
  batchId         String
  inventoryItemId String
  plannedQty      Decimal @db.Decimal(18,3)
  actualQty       Decimal @db.Decimal(18,3)

  batch           ProductionBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])

  @@index([batchId])
}

enum ProductionBatchStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### 4.5 Yield Tracking

- Standard yield dari MenuRecipe (BOM)
- Actual yield dari ProductionBatch
- Variance report: actual vs standard
- Waste percentage per batch

### 4.6 Waste Tracking

Tracking waste terpisah dari retur:
- `Waste` model atau perluasan `InventoryMovement` dengan type `WASTE`
- Kategori waste: PRODUCTION, SPOILAGE, EXPIRED, DAMAGED, OTHER
- Waste approval flow (optional)
- Waste report per branch

> **Catatan:** Saat ini waste sudah ada di `InventoryMovement` type `WASTE` dan digunakan di CrewOperationalPage. Tapi perlu:
> - Kategori waste yang terstruktur
> - Approval flow (jika nilai di atas threshold)
> - Report waste per branch per periode

### 4.7 Cash Reconciliation Report

Laporan yang merekonsiliasi:
- Opening cash → cash sales → expenses → withdrawals → expected closing cash
- Actual closing cash → variance
- Per branch, per shift, per hari

**Backend:** Report generator baru di `reportGenerators.js`
**Frontend:** Report view config baru di `reportViewConfig.js`

### 4.8 Cross-Branch Dashboard

**Backend:**
- Endpoint `GET /api/reports/cross-branch` — return semua branch dengan metrics:
  - Today's sales, PCS, transactions
  - MoM growth
  - Cash variance
  - Stock alerts

**Frontend:**
- Dashboard dengan branch comparison table
- Sort by sales, growth, variance
- Visual indicators (hijau > target, merah < target)

### 4.9 Implementasi Sisa Placeholder ERP Pages

Placeholder yang perlu diimplementasi (dari `App.jsx:414-443`):

| Route | Priority | Notes |
|-------|----------|-------|
| `/erp/master-data` | 🟡 P2 | Halaman management master reference data |
| `/erp/purchasing` | 🟡 P2 | Purchasing overview |
| `/erp/purchasing-queue` | 🟡 P2 | Queue approval |
| `/erp/shipment-tracking` | 🟢 P3 | Tracking pengiriman |
| `/erp/operations-log` | 🟢 P3 | Log operasional |
| `/erp/branch-orders` | 🟢 P3 | Order antar branch |
| `/erp/cash-control` | 🟡 P2 | Cash monitoring |
| `/erp/compliance` | 🟢 P3 | Compliance page |
| `/erp/reference` | 🟢 P3 | Reference data |
| (12 lainnya) | 🟢 P3 | Menyesuaikan |

**Implementasi:**
1. Untuk halaman dengan data existing: buat halaman dengan ManagementTable pattern
2. Untuk halaman tanpa data: tetap implementasi dengan EmptyState + deskripsi
3. Hapus dari `erpPlaceholderRoutes` filter

---

## Priority 5 — Production Hardening

**Tujuan:** Memastikan sistem siap production untuk 100 outlet.

**Estimasi: 2–3 bulan (paralel dengan Priority 3 & 4)**

### 5.1 Refresh Token + httpOnly Cookie

**Mengapa:** JWT di localStorage adalah critical security issue (XSS → full account access).

**Desain:**
```
POST /api/auth/login
  → return { accessToken (di body), refreshToken (httpOnly cookie) }
  
Access Token: 15 menit — dikirim via Authorization header
Refresh Token: 7 hari — httpOnly cookie, path=/api/auth/refresh

POST /api/auth/refresh
  → baca cookie, validasi refresh token, return accessToken baru

Jika refresh token expired → redirect ke /login
```

**Tahapan:**
1. Backend: Buat refresh token table / field di User
2. Backend: `POST /api/auth/refresh` endpoint
3. Frontend: Axios interceptor untuk refresh token logic
4. Frontend: Hapus localStorage, simpan access token di memory (variable)
5. Uji coba: semua flow login harus tetap berfungsi

### 5.2 Monitoring

| Tool | Function |
|------|----------|
| Response time monitoring | Track slow endpoints (>500ms) |
| Error rate monitoring | Track 4xx/5xx rate |
| Active user monitoring | Concurrent sessions |
| Database query monitoring | Slow queries |

**Implementasi minimal:**
- Middleware `requestTimer` — log semua request dengan duration
- Endpoint `GET /api/health` — sudah ada, perlu diperluas dengan DB connection status
- Alert jika error rate > 5% dalam 5 menit

### 5.3 Logging

| Layer | Tool | Detail |
|-------|------|--------|
| Backend | Morgan (sudah ada) | HTTP request logging |
| Backend | Winston/Pino | Structured logging untuk aplikasi |
| Backend | Audit Log (sudah ada) | Immutable action log |

**Improvement:**
- Morgan hanya di development — perlu file logging untuk production
- Tambah request ID (UUID) di setiap request untuk tracing
- Struktur log JSON untuk integrasi dengan log aggregator

### 5.4 Backup Strategy

| Aspek | Detail |
|-------|--------|
| Database | PostgreSQL `pg_dump` — daily + WAL archiving for point-in-time recovery |
| File upload | Receipt photos — backup ke cloud storage (S3/Google Cloud) |
| Schedule | Daily full backup, hourly WAL |
| Retention | 7 hari daily, 30 hari weekly, 12 bulan monthly |
| Test | Monthly restore drill |

### 5.5 Error Tracking

| Tool | Function |
|------|----------|
| Sentry | Error tracking + performance monitoring |
| Integrasi | Middleware Express + React ErrorBoundary |

**Implementasi:**
```javascript
// Backend — error.middleware.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });

exports.errorHandler = (err, req, res, next) => {
  Sentry.captureException(err);
  // ... existing error handler
};
```

### 5.6 Performance Testing

| Test | Tool | Skenario |
|------|------|----------|
| API load test | k6 / autocannon | 100 concurrent users, POS checkout |
| Database stress test | pgbench | 10K transactions, concurrent writes |
| Endurance test | k6 | 1 hour sustained load |

**Target:**
- POS checkout: < 500ms di 100 concurrent users
- API response: < 200ms p50, < 1s p99
- Database: zero deadlock, no timeout

---

## Implementation Rules

### Workflow

1. ✅ Execution plan ini selesai dan menunggu approval
2. ⏳ Setelah approve, kerjakan **Priority 1** dulu (semua task)
3. ⏳ Setelah Priority 1 selesai, kerjakan **Priority 2**
4. ⏳ Priority 3, 4, 5 bisa dikerjakan paralel setelah Priority 2 selesai
5. ⏳ Setiap selesai satu priority → jalankan test → catat di `/progress.md`
6. ⏳ Setiap bug/fix harus dicatat di `/changelog.md`

### Constraints

- ❌ **Jangan** mengerjakan fitur franchise (lihat Excluded Scope)
- ❌ **Jangan** mengubah scope bisnis tanpa izin
- ❌ **Jangan** membuat fitur baru di luar `report.md` dan `execution-plan.md`
- ✅ Setiap perubahan database → buat migration Prisma yang rapi
- ✅ Setiap selesai phase → jalankan test
- ✅ Jika test belum ada → buat test minimal untuk modul tersebut
- ✅ Jika ada konflik source code vs report.md → tanya keputusan user

### Tracking Files

| File | Fungsi |
|------|--------|
| `/progress.md` | Catat progres per priority |
| `/changelog.md` | Catat setiap perubahan + fix |

---

*Dibuat dari: `report.md` Audit 11 Juni 2026*
*Fokus: POS ERP Multi-Outlet Company-Owned (1–100 outlet)*
