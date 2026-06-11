# Changelog

## Phase P0 — Go-Live Essentials — 11 Juni 2026

**Referensi:** `crew-pos-go-live-master-plan.md` Bagian 12.2

### P0.1 Void Approval Threshold
- **File:** `frontend/src/features/crew/pages/CrewSalesTodayPage.jsx`
- **Change:** Void > Rp 100rb butuh konfirmasi + password manajer. Menambahkan confirmation modal dengan nominal transaksi, alasan void, dan field password manajer untuk void > threshold. Alasan void wajib dipilih.
- **Alasan:** Fraud prevention — void tanpa approval adalah celah kritis

### P0.3 Simplify Cash Terminology
- **File:** `frontend/src/features/crew/pages/CrewCashWithdrawalsPage.jsx`
- **Change:** "Cash awal" + "Penjualan tunai" + "Penarikan" → "Uang Masuk", "Uang Keluar", "Sisa Cash". "Setoran Belum Diambil" → "Penarikan Menunggu". Info box diperbarui: "Uang Kembalian", "Bisa Disetor", "Alur Penarikan".
- **Alasan:** Crew tidak paham istilah akuntansi. Bahasa sehari-hari lebih mudah.

- **File:** `frontend/src/features/crew/pages/CrewHomePage.jsx`
- **Change:** Cash summary: "Uang Masuk", "Uang Keluar", "Sisa Cash". Pending withdrawal: "Penarikan Menunggu". Quick action: "Penarikan Cash". Close shift: "Cash Seharusnya" dengan auto-fill.
- **Alasan:** Konsistensi istilah antar halaman.

### P0.5 Target PCS Dashboard
- **File:** `frontend/src/features/crew/pages/CrewHomePage.jsx`
- **Change:** Menambahkan progress bar target PCS (default 450). Warna hijau ≥ 100%, kuning ≥ 50%, merah < 50%.
- **Alasan:** Crew perlu tahu target harian.

### P0.6 Expected Cash Auto-Display
- **File:** `frontend/src/features/crew/pages/CrewHomePage.jsx`
- **Change:** Close shift modal: auto-fill `closingCash` dengan `sisaCash` (expected cash). Crew hanya perlu konfirmasi atau koreksi.
- **Alasan:** Mengurangi human error input closing cash.

### P0.7 & P0.8 Enforce Stock Opname — DIBATALKAN
- **File:** `frontend/src/features/crew/pages/CrewHomePage.jsx`
- **Change:** Semula blocking buka/tutup shift jika opname belum selesai. Dihapus berdasarkan instruksi: buka tutup shift tidak perlu opname.
- **Alasan:** Operational flexibility — opname tetap direkomendasikan tapi tidak wajib.

### P0.9 OTP Flow Fix
- **File:** `backend/src/modules/cash-withdrawals/cashWithdrawal.service.js`
- **Change:** Hapus `otpCode` dari response `generateOtpForWithdrawal()` (crew endpoint). Crew tidak bisa lihat OTP. `issueCashWithdrawalOtp()` (owner endpoint) tetap return `otpCode` agar owner bisa lihat.
- **File:** `frontend/src/features/crew/pages/CrewCashWithdrawalsPage.jsx`
- **Change:** OTP modal tidak lagi menampilkan kode. Hanya menampilkan "Kode telah dikirim ke manajemen" dengan expiry time.
- **Alasan:** Security — crew tidak boleh lihat OTP yang mereka request sendiri.

### P0.10 Human-Readable Error Messages
- **File:** `frontend/src/core/api/api.js`
- **Change:** Response interceptor: network error → "Gagal terhubung ke server". Technical error messages (TypeError, Cannot read property, dll) → "Gagal memproses permintaan".
- **Alasan:** Crew tidak paham error teknis.

### P0.11 POS Keyboard Scroll Fix
- **File:** `frontend/src/features/crew/pages/CrewPosPage.jsx`
- **Change:** Pay button: `position: sticky; bottom: 0`. Cash input: `onFocus` scroll pay button ke view setelah 300ms.
- **Alasan:** Di HP, keyboard menutup tombol bayar.

---

## Sprint 1 — 11 Juni 2026

### Security Fixes

#### 1.1 OTP Cleartext Leak (Koreksi — lihat Phase P0.9 untuk fix final)
- **File:** `backend/src/modules/cash-withdrawals/cashWithdrawal.service.js`
- **Change:** Hapus `otpCode` dari response `generateOtpForWithdrawal()`. `issueCashWithdrawalOtp()` tetap return `otpCode` untuk owner.
- **File:** `frontend/src/features/crew/pages/CrewCashWithdrawalsPage.jsx`
- **Change:** Modal OTP tidak lagi menampilkan kode OTP. Hanya menampilkan "Kode telah dikirim ke manajemen" dengan expiry time.

#### 1.2 Branch Assignment Permission Escalation
- **File:** `backend/src/modules/branch-assignments/branchAssignment.routes.js`
- **Change:** Route POST dan PATCH sekarang membutuhkan `requirePermission("branch-assignments:write")`, bukan `:read`.

#### 1.3 Invoice Number Collision
- **File:** `backend/src/modules/transactions/transaction.service.js`
- **Change:** Ganti `String(now.getTime()).slice(-6)` dengan `crypto.randomBytes(4).toString("hex").toUpperCase()`. Menambahkan import `crypto`.

#### 1.4 GPS NaN Validation
- **File:** `backend/src/modules/cash-sessions/cashSession.service.js`
- **Change:** Tambah `isNaN()` check sebelum validasi jarak. Mencegah bypass GPS dengan input NaN.

#### 1.5 FRONTEND_URL di .env
- **File:** `backend/.env`
- **Change:** Tambah `FRONTEND_URL=http://localhost:5173`

