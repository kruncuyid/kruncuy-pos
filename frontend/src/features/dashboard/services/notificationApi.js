import api from "../../../core/api/api";

export const notificationApi = {
  getNotifications() {
    return api.get("/notifications");
  },
};
