const purchasingService = require("./purchasing.service");

exports.listOutletExpenses = async (req, res, next) => {
  try {
    const result = await purchasingService.listOutletExpenses(req.user, req.branchContext, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOutletExpenseById = async (req, res, next) => {
  try {
    const result = await purchasingService.getOutletExpenseById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.createOutletExpense = async (req, res, next) => {
  try {
    const result = await purchasingService.createOutletExpense(req.user, req.body || {}, req.branchContext);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveOutletExpense = async (req, res, next) => {
  try {
    const result = await purchasingService.approveOutletExpense(
      req.user,
      req.params.id,
      req.branchContext,
      req.body || {}
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.voidOutletExpense = async (req, res, next) => {
  try {
    const result = await purchasingService.voidOutletExpense(
      req.user,
      req.params.id,
      req.branchContext,
      req.body?.reason || null
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const result = await purchasingService.getSummary(req.user, req.branchContext);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
