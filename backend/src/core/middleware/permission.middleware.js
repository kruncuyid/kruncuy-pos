const accessControlService = require("../services/accessControl.service");

exports.getPermissionsByRole = async (role) => {
  return accessControlService.getPermissionsByRole(role);
};

exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Anda belum login",
      });
    }

    const roleCode = accessControlService.resolveRoleCode(req.user.role) || req.user.role;
    if (!allowedRoles.includes(roleCode)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    next();
  };
};

exports.requirePermission = (...allowedPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Anda belum login",
        });
      }

      const permissions = await accessControlService.getPermissionsByRole(req.user.role);
      const hasPermission = allowedPermissions.some((permission) =>
        permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

exports.canAccessAllBranches = async (role) => {
  return accessControlService.canAccessAllBranches(role);
};
