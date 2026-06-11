import api from "../../../core/api/api";
export const goodsReceiptApi = {
  list(params = {}) { return api.get("/goods-receipts", { params }); },
  getById(id) { return api.get(`/goods-receipts/${id}`); },
  create(payload) { return api.post("/goods-receipts", payload); },
};
