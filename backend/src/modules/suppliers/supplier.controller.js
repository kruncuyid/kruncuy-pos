const supplierService = require("./supplier.service");

exports.list = async (req, res, next) => {
  try {
    const suppliers = await supplierService.listSuppliers();
    res.json({ success: true, data: suppliers });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    res.json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.json({ success: true, message: "Supplier berhasil dibuat", data: supplier });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    res.json({ success: true, message: "Supplier berhasil diupdate", data: supplier });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    res.json({ success: true, message: "Supplier berhasil dinonaktifkan" });
  } catch (err) { next(err); }
};
