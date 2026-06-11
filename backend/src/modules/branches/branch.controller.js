const branchService = require("./branch.service");

exports.getBranches = async (req, res, next) => {
  try {
    const result = await branchService.getBranches();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchById = async (req, res, next) => {
  try {
    const result = await branchService.getBranchById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBranch = async (req, res, next) => {
  try {
    const result = await branchService.createBranch(req.body);

    res.json({
      success: true,
      message: "Branch berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const result = await branchService.updateBranch(req.params.id, req.body);

    res.json({
      success: true,
      message: "Branch berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    const result = await branchService.deleteBranch(req.params.id);

    res.json({
      success: true,
      message: "Branch berhasil dihapus",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
