# Phase Report — P0: Go-Live Essentials

> **Tanggal:** 11 Juni 2026
> **Referensi:** `crew-pos-go-live-master-plan.md` — Bagian 12.2
> **Status:** ✅ SELESAI

---

## Completed

| # | Item | Status | Catatan |
|---|------|--------|---------|
| P0.1 | Void approval threshold | ✅ | Void > Rp 100rb butuh password manajer + konfirmasi nominal |
| P0.2 | Void reason mandatory | ✅ | Reason pilihan + confirmation modal |
| P0.3 | Simplify cash terminology | ✅ | "Uang Masuk/Keluar/Sisa" + tooltip |
| P0.4 | Replace "Setoran Belum Diambil" | ✅ | → "Penarikan Menunggu" |
| P0.5 | Target PCS dashboard | ✅ | Progress bar 450 PCS dengan warna status |
| P0.6 | Expected cash auto | ✅ | Close shift auto-fill dengan sisa cash |
| P0.7 | Enforce stock opname opening | ✅ | Blokir buka shift jika opname belum selesai |
| P0.8 | Enforce stock opname closing | ✅ | Blokir tutup shift jika opname closing belum selesai |
| P0.9 | OTP flow fix | ✅ | Crew tidak lihat OTP. Owner tetap bisa lihat. |
| P0.10 | Human-readable errors | ✅ | API interceptor dengan fallback messages |
| P0.11 | Keyboard scroll fix | ✅ | Sticky bottom bar + auto-scroll on focus |

---

## Files Changed

### Backend
| File | Change |
|------|--------|
| `backend/src/modules/cash-withdrawals/cashWithdrawal.service.js` | Hapus `otpCode` dari `generateOtpForWithdrawal()`. `issueCashWithdrawalOtp()` tetap return. |

### Frontend — Crew Pages
| File | Change |
|------|--------|
| `frontend/src/features/crew/pages/CrewSalesTodayPage.jsx` | Void confirmation modal + manager password + threshold check |
| `frontend/src/features/crew/pages/CrewCashWithdrawalsPage.jsx` | Simplified labels, OTP modal tanpa code, info box baru |
| `frontend/src/features/crew/pages/CrewHomePage.jsx` | Target PCS bar, expected cash auto-fill, stock opname enforce, istilah baru |
| `frontend/src/features/crew/pages/CrewPosPage.jsx` | Sticky pay button, auto-scroll on input focus |

### Frontend — Core
| File | Change |
|------|--------|
| `frontend/src/core/api/api.js` | Human-readable error interceptor |

---

## Build Status

| Check | Status |
|-------|--------|
| **Frontend build** | ✅ Pass (0 errors, warnings only) |
| **Backend lint** | ✅ Pass (0 errors, 20 pre-existing warnings) |
| **Backend test** | ✅ Pass (22/22) |

---

## Remaining Tasks

### P1 (belum dimulai)
| # | Item | Effort |
|---|------|--------|
| P1.1 | Approval Center | 2 hari |
| P1.2 | Auto-approve expense ≤ Rp 50rb | 1 hari |
| P1.3 | 3 tab CrewOperationalPage (Terima, Catat, Belanja) | 1 hari |
| P1.4 | OutletEventLog / CleaningLog | 2 hari |
| P1.5 | Duplicate transaction detection | 1 hari |
| P1.6 | Stock alert di crew dashboard | 1 hari |
| P1.7 | Waste kategori | 1 hari |
| P1.8 | Restrukturisasi ERP sidebar (40→26) | 1 hari |
| P1.9 | Crew nav fix (icon + Penjualan Hari Ini) | 0.5 hari |
| P1.10 | Offline-first POS | 3 hari |

### Catatan
- P1.5 (duplicate detection) membutuhkan endpoint backend baru
- P1.10 (offline POS) adalah item terbesar — perlu indexedDB + queue system
- Semua P1 bisa diparalelkan kecuali P1.10 yang independen

---

*Phase Report — P0 selesai. Menunggu instruksi untuk lanjut P1.*
