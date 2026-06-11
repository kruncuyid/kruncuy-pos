const service = require("./warehouse.service");

function handleError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || "Terjadi kesalahan pada warehouse",
  });
}

exports.list = async (req, res) => {
  try {
    const data = await service.listWarehouses();
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await service.getWarehouseById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Warehouse tidak ditemukan" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const data = await service.createWarehouse(req.body);
    return res.status(201).json({
      success: true,
      data,
      message: "Warehouse berhasil dibuat",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await service.updateWarehouse(req.params.id, req.body);
    return res.json({
      success: true,
      data,
      message: "Warehouse berhasil diperbarui",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.listStocks = async (req, res) => {
  try {
    const data = await service.listWarehouseStocks(req.params.warehouseId);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.upsertStocks = async (req, res) => {
  try {
    const data = await service.upsertWarehouseStocks(req.params.warehouseId, req.body);
    return res.json({
      success: true,
      data,
      message: "Warehouse stock berhasil diperbarui",
    });
  } catch (error) {
    return handleError(res, error);
  }
};
