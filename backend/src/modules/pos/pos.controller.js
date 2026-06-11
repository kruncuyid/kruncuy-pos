const posService = require("./pos.service");

exports.getSummary = async (req, res, next) => {
  try {
    const result = await posService.getSummary(req.user, req.branchContext);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCatalog = async (req, res, next) => {
  try {
    const result = await posService.getCatalog(req.user, req.branchContext, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.checkout = async (req, res, next) => {
  try {
    const result = await posService.checkout(
      req.user,
      req.body,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Checkout berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
