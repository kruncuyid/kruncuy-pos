import api from "../../../core/api/api";

export const accessControlApi = {
  getMatrix() {
    return api.get("/access-control/matrix");
  },

  syncCatalog() {
    return api.post("/access-control/sync-catalog");
  },

  updateRolePermissions(roleCode, permissionCodes) {
    return api.put(`/access-control/roles/${roleCode}/permissions`, {
      permissionCodes,
    });
  },
};
