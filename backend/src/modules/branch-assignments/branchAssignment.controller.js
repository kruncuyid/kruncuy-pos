const branchAssignmentService = require("./branchAssignment.service");

exports.getAssignments = async (req, res, next) => {
  try {
    const result = await branchAssignmentService.getAssignments({
      userId: req.query.userId,
      branchId: req.query.branchId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const result = await branchAssignmentService.createAssignment(req.body);

    res.json({
      success: true,
      message: "Assignment branch berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateAssignment = async (req, res, next) => {
  try {
    const result = await branchAssignmentService.deactivateAssignment(req.params.id);

    res.json({
      success: true,
      message: "Assignment branch berhasil dinonaktifkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.activateAssignment = async (req, res, next) => {
  try {
    const result = await branchAssignmentService.activateAssignment(req.params.id);
    res.json({ success: true, message: "Assignment diaktifkan", data: result });
  } catch (error) { next(error); }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const result = await branchAssignmentService.updateAssignment(req.params.id, req.body);
    res.json({ success: true, message: "Assignment diupdate", data: result });
  } catch (error) { next(error); }
};

exports.quickAssign = async (req, res, next) => {
  try {
    const { userId, branchId, date } = req.body;
    const result = await branchAssignmentService.quickAssign(userId, branchId, date);
    res.json({ success: true, message: "Assign berhasil", data: result });
  } catch (error) { next(error); }
};
