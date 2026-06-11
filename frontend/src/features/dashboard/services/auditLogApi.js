import api from "../../../core/api/api";

export const auditLogApi = {
  getAuditLogs(params = {}) {
    return api.get("/audit-logs", { params });
  },
};