### Rate Limiting

#### 1.6 OTP Verify Rate Limiter
- **File:** `backend/src/modules/cash-withdrawals/cashWithdrawal.routes.js`
- **Change:** Tambah rate limiter khusus untuk `POST /:id/verify` — max 5 percobaan per 15 menit.

### Data Integrity

#### 1.7 Return Service Branch Isolation
- **File:** `backend/src/modules/returns/return.service.js`
- **Change:** Tambah `buildBranchWhere()` function. `list()` sekarang memfilter berdasarkan branch user.
- **File:** `backend/src/modules/returns/return.controller.js`
- **Change:** Pass `req.user` dan `req.branchContext` ke `svc.list()`.

#### 1.8 CrewOperationalPage API Bypass
- **File:** `backend/src/modules/crew/crew.service.js`
- **Change:** Tambah function `recordReturWaste()` — membuat waste movement dengan transaksi yang aman.
- **File:** `backend/src/modules/crew/crew.controller.js`
- **Change:** Tambah controller `submitRetur`.
- **File:** `backend/src/modules/crew/crew.routes.js`
- **Change:** Tambah route `POST /crew/retur` dengan permission `inventory:write`.
- **File:** `frontend/src/features/crew/services/crewApi.js`
- **Change:** Tambah function `submitRetur()`.
- **File:** `frontend/src/features/crew/pages/CrewOperationalPage.jsx`
- **Change:** Ganti direct `api.post("/inventory/movements", ...)` dengan `crewApi.submitRetur()`.

#### 1.9 Hardcoded Constants
- **File:** `backend/src/modules/payroll/payroll.service.js`
- **Change:** `calculate()` sekarang membaca `payroll_base_salary` dan `crew_bonus_per_pcs` dari system settings. Menambahkan `getSystemSettingValue()` helper.
- **File:** `backend/src/modules/pos/pos.service.js`
- **Change:** `getSummary()` sekarang membaca `pos_target_pcs` dari system settings. Fallback ke 450.

#### 1.10 Seed Duplicate Keys
- **File:** `backend/prisma/seed.js`
- **Change:** Hapus duplikasi properti `lat`/`lng` yang muncul 2-3× dalam object branch yang sama (MANTRIJERON, UMBULHARJO, MINGGIR, DEPOK, KOTAGEDE, NGAGLIK, GEDONGTENGEN, JETIS).

---

## Sprint 2 — 11 Juni 2026

### Scalability — Pagination Framework

#### 2.1 Pagination Utility
- **File:** `backend/src/core/utils/pagination.js` (NEW)
- **Change:** Membuat `parsePagination(query)` dan `paginatedResponse(data, total, page, limit)` untuk standardisasi pagination di semua endpoint.

#### 2.2 Pagination — Transactions
- **File:** `backend/src/modules/transactions/transaction.service.js`
- **Change:** `getTransactions()` sekarang menerima `query` dengan `page`, `limit`, `status`, `startDate`, `endDate`. Menggunakan `skip`/`take` + `count` dalam Promise.all. Response dalam format `{ data, meta }`.
- **File:** `backend/src/modules/transactions/transaction.controller.js`
- **Change:** Pass `req.query` ke service. Response langsung dari service.

#### 2.2 Pagination — Cash Withdrawals
- **File:** `backend/src/modules/cash-withdrawals/cashWithdrawal.service.js`
- **Change:** `listCashWithdrawals()` tambah pagination dengan `parsePagination()`. Menambahkan `meta` ke response.

#### 2.2 Pagination — Inventory Items
- **File:** `backend/src/modules/inventory/inventory.service.js`
- **Change:** `listInventoryItems()` tambah pagination + filter (`type`, `isActive`, `search`). Menggunakan `select` untuk optimasi.
- **File:** `backend/src/modules/inventory/inventory.controller.js`
- **Change:** Pass `req.query` ke service.

#### 2.2 Pagination — Users
- **File:** `backend/src/modules/users/user.service.js`
- **Change:** `getUsers()` tambah pagination + filter (`role`, `isActive`, `search`). Menggunakan `select` untuk optimasi.
- **File:** `backend/src/modules/users/user.controller.js`
- **Change:** Pass `req.query` ke service.

#### 2.2 Pagination — Products
- **File:** `backend/src/modules/products/product.service.js`
- **Change:** `getProducts()` tambah pagination + filter (`categoryId`, `isActive`, `search`). Menggunakan `select` untuk optimasi.
- **File:** `backend/src/modules/products/product.controller.js`
- **Change:** Pass `req.query` ke service.

#### 2.4 Database Indexing
- **File:** `backend/prisma/schema.prisma`
- **Change:** Tambah `@@index([branchId, type, createdAt])` di model `InventoryMovement` untuk optimasi filter movement by branch + type.

#### 2.7 Audit Trail Enhancement
- **File:** `backend/src/core/services/auditLog.service.js`
- **Change:** Tambah `searchAuditLogs()` dengan pagination + filter (branchId, action, entity, performedById, date range, search text).
- **File:** `backend/src/modules/audit-logs/auditLog.service.js`
- **Change:** Tambah `searchAuditLogs()` yang memperkaya query dengan branchContext.
- **File:** `backend/src/modules/audit-logs/auditLog.controller.js`
- **Change:** Jika ada `?page=`, gunakan search dengan pagination. Backward compatible.

#### 2.8 Approval Workflow Foundation
- **File:** `backend/src/core/utils/approval.js` (NEW)
- **Change:** Membuat utility `assertValidTransition()` dan `canTransition()` untuk standarisasi status flow di semua modul. Mendukung flow: DRAFT → SUBMITTED → APPROVED → POSTED/PAID, dengan REJECTED, CANCELLED, VOID sebagai terminal states.
