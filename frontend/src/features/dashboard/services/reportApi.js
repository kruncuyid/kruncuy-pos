import api from "../../../core/api/api";

export const reportApi = {
  getCatalog() {
    return api.get("/reports/catalog");
  },
  getSalesRecap(params = {}) {
    return api.get("/reports/sales-recap", { params });
  },
  getReport(reportKey, params = {}) {
    return api.get(`/reports/${reportKey}`, { params });
  },
};
