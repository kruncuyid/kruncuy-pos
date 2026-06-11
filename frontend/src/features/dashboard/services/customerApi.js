import api from "../../../core/api/api";

export const customerApi = {
  list(params = {}) {
    return api.get("/customers", { params });
  },
  getById(id) {
    return api.get(`/customers/${id}`);
  },
  create(payload) {
    return api.post("/customers", payload);
  },
  update(id, payload) {
    return api.put(`/customers/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/customers/${id}`);
  },
};
