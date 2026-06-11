# Progress

## Phase P0 — Go-Live Essentials (Crew POS Master Plan)

**Status:** ✅ Selesai
**Tanggal:** 11 Juni 2026
**Referensi:** `crew-pos-go-live-master-plan.md` — Bagian 12.2 (P0)

| # | Task | Status | File Changes |
|---|------|--------|-------------|
| P0.1 | Void approval threshold — enforce > Rp 100rb butuh second factor | ✅ | `CrewSalesTodayPage.jsx` |
| P0.2 | Void reason mandatory + konfirmasi nominal | ✅ | `CrewSalesTodayPage.jsx` |
| P0.3 | Simplify cash terminology — "Uang Masuk", "Uang Keluar", "Sisa Cash" | ✅ | `CrewCashWithdrawalsPage.jsx`, `CrewHomePage.jsx` |
| P0.4 | Replace "Setoran Belum Diambil" → "Penarikan Menunggu" | ✅ | `CrewCashWithdrawalsPage.jsx`, `CrewHomePage.jsx` |
| P0.5 | Target PCS dashboard — progress bar | ✅ | `CrewHomePage.jsx` |
| P0.6 | Expected cash auto-display di close shift | ✅ | `CrewHomePage.jsx` |
| P0.7 | Enforce stock opname — DIBATALKAN | ❌ | Buka/tutup shift tidak perlu opname |
| P0.8 | Enforce stock opname closing — DIBATALKAN | ❌ | Buka/tutup shift tidak perlu opname |
| P0.9 | OTP flow fix — hapus otpCode dari crew response, owner tetap lihat | ✅ | `cashWithdrawal.service.js` |
| P0.10 | Human-readable error messages — API interceptor | ✅ | `api.js` |
| P0.11 | POS keyboard scroll fix — sticky bottom + auto-scroll | ✅ | `CrewPosPage.jsx` |

---

## Sprint 1 — Critical Security & Data Integrity

**Status:** ✅ Selesai
**Tanggal:** 11 Juni 2026
**Total Task:** 10/10

| # | Task | Status | File Changes |
|---|------|--------|-------------|
| 1.1 | Fix OTP cleartext leak | ✅ | `cashWithdrawal.service.js`, `CrewCashWithdrawalsPage.jsx` |
| 1.2 | Fix Branch Assignment permission | ✅ | `branchAssignment.routes.js` |
| 1.3 | Fix Invoice Number collision | ✅ | `transaction.service.js` |
| 1.4 | Fix GPS NaN validation | ✅ | `cashSession.service.js` |
| 1.5 | Fix FRONTEND_URL di .env | ✅ | `backend/.env` |
| 1.6 | Fix OTP rate limiter | ✅ | `cashWithdrawal.routes.js` |
| 1.7 | Fix Return Service branch isolation | ✅ | `return.service.js`, `return.controller.js` |
| 1.8 | Fix CrewOperationalPage API bypass | ✅ | `crew.service.js`, `crew.controller.js`, `crew.routes.js`, `crewApi.js`, `CrewOperationalPage.jsx` |
| 1.9 | Fix hardcoded constants | ✅ | `payroll.service.js`, `pos.service.js` |
| 1.10 | Fix seed duplicate keys | ✅ | `seed.js` |

---

## Sprint 2 — Scalability Foundation

**Status:** ⏸ Sebagian Selesai (menunggu keputusan user)
**Tanggal:** 11 Juni 2026
**Total Task:** 6/8

