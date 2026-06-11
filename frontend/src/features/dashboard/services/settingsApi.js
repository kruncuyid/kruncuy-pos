import api from "../../../core/api/api";

export const settingsApi = {
  getOverview() {
    return api.get("/settings");
  },
  upsertSystemSetting(key, payload) {
    return api.put(`/settings/system/${encodeURIComponent(key)}`, payload);
  },
};
