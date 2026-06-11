import api from "../../../core/api/api";

export const erpApi = {
  getDashboard(params = {}) {
    return api.get("/reports/erp/dashboard", { params });
  },
};
