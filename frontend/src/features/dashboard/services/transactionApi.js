import api from "../../../core/api/api";

export const transactionApi = {
  getTransactions() {
    return api.get("/transactions");
  },
  voidTransaction(id, payload) {
    return api.post(`/transactions/${encodeURIComponent(id)}/void`, payload);
  },
};
