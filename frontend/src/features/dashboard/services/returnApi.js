import api from "../../../core/api/api";
export const returnApi = {
  list(params = {}) { return api.get("/returns", { params }); },
  getById(id) { return api.get(`/returns/${id}`); },
  create(payload) { return api.post("/returns", payload); },
  approve(id, payload = {}) { return api.post(`/returns/${id}/approve`, payload); },
};
