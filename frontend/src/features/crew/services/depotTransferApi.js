import api from "../../../core/api/api";

export const crewDepotTransferApi = {
  getDepotApprovals(params = {}) {
    return api.get("/crew/depot-approvals", { params });
  },
  approveDepotTransfer(id, payload) {
    return api.post(`/crew/depot-approvals/${id}/approve`, payload);
  },
};