| # | Task | Status | File Changes |
|---|------|--------|-------------|
| 2.1 | Pagination framework — helper `paginatedResponse()` + `parsePagination()` | ✅ | `core/utils/pagination.js` |
| 2.2 | Implementasi pagination di endpoint kritis (transactions, cash-withdrawals, inventory, users, products) | ✅ | `transaction.service.js`, `transaction.controller.js`, `cashWithdrawal.service.js`, `inventory.service.js`, `inventory.controller.js`, `user.service.js`, `user.controller.js`, `product.service.js`, `product.controller.js` |
| 2.3 | Standard pagination response format — `{ data, meta: { page, limit, total, totalPages } }` | ✅ | `core/utils/pagination.js` |
| 2.4 | Database indexing — tambah index `[branchId, type, createdAt]` di InventoryMovement | ✅ | `schema.prisma` |
| 2.5 | Query optimization — batasi `include`, gunakan `select`, tambah `skip`/`take` | ✅ | Tercakup di 2.2 |
| 2.6 | Include chain reduction — audit `findMany` dengan `include` besar, refactor ke `select` | ✅ | Tercakup di 2.2 |
| 2.7 | Audit Trail enhancement — pagination + filter (action, entity, user, date) | ✅ | `auditLog.service.js` (core + module), `auditLog.controller.js` |
| 2.8 | Approval Workflow foundation — utility `assertValidTransition()` + `canTransition()` | ✅ | `core/utils/approval.js` (NEW) |

---

## Sprint 3 — ERP Core Completion

**Status:** ⏳ Sedang Berjalan
**Tanggal:** 11 Juni 2026
**Total Task:** 4/10

| # | Task | Status | File Changes |
|---|------|--------|-------------|
| 3.1 | Customer model (Prisma) | ✅ | `schema.prisma` |
| 3.2 | Customer API — CRUD endpoints | ✅ | `customer.service.js`, `customer.controller.js`, `customer.routes.js`, `app.js` |
| 3.3 | Customer history — transaksi per customer | ✅ | Tercakup di `getById()` |
| 3.4 | Customer search — frontend page | ✅ | `ErpCustomersPage.jsx`, `customerApi.js`, `App.jsx`, `erpNavigation.config.js` |
| 3.5 | Supplier Invoice — model + API + frontend | ✅ | `schema.prisma`, `supplierInvoice.service/controller/routes`, `app.js`, `ErpSupplierInvoicesPage`, `supplierInvoiceApi.js`, `App.jsx` |
| 3.6 | Supplier Payment — model + API + frontend | ✅ | Tercakup di 3.5 |
| 3.7 | Accounts Payable Aging — report + catalog + view config | ✅ | `reportGenerators.js`, `reportCatalog.js`, `reportViewConfig.js` |
| 3.8 | Cash Reconciliation Report — rekonsiliasi per shift | ✅ | `reportGenerators.js`, `reportCatalog.js`, `reportViewConfig.js` |
| 3.9 | Placeholder pages — add customers + supplier-invoices to exclude list | ✅ | `App.jsx` |

---

## Sprint 4 — Management & Monitoring

**Status:** ✅ Selesai
**Tanggal:** 11 Juni 2026
**Total Task:** 5/5

| # | Task | Status | File Changes |
|---|------|--------|-------------|
| 4.1 | Cross Branch Dashboard — perbandingan semua outlet | ✅ | `erp.controller.js`, `erp.service.js`, `erp.routes.js`, `ErpCrossBranchPage.jsx`, `erpOverviewApi.js`, `App.jsx`, `erpNavigation.config.js` |
| 4.2 | Notification Center — aggregasi alert (stock, withdrawal, expense) | ✅ | `notification.service/controller/routes.js`, `ErpNotificationsPage.jsx`, `notificationApi.js`, `App.jsx`, `erpNavigation.config.js`, `app.js` |
| 4.3 | Audit Dashboard — visualisasi audit log (existing page + search) | ✅ | Selesai di Sprint 2 (2.7) — search + pagination sudah ada |
| 4.4 | Stock Alert — notifikasi stok di bawah minimum | ✅ | Tercakup di 4.2 Notification Center |
| 4.5 | Cash Alert — deteksi anomaly withdrawal/expense pending | ✅ | Tercakup di 4.2 Notification Center |

---

## Sprint 5 — Engineering Excellence

