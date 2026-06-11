import api from "../../../core/api/api";

export const erpOverviewApi = {
  getUsers() {
    return api.get("/users");
  },

  getAttendance(params = {}) {
    return api.get("/erp/attendance", { params });
  },

  getPerformance(params = {}) {
    return api.get("/erp/performance", { params });
  },

  getCashSessions(params = {}) {
    return api.get("/erp/cash-sessions", { params });
  },
  getCrossBranch() {
    return api.get("/erp/cross-branch");
  },
};
