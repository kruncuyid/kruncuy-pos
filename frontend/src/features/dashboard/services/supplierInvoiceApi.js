import api from "../../../core/api/api";

export const supplierInvoiceApi = {
  list(params = {}) {
    return api.get("/supplier-invoices", { params });
  },
  getById(id) {
    return api.get(`/supplier-invoices/${id}`);
  },
  create(payload) {
    return api.post("/supplier-invoices", payload);
  },
  update(id, payload) {
    return api.put(`/supplier-invoices/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/supplier-invoices/${id}`);
  },
  listPayments(id, params = {}) {
    return api.get(`/supplier-invoices/${id}/payments`, { params });
  },
  createPayment(id, payload) {
    return api.post(`/supplier-invoices/${id}/payments`, payload);
  },
};
