const transactionService = require("./transaction.service");

exports.getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(
      req.user,
      req.branchContext,
      req.query
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getTodayTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTodayTransactions(
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

exports.getTransactionById = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactionById(
      req.params.id,
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

exports.createTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.createTransaction(
      req.user,
      req.body,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Transaksi berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.voidTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.voidTransaction(
      req.params.id,
      req.body,
      req.user,
      req.branchContext
    );

    res.json({
      success: true,
      message: "Transaksi berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
