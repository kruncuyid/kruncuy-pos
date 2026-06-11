# BACKLOG — KRUNCUY POS ERP

> **Sumber:** `report.md` (Audit 11 Juni 2026) + `execution-plan.md`
> **Scope:** Multi-Outlet Company-Owned (1–100 outlet)
> **Franchise:** EXCLUDED — semua item franchise tidak dikerjakan

---

## Sprint 1 — Critical Security

**Goal:** Menutup seluruh critical security issue dan data integrity bug.

**Estimasi:** 3–5 hari

| # | Task | Priority | Effort | Risk | Business Impact |
|---|------|----------|--------|------|-----------------|
| 1.1 | Fix OTP cleartext leak — hapus `otpCode` dari response API | 🔴 Critical | Rendah (1 jam) | CRITICAL | OTP sebagai second factor tidak berguna. Crew bisa withdrawal tanpa approval owner. |
| 1.2 | Fix Branch Assignment permission — POST/PATCH harus `:write` | 🔴 Critical | Rendah (30 menit) | CRITICAL | Siapa pun dengan akses read bisa create/delete branch assignment. Privilege escalation. |
| 1.3 | Fix Invoice Number collision — ganti ke `crypto.randomBytes()` | 🔴 Critical | Rendah (1 jam) | HIGH | Unique constraint violation di production. Transaksi gagal di peak hour. |
| 1.4 | Fix GPS NaN validation — tambah `isNaN()` check | 🟡 High | Rendah (15 menit) | HIGH | Crew bisa open shift dari mana saja dengan mengirim NaN. Control lemah. |
| 1.5 | Fix `FRONTEND_URL` di `.env` production | 🟡 High | Rendah (1 menit) | HIGH | CORS error di production. Frontend tidak bisa akses API. |
| 1.6 | Fix OTP verify rate limiter — max 5 percobaan/15 menit | 🟡 High | Rendah (1 jam) | MEDIUM | Brute-force 6-digit OTP tanpa proteksi. |
| 1.7 | Fix Return Service branch isolation — tambah `buildBranchWhere()` | 🟡 High | Rendah (30 menit) | MEDIUM | Information disclosure — semua return dari semua branch terlihat. |
| 1.8 | Fix CrewOperationalPage API bypass — buat service layer | 🟡 High | Sedang (2 jam) | HIGH | Bypass semua validasi dan audit log. Frontend langsung nulis ke DB. |
| 1.9 | Fix hardcoded constants — baca dari `SystemSetting` | 🟡 High | Sedang (1 hari) | MEDIUM | Bonus payroll tidak bisa dikonfigurasi. Perubahan harus deploy ulang. |
| 1.10 | Fix seed duplicate keys — hapus copy-paste duplikasi | 🟢 Medium | Rendah (10 menit) | LOW | Seed data tidak akurat, tapi tidak berdampak production. |

**Dependencies:**
- 1.9 (hardcoded constants) mungkin membutuhkan migration jika `SystemSetting` belum memiliki key yang diperlukan
- 1.8 mungkin membutuhkan endpoint baru di backend

**Deliverables:**
- Source code changes (10 file patches)
- Migration Prisma (jika ada perubahan schema)
- Test untuk setiap fix
- `changelog.md` update
- `progress.md` update

---

## Sprint 2 — Scalability Foundation

**Goal:** Membuat sistem siap menangani pertumbuhan data hingga 100 outlet.

**Estimasi:** 1–2 minggu

| # | Task | Priority | Effort | Risk | Business Impact |
|---|------|----------|--------|------|-----------------|
| 2.1 | Pagination framework — helper `paginatedResponse()` + middleware | 🔴 Critical | Sedang (2 hari) | HIGH | Semua endpoint tanpa pagination akan crash di 50+ outlet. |
| 2.2 | Implementasi pagination di semua endpoint kritis (transactions, cash-withdrawals, inventory, users, products, reports, purchases, dll) | 🔴 Critical | Tinggi (5 hari) | HIGH | Death spiral — makin banyak data, makin lambat, makin sering timeout. |
| 2.3 | Standard pagination response format — `{ data, meta: { page, limit, total, totalPages } }` | 🟡 High | Rendah (1 hari) | MEDIUM | Frontend perlu parsing pagination info. |
| 2.4 | Database indexing — tambah index untuk query umum (Transaction branchId+status+createdAt, InventoryMovement branchId+type+createdAt, dll) | 🟡 High | Sedang (1 hari) | MEDIUM | Query tanpa index akan full-table scan. Performa turun drastis di scale. |
| 2.5 | Query optimization — batasi `include`, gunakan `select`, tambah `take` default | 🟡 High | Sedang (3 hari) | MEDIUM | Include chain berlebihan menyebabkan N+1 queries dan memory overload. |
| 2.6 | Include chain reduction — audit semua `findMany` dengan `include`, refactor ke `select` | 🟡 High | Sedang (2 hari) | MEDIUM | Sama seperti 2.5 — perlu audit manual. |
| 2.7 | Audit Trail enhancement — tambah index, filter, dan pagination di audit log | 🟢 Medium | Rendah (1 hari) | RENDAH | Audit log lambat di scale — tidak urgent tapi perlu. |
| 2.8 | Approval Workflow foundation — status flow yang konsisten untuk semua modul (REQUESTED → APPROVED → POSTED) | 🟢 Medium | Tinggi (5 hari) | SEDANG | OutletExpense, PurchaseRequest, PurchaseOrder punya approval flow berbeda-beda. Perlu standarisasi. |

