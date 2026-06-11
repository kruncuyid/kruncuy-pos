import api from "../../../core/api/api";

export const supplierApi = {
  list(params = {}) {
    return api.get("/suppliers", { params });
  },
  getById(id) {
    return api.get(`/suppliers/${id}`);
  },
  create(payload) {
    return api.post("/suppliers", payload);
  },
  update(id, payload) {
    return api.put(`/suppliers/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/suppliers/${id}`);
  },
};
