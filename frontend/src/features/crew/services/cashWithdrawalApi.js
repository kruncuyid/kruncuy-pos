import api from "../../../core/api/api";

export const cashWithdrawalApi = {
  getDashboard(params = {}) {
    return api.get("/cash-withdrawals/dashboard", { params });
  },
  getMine() {
    return api.get("/cash-withdrawals/mine");
  },
  getPendingOtp() {
    return api.get("/cash-withdrawals/pending-otp");
  },
  getBranchCashInfo(branchId) {
    return api.get(`/cash-withdrawals/branch-cash/${branchId}`);
  },
  list(params = {}) {
    return api.get("/cash-withdrawals", { params });
  },
  createFromErp(payload) {
    return api.post("/cash-withdrawals/create", payload);
  },
  request(payload) {
    return api.post("/cash-withdrawals/request", payload);
  },
  issueOtp(id) {
    return api.post(`/cash-withdrawals/${id}/issue-otp`);
  },
  generateOtp(id) {
    return api.post(`/cash-withdrawals/${id}/generate-otp`);
  },
  verify(id, payload) {
    return api.post(`/cash-withdrawals/${id}/verify`, payload);
  },
  cancel(id, payload = {}) {
    return api.post(`/cash-withdrawals/${id}/cancel`, payload);
  },
};
