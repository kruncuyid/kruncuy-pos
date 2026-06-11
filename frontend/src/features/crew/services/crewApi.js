import api from "../../../core/api/api";

export const crewApi = {
  getDashboard() {
    return api.get("/crew/dashboard");
  },
  getTodaySales() {
    return api.get("/crew/sales/today");
  },
  getMonthlyPerformance(params = {}) {
    return api.get("/crew/performance/monthly", {
      params,
    });
  },
  getAttendanceGate() {
    return api.get("/crew/attendance/gate");
  },
  getStockOpnameForm(kind = "OPENING") {
    return api.get("/crew/stock-opname/form", {
      params: { kind },
    });
  },
  getOutletStockOverview(params = {}) {
    return api.get("/crew/stock-outlet", {
      params,
    });
  },
  completeStockOpname(payload) {
    return api.post("/crew/stock-opname/complete", payload);
  },
  submitStockOpname(payload) {
    return api.post("/crew/stock-opname/complete", payload);
  },
  checkIn(payload) {
    return api.post("/crew/attendance/check-in", payload);
  },
  checkOut(payload = {}) {
    return api.post("/crew/attendance/check-out", payload);
  },
  submitRetur(payload) {
    return api.post("/crew/retur", payload);
  },
  getMyBranches() {
    return api.get("/crew/my-branches");
  },
};
