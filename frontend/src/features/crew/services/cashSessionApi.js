import api from "../../../core/api/api";

export const cashSessionApi = {
  getActiveSession() {
    return api.get("/cash-sessions/active");
  },
  openSession(payload) {
    return api.post("/cash-sessions/open", payload);
  },
  closeSession(payload) {
    return api.post("/cash-sessions/close", payload);
  },
};
