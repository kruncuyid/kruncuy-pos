const service = require("./depotTransfer.service");

function handleError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || "Terjadi kesalahan pada transfer depo",
  });
}

exports.list = async (req, res) => {
  try {
    const result = await service.listDepotTransfers(req.user, req.branchContext, req.query);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.detail = async (req, res) => {
  try {
    const transfer = await service.getDepotTransferById(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer depo tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const transfer = await service.createDepotTransfer(req.user, req.body, req.branchContext);

    return res.status(201).json({
      success: true,
      data: transfer,
      message: "Transfer depo berhasil dibuat",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.approve = async (req, res) => {
  try {
    const transfer = await service.approveDepotTransfer(req.user, req.params.id, req.body || {}, req.branchContext);

    return res.json({
      success: true,
      data: transfer,
      message: "Transfer depo berhasil di-approve",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.voidTransfer = async (req, res) => {
  try {
    const transfer = await service.voidDepotTransfer(
      req.user,
      req.params.id,
      req.branchContext,
      req.body?.reason || null
    );

    return res.json({
      success: true,
      data: transfer,
      message: "Transfer depo berhasil di-void",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.summary = async (req, res) => {
  try {
    const summary = await service.getSummary(req.user, req.branchContext);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
