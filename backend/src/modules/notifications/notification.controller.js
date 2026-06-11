const notificationService = require("./notification.service");

exports.getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications(req.user, req.branchContext);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
