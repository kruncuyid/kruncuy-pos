import api from "../../../core/api/api";

export const branchApi = {
  getBranches() {
    return api.get("/branches");
  },
  getBranchById(id) {
    return api.get(`/branches/${id}`);
  },
  createBranch(payload) {
    return api.post("/branches", payload);
  },
  updateBranch(id, payload) {
    return api.put(`/branches/${id}`, payload);
  },
  deleteBranch(id) {
    return api.delete(`/branches/${id}`);
  },
};
