/**
 * Approval Workflow Foundation — status flow yang konsisten untuk semua modul.
 *
 * Standard flow:
 *   DRAFT → SUBMITTED → APPROVED → POSTED/PAID/COMPLETED
 *   DRAFT → SUBMITTED → REJECTED
 *   DRAFT → CANCELLED
 *
 * Setiap modul bisa menggunakan fungsi ini untuk standarisasi
 * validasi transisi status.
 */

const VALID_TRANSITIONS = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["POSTED", "PAID", "COMPLETED", "CANCELLED"],
  REJECTED: ["DRAFT"],
  POSTED: ["VOID", "CANCELLED"],
  PAID: ["VOID"],
  COMPLETED: [],
  CANCELLED: [],
  VOID: [],
  REQUESTED: ["APPROVED", "REJECTED", "CANCELLED", "VOID"],
  OTP_ISSUED: ["COMPLETED", "CANCELLED", "EXPIRED"],
  EXPIRED: [],
};

/**
 * Validasi apakah transisi status valid.
 * throw jika tidak valid.
 */
function assertValidTransition(currentStatus, nextStatus, entityName = "Entity") {
  if (currentStatus === nextStatus) return;

  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) {
    throw new Error(`Status ${currentStatus} tidak dikenal`);
  }
  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `${entityName} tidak bisa berubah dari ${currentStatus} ke ${nextStatus}`
    );
  }
}

/**
 * Cek apakah status bisa transisi (tanpa throw).
 */
function canTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

module.exports = {
  VALID_TRANSITIONS,
  assertValidTransition,
  canTransition,
};
