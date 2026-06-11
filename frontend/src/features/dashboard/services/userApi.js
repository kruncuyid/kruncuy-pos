import api from "../../../core/api/api";

export const userApi = {
  getUsers() {
    return api.get("/users");
  },
  createUser(payload) {
    return api.post("/users", payload);
  },
  updateUser(id, payload) {
    return api.put(`/users/${id}`, payload);
  },
  deleteUser(id) {
    return api.delete(`/users/${id}`);
  },
};
