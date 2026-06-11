const accessControlService = require("../../core/services/accessControl.service");

exports.getMatrix = async (req, res, next) => {
  try {
    const result = await accessControlService.getAccessMatrix();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.syncCatalog = async (req, res, next) => {
  try {
    const result = await accessControlService.syncDefaultAccessCatalog({
      resetRolePermissions: true,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.updateRolePermissions = async (req, res, next) => {
  try {
    const permissionCodes = Array.isArray(req.body?.permissionCodes) ? req.body.permissionCodes : [];
    const result = await accessControlService.setRolePermissions(req.params.roleCode, permissionCodes);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