**Dependencies:**
- 2.1 (pagination helper) harus selesai sebelum 2.2
- 2.5 (query optimization) bisa paralel dengan 2.6
- 2.4 (indexing) perlu migration Prisma

**Deliverables:**
- `core/utils/pagination.js` — helper functions
- Update semua controller — response pagination
- Migration Prisma — database indexes
- Update semua service — query optimization
- Update frontend services — baca `meta` response
- `changelog.md` update

---

## Sprint 3 — ERP Core Completion

**Goal:** Menutup gap ERP yang masih kosong di domain master data dan purchasing.

**Estimasi:** 3–4 minggu

| # | Task | Priority | Effort | Risk | Business Impact |
|---|------|----------|--------|------|-----------------|
| 3.1 | Customer module — model `Customer` di Prisma + migration | 🔴 Critical | Sedang (2 hari) | SEDANG | Tidak bisa追踪 siapa pembeli. Tidak ada data untuk CRM/loyalty. |
| 3.2 | Customer API — CRUD endpoints + search by name/phone | 🟡 High | Sedang (2 hari) | RENDAH | Butuh endpoint untuk integrasi POS. |
| 3.3 | Customer history — transaksi per customer | 🟡 High | Sedang (2 hari) | RENDAH | Tidak bisa lihat riwayat belanja customer. |
| 3.4 | Customer search — search + filter di frontend | 🟡 High | Sedang (2 hari) | RENDAH | UX — kasir perlu cari customer cepat. |
| 3.5 | Supplier Invoice — model + API + frontend | 🟡 High | Sedang (3 hari) | SEDANG | Tidak bisa追踪 utang ke supplier. Procurement cycle tidak lengkap. |
| 3.6 | Supplier Payment — model + API + frontend | 🟡 High | Sedang (3 hari) | SEDANG | Pembayaran ke supplier tidak tercatat. |
| 3.7 | Accounts Payable Basic — aging report + outstanding per supplier | 🟡 High | Sedang (2 hari) | SEDANG | Tidak ada visibilitas utang jatuh tempo. |
| 3.8 | Cash Reconciliation Report — rekonsiliasi opening → closing cash per shift | 🟡 High | Sedang (3 hari) | SEDANG | Selisih cash tidak terdeteksi otomatis. |
| 3.9 | Placeholder ERP pages — implementasi halaman yang masih kosong | 🟢 Medium | Tinggi (2 minggu) | RENDAH | 21 halaman masih placeholder. User bingung. |

**Dependencies:**
- 3.1 (Customer model) → 3.2, 3.3, 3.4
- 3.5 (Supplier Invoice) → 3.6, 3.7
- 3.8 bisa dikerjakan paralel
- 3.9 bisa dikerjakan paralel

**Deliverables:**
- Migration Prisma — Customer, SupplierInvoice, SupplierPayment
- Backend — controllers + services
- Frontend — pages + services
- Report generator — Cash Reconciliation
- `changelog.md` update

---

## Sprint 4 — Management & Monitoring

**Goal:** Meningkatkan kontrol operasional untuk management multi-outlet.

**Estimasi:** 2–3 minggu

