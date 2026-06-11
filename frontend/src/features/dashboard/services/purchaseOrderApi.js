import api from "../../../core/api/api";
export const purchaseOrderApi = {
  list(params = {}) { return api.get("/purchase-orders", { params }); },
  getById(id) { return api.get(`/purchase-orders/${id}`); },
  create(payload) { return api.post("/purchase-orders", payload); },
  submit(id) { return api.post(`/purchase-orders/${id}/submit`); },
  approve(id, payload = {}) { return api.post(`/purchase-orders/${id}/approve`, payload); },
  cancel(id, payload = {}) { return api.post(`/purchase-orders/${id}/cancel`, payload); },
};
