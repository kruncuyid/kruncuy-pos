const { getEffectiveBranchForUser } = require("../services/branchAccess.service");

function getRequestedBranchId(req) {
  return req.params.branchId || req.query.branchId || req.headers["x-branch-id"] || null;
}

exports.resolveBranchContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const requestedBranchId = getRequestedBranchId(req);
    const context = await getEffectiveBranchForUser(req.user, requestedBranchId);

    if (context.scope === "forbidden") {
      return res.status(403).json({
        success: false,
        message: "Crew hanya bisa mengakses branch yang ditugaskan saat ini",
      });
    }

    req.branchContext = context;
    next();
  } catch (error) {
    next(error);
  }
};
