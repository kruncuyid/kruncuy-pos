const erpService = require("./erp.service");

exports.getNavigation = async (req, res, next) => {
  try {
    const result = await erpService.getNavigationManifest(req.user);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceOverview = async (req, res, next) => {
  try {
    const result = await erpService.getAttendanceOverview(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPerformanceOverview = async (req, res, next) => {
  try {
    const result = await erpService.getPerformanceOverview(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCashSessionsOverview = async (req, res, next) => {
  try {
    const result = await erpService.getCashSessionsOverview(req.query || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCrossBranchDashboard = async (req, res, next) => {
  try {
    const result = await erpService.getCrossBranchDashboard(req.user, req.branchContext);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
