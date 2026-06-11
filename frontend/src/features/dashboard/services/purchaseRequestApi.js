import api from "../../../core/api/api";
export const purchaseRequestApi = {
  list(params = {}) { return api.get("/purchase-requests", { params }); },
  getById(id) { return api.get(`/purchase-requests/${id}`); },
  create(payload) { return api.post("/purchase-requests", payload); },
  submit(id) { return api.post(`/purchase-requests/${id}/submit`); },
  approve(id, payload = {}) { return api.post(`/purchase-requests/${id}/approve`, payload); },
  reject(id, payload = {}) { return api.post(`/purchase-requests/${id}/reject`, payload); },
};
