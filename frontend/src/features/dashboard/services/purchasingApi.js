import api from "../../../core/api/api";

export const purchasingApi = {
  listOutletExpenses(params = {}) {
    return api.get("/purchasing/outlet-expenses", { params });
  },
  getOutletExpensesSummary() {
    return api.get("/purchasing/outlet-expenses/summary");
  },
  getOutletExpense(id) {
    return api.get(`/purchasing/outlet-expenses/${id}`);
  },
  createOutletExpense(payload) {
    return api.post("/purchasing/outlet-expenses", payload);
  },
  approveOutletExpense(id, payload) {
    return api.post(`/purchasing/outlet-expenses/${id}/approve`, payload);
  },
  voidOutletExpense(id, payload) {
    return api.post(`/purchasing/outlet-expenses/${id}/void`, payload);
  },
};
