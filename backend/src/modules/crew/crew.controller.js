const crewService = require("./crew.service");

exports.getDashboard = async (req, res, next) => {
  try {
    const result = await crewService.getCrewDashboard(req.user, req.branchContext);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodaySales = async (req, res, next) => {
  try {
    const result = await crewService.getTodayBranchSales(req.user, req.branchContext);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyPerformance = async (req, res, next) => {
  try {
    const result = await crewService.getMonthlyCrewPerformance(req.user, req.query || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceGate = async (req, res, next) => {
  try {
    const result = await crewService.getAttendanceGate(req.user, req.branchContext);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getStockOpnameForm = async (req, res, next) => {
  try {
    const result = await crewService.getStockOpnameForm(
      req.user,
      req.branchContext,
      req.query.kind === "CLOSING" ? "CLOSING" : "OPENING"
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.completeStockOpname = async (req, res, next) => {
  try {
    const result = await crewService.completeStockOpname(
      req.user,
      req.body,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Stock opname harian selesai",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.checkIn = async (req, res, next) => {
  try {
    const result = await crewService.checkInAttendance(
      req.user,
      req.body,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Absensi berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.checkOut = async (req, res, next) => {
  try {
    const result = await crewService.checkOutAttendance(
      req.user,
      req.body,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Check-out berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDepotApprovals = async (req, res, next) => {
  try {
    const result = await crewService.getDepotApprovalQueue(req.user, req.branchContext, req.query || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveDepotTransfer = async (req, res, next) => {
  try {
    const result = await crewService.approveDepotTransferForCrew(
      req.user,
      req.params.id,
      req.body || {},
      req.branchContext
    );

    res.json({
      success: true,
      message: "Transfer berhasil di-approve",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOutletStockOverview = async (req, res, next) => {
  try {
    const result = await crewService.getOutletStockOverview(req.user, req.branchContext, req.query || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.submitRetur = async (req, res, next) => {
  try {
    const result = await crewService.recordReturWaste(req.user, req.branchContext, req.body);

    res.json({
      success: true,
      message: "Retur berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyBranches = async (req, res, next) => {
  try {
    const result = await crewService.getCrewBranches(req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
