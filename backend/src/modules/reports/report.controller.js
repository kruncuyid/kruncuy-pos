const reportService = require("./report.service");

exports.getDailyReport = async (req, res, next) => {
  try {
    const result = await reportService.getDailyReport(
      req.user,
      req.branchContext
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getErpDashboard = async (req, res, next) => {
  try {
    const result = await reportService.getErpDashboard(
      req.user,
      req.branchContext,
      req.query
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalesRecap = async (req, res, next) => {
  try {
    const result = await reportService.getSalesRecap(
      req.user,
      req.branchContext,
      req.query || {}
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getReportCatalog = async (req, res, next) => {
  try {
    const result = reportService.listReportCatalog();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getReportByKey = async (req, res, next) => {
  try {
    const result = await reportService.getReportByKey(
      req.params.reportKey,
      req.user,
      req.branchContext,
      req.query || {}
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
