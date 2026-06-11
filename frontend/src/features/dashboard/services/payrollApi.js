import api from "../../../core/api/api";
export const payrollApi = {
  list(params = {}) { return api.get("/payroll", { params }); },
  getById(id) { return api.get(`/payroll/${id}`); },
  calculate(params = {}) { return api.get("/payroll/calculate", { params }); },
  create(payload) { return api.post("/payroll", payload); },
  approve(id) { return api.post(`/payroll/${id}/approve`); },
  pay(id) { return api.post(`/payroll/${id}/pay`); },
  remove(id) { return api.delete(`/payroll/${id}`); },
};
