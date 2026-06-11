import api from "../../../core/api/api";

export const posApi = {
  getCatalog(params) {
    return api.get("/pos/catalog", { params });
  },
  checkout(payload) {
    return api.post("/pos/checkout", payload);
  },
};