| # | Task | Priority | Effort | Risk | Business Impact |
|---|------|----------|--------|------|-----------------|
| 4.1 | Cross Branch Dashboard — endpoint + frontend dengan perbandingan semua branch | 🟡 High | Tinggi (5 hari) | SEDANG | Management butuh lihat performa semua outlet dalam satu layar. |
| 4.2 | Notification Center — sistem notifikasi in-app untuk event penting | 🟡 High | Tinggi (5 hari) | SEDANG | Crew/management tidak dapat notifikasi untuk approval, anomaly, dll. |
| 4.3 | Audit Dashboard — visualisasi audit log dengan filter | 🟢 Medium | Sedang (3 hari) | RENDAH | Audit log mentah sulit dibaca tanpa visualisasi. |
| 4.4 | Stock Alert — notifikasi jika stok di bawah minimum | 🟡 High | Sedang (3 hari) | SEDANG | Outlet bisa kehabisan stok tanpa sadar. |
| 4.5 | Cash Alert — deteksi anomaly cash variance | 🟢 Medium | Sedang (2 hari) | RENDAH | Selisih cash besar tidak terdeteksi real-time. |

**Dependencies:**
- 4.1 butuh pagination (Sprint 2) sudah selesai
- 4.2 butuh endpoint notifikasi — bisa table baru atau extend existing
- 4.4, 4.5 butuh background job atau cron

**Deliverables:**
- Backend — report generators + notification service
- Frontend — dashboard pages
- Migration Prisma — Notification model (jika perlu)
- `changelog.md` update

---

## Sprint 5 — Engineering Excellence

**Goal:** Meningkatkan kualitas engineering, standarisasi kode, dan test coverage.

**Estimasi:** 3–4 minggu

| # | Task | Priority | Effort | Risk | Business Impact |
|---|------|----------|--------|------|-----------------|
| 5.1 | ESLint backend — install, config, auto-fix | 🟡 High | Rendah (1 hari) | RENDAH | Kode backend tanpa standar. 12K LOC tanpa linting. |
| 5.2 | Prettier — format standar untuk backend + frontend | 🟢 Medium | Rendah (1 hari) | RENDAH | Inkonsistensi formatting memperlambat code review. |
| 5.3 | Integration test setup — test database + helper + CI integration | 🔴 Critical | Sedang (3 hari) | TINGGI | 4 test untuk 30K LOC = 0.3% coverage. Satu refactor bisa rusak sistem tanpa sadar. |
| 5.4 | Auth integration test — login, token, permission, branch context | 🟡 High | Sedang (3 hari) | SEDANG | Auth adalah fondasi keamanan — harus teruji. |
| 5.5 | POS Transaction integration test — checkout, void, split payment | 🟡 High | Sedang (3 hari) | SEDANG | POS adalah core bisnis — error di sini = kehilangan uang. |
| 5.6 | Inventory integration test — stock in/out, transfer, adjustment | 🟡 High | Sedang (2 hari) | SEDANG | Inventory movement errors → stock tidak akurat. |
| 5.7 | Payroll integration test — calculate, approve, pay | 🟢 Medium | Sedang (2 hari) | RENDAH | Payroll salah hitung → komplen crew. |
| 5.8 | Cash Withdrawal OTP integration test — request, generate, verify, brute-force | 🟡 High | Sedang (2 hari) | SEDANG | OTP flow kritis untuk cash control. |

**Dependencies:**
- 5.1 (ESLint) dan 5.2 (Prettier) bisa paralel
- 5.3 (test setup) harus selesai sebelum 5.4–5.8
- 5.4–5.8 bisa paralel setelah test setup selesai

**Deliverables:**
- `.eslintrc.json` / eslint.config.js — backend
- `.prettierrc`
- `tests/helpers/` — test setup + fixtures
- Test files — minimal 20 integration tests
- `changelog.md` update

---

## Sprint 6 — Infrastructure

**Goal:** Production-ready infrastructure — containerization, CI/CD, monitoring.

**Estimasi:** 2–3 minggu

| # | Task | Priority | Effort | Risk | Business Impact |
|---|------|----------|--------|------|-----------------|
| 6.1 | Docker — `Dockerfile.api` + `Dockerfile.web` | 🟡 High | Sedang (2 hari) | SEDANG | Tidak ada konsistensi environment. Deploy manual rawan error. |
| 6.2 | Docker Compose — PostgreSQL + API + Web | 🟡 High | Sedang (2 hari) | SEDANG | Developer onboarding lambat tanpa environment siap pakai. |
| 6.3 | CI/CD Pipeline — GitHub Actions (lint → test → build → deploy) | 🟡 High | Sedang (3 hari) | SEDANG | Tidak ada automation — setiap deploy manual. Risiko human error tinggi. |
| 6.4 | Logging — structured logging (Winston/Pino) + file rotation | 🟢 Medium | Sedang (2 hari) | RENDAH | Debugging production tanpa log structured sangat sulit. |
| 6.5 | Monitoring — response time, error rate, active users | 🟢 Medium | Sedang (2 hari) | RENDAH | Tidak ada visibility kesehatan sistem. |
| 6.6 | Error Tracking — Sentry integration (backend + frontend) | 🟡 High | Sedang (2 hari) | SEDANG | Error production tidak terdeteksi sampai user komplen. |
| 6.7 | Backup Strategy — script PostgreSQL backup + retention policy | 🟡 High | Sedang (1 hari) | TINGGI | TANPA BACKUP = DATA LOSS RISK. Satu kebakaran server = bisnis berhenti. |
| 6.8 | NPM Workspaces — root `package.json`, workspace config | 🟢 Medium | Rendah (1 hari) | RENDAH | Monorepo manual tidak efisien. Install deps di 2 folder terpisah. |

