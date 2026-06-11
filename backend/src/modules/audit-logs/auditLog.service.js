const { listRecentAuditLogs, searchAuditLogs, createAuditLog } = require("../../core/services/auditLog.service");

exports.getRecentAuditLogs = async (user, branchContext, limit = 50) => {
  const branchId = branchContext?.branchId || null;
  return listRecentAuditLogs({
    branchId,
    limit,
  });
};

exports.searchAuditLogs = async (user, branchContext, query = {}) => {
  const enriched = {
    ...query,
    ...(branchContext?.branchId && !query.branchId ? { branchId: branchContext.branchId } : {}),
  };
  return searchAuditLogs(enriched);
};

exports.logAction = createAuditLog;