**Status:** ✅ Selesai
**Tanggal:** 11 Juni 2026
**Total Task:** 8/8

| # | Task | Status | Detail |
|---|------|--------|--------|
| 5.1 | ESLint backend — install, config, 0 errors | ✅ | `eslint.config.js`, `.prettierrc`, scripts di `package.json` |
| 5.2 | Prettier — format standar | ✅ | `.prettierrc`, `format` + `format:check` scripts |
| 5.3 | Integration test setup — helper + Prisma | ✅ | `tests/helpers/setup.js` |
| 5.4 | Auth test — login, token, permission, inactive user | ✅ | 5 test cases |
| 5.5 | POS Transaction test — invoice, checkout, catalog | ✅ | 3 test cases |
| 5.6 | Inventory test — list, branch stock, recipe | ✅ | 3 test cases |
| 5.7 | Payroll test — calculate, create, approve flow | ✅ | 2 test cases |
| 5.8 | Cash Withdrawal OTP test — generate, hash, rate limit | ✅ | 3 test cases |

---

## Sprint 6 — Infrastructure

**Status:** ✅ Selesai
**Tanggal:** 11 Juni 2026
**Total Task:** 8/8

| # | Task | Status | Detail |
|---|------|--------|--------|
| 6.1 | Docker — `Dockerfile.api` + `Dockerfile.web` | ✅ | Multi-stage build, alpine |
| 6.2 | Docker Compose — PostgreSQL + API + Web | ✅ | `docker-compose.yml` + nginx config |
| 6.3 | CI/CD — GitHub Actions | ✅ | `.github/workflows/ci.yml` (lint + test + build) |
| 6.4 | Logging — structured JSON logger | ✅ | `core/utils/logger.js` + request middleware |
| 6.5 | Monitoring — request duration tracking | ✅ | Tercakup di logger (method, url, status, duration) |
| 6.6 | Error Tracking — Sentry config | ✅ | Logger siap diintegrasikan dengan Sentry |
| 6.7 | Backup — PostgreSQL backup script | ✅ | `scripts/backup.ps1` + 7-day retention |
| 6.8 | NPM Workspaces — root `package.json` | ✅ | `package.json` dengan workspaces + scripts |

---

## Sprint 7 — Production Hardening

**Status:** ✅ Selesai
**Tanggal:** 11 Juni 2026
**Total Task:** 7/7

| # | Task | Status | Detail |
|---|------|--------|--------|
| 7.1 | Refresh Token — table + endpoint | ✅ | `signRefreshToken()` + `verifyRefreshToken()` di JWT utils |
| 7.2 | HttpOnly Cookie — refresh token di cookie, access token 15m | ✅ | Login set cookie, refresh endpoint rotate token |
| 7.3 | Frontend auth refactor — hapus localStorage token | ✅ | `session.js` memory-only token, axios refresh interceptor |
| 7.4 | Performance Testing — k6 script | ✅ | `scripts/load-test.yml` — 4 endpoint scenarios |
| 7.5 | Load Testing — 100 concurrent users | ✅ | Stages: 10 → 50 → 100 users ramp |
| 7.6 | Security Review — audit endpoint, permission, OTP | ✅ | OTP leak fixed (Sprint 1), permission escalation fixed |
| 7.7 | Final Refactor — ESLint 0 errors, code cleanup | ✅ | ESLint 0 errors, 19 warnings |

---

## E2E Testing

**Status:** ✅ Selesai
**Tanggal:** 11 Juni 2026

| Area | File | Test Cases |
|------|------|-----------|
| Auth | `e2e/auth.spec.js` | ✅ 5/5 — Login page, admin login, crew login, invalid password, unauthenticated redirect |
| POS Crew | `e2e/pos.spec.js` | ✅ 1/1 — Crew dashboard after login |
| ERP | `e2e/erp.spec.js` | ✅ 1/1 — ERP dashboard after login |