**Dependencies:**
- 6.1 (Docker) → 6.2 (Compose)
- 6.3 bisa paralel dengan 6.1, 6.2
- 6.4, 6.5, 6.6 bisa paralel
- 6.7 mandiri

**Deliverables:**
- `Dockerfile.api`, `Dockerfile.web`
- `docker-compose.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml` (optional)
- Winston/Pino integration
- Sentry integration
- Backup script
- `changelog.md` update

---

## Sprint 7 — Production Hardening

**Goal:** Enterprise-grade stability, security, dan performance.

**Estimasi:** 3–4 minggu

| # | Task | Priority | Effort | Risk | Business Impact |
|---|------|----------|--------|------|-----------------|
| 7.1 | Refresh Token — table + endpoint + frontend interceptor | 🔴 Critical | Tinggi (5 hari) | TINGGI | JWT di localStorage = XSS → full account access. Harus pindah ke httpOnly cookie. |
| 7.2 | HttpOnly Cookie — access token di memory, refresh token di cookie | 🔴 Critical | Tinggi (5 hari) | TINGGI | Sama seperti 7.1 — dua task ini harus dikerjakan bersama. |
| 7.3 | Frontend auth refactor — hapus localStorage pattern, pindah ke memory + cookie | 🔴 Critical | Sedang (3 hari) | TINGGI | Semua frontend service menggunakan token dari localStorage. Perlu refactor. |
| 7.4 | Performance Testing — k6/autocannon load test untuk endpoint kritis | 🟡 High | Sedang (3 hari) | SEDANG | Tidak ada benchmark — tidak tahu kapan sistem akan collapse. |
| 7.5 | Load Testing — 100 concurrent users, POS checkout scenario | 🟡 High | Sedang (3 hari) | SEDANG | Harus bukti sistem handle peak load. |
| 7.6 | Security Review — audit semua endpoint, permission, OTP, auth flow | 🔴 Critical | Sedang (2 hari) | TINGGI | Sprint 1 fix perlu diverifikasi. Pastikan tidak ada regresi. |
| 7.7 | Final Refactor — code cleanup, hapus dead code, standarisasi pattern | 🟢 Medium | Sedang (3 hari) | RENDAH | Technical debt — tidak urgent tapi perlu untuk maintainability. |

**Dependencies:**
- 7.1 + 7.2 + 7.3 harus dikerjakan berurutan
- 7.4 + 7.5 bisa paralel
- 7.6 harus setelah semua sprint selesai
- 7.7 bisa kapan saja

**Deliverables:**
- Refresh token table + migration
- Auth service refactor
- Frontend auth refactor
- Performance test scripts
- Security review report
- `changelog.md` update

---

## Summary Timeline

| Sprint | Goal | Estimasi | Dependencies |
|--------|------|----------|--------------|
| **Sprint 1** | Critical Security | 3–5 hari | — |
| **Sprint 2** | Scalability Foundation | 1–2 minggu | Sprint 1 |
| **Sprint 3** | ERP Core Completion | 3–4 minggu | Sprint 2 (pagination) |
| **Sprint 4** | Management & Monitoring | 2–3 minggu | Sprint 2 |
| **Sprint 5** | Engineering Excellence | 3–4 minggu | Sprint 1 (parallel) |
| **Sprint 6** | Infrastructure | 2–3 minggu | Parallel |
| **Sprint 7** | Production Hardening | 3–4 minggu | Sprint 1–6 |

**Total estimasi: 4–6 bulan** (dengan paralelisasi Sprint 5 & 6)

---

## Rules

1. Kerjakan sprint berurutan — jangan lompat
2. Setiap sprint selesai → update `progress.md` + `changelog.md` + jalankan test
3. Jika ada keputusan bisnis → tanya user
4. Tidak ada fitur franchise (lihat excluded scope di `execution-plan.md`)
5. Semua perubahan harus tercatat di `changelog.md`
6. Jika ada konflik source code vs `report.md` → tanya user
