const cashSessionService = require("./cashSession.service");

exports.getActiveSession = async (req, res, next) => {
  try {
    const result = await cashSessionService.getActiveSession(
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

exports.openSession = async (req, res, next) => {
  try {
    const result = await cashSessionService.openSession(
      req.user,
      req.body,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Shift berhasil dimulai",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.closeSession = async (req, res, next) => {
  try {
    const result = await cashSessionService.closeSession(
      req.user,
      req.body,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Shift berhasil ditutup",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
