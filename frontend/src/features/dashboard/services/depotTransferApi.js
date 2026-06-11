import api from "../../../core/api/api";

export const depotTransferApi = {
  getDepotTransfers(params = {}) {
    return api.get("/depot-transfers", { params });
  },
  getDepotTransferSummary() {
    return api.get("/depot-transfers/summary");
  },
  getDepotTransfer(id) {
    return api.get(`/depot-transfers/${id}`);
  },
  createDepotTransfer(payload) {
    return api.post("/depot-transfers", payload);
  },
  approveDepotTransfer(id, payload) {
    return api.post(`/depot-transfers/${id}/approve`, payload);
  },
  voidDepotTransfer(id, payload) {
    return api.post(`/depot-transfers/${id}/void`, payload);
  },
};
