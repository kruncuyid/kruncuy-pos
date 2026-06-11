import api from "../../../core/api/api";

export const authApi = {
  login(payload) {
    return api.post("/auth/login", payload);
  },
  me() {
    return api.get("/auth/me");
  },
};
