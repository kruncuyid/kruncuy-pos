const auditLogService = require("./auditLog.service");

exports.getRecentAuditLogs = async (req, res, next) => {
  try {
    const { page } = req.query;
    if (page) {
      const result = await auditLogService.searchAuditLogs(req.user, req.branchContext, req.query);
      return res.json(result);
    }

    const limit = Math.max(1, Math.min(Number(req.query.limit || 50), 200));
    const result = await auditLogService.getRecentAuditLogs(req.user, req.branchContext, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
