import api from "../../../core/api/api";

export const branchAssignmentApi = {
  getAssignments(params = {}) {
    return api.get("/branch-assignments", { params });
  },
  createAssignment(payload) {
    return api.post("/branch-assignments", payload);
  },
  deactivateAssignment(id) {
    return api.patch(`/branch-assignments/${id}/deactivate`);
  },
};
