const svc = require("./supplierInvoice.service");

exports.list = async (req, res, next) => {
  try {
    const result = await svc.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await svc.getById(req.params.id);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await svc.create(req.body);
    res.json({ success: true, message: "Invoice berhasil dibuat", data: result });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const result = await svc.update(req.params.id, req.body);
    res.json({ success: true, message: "Invoice berhasil diupdate", data: result });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    res.json({ success: true, message: "Invoice berhasil dihapus" });
  } catch (e) { next(e); }
};

exports.listPayments = async (req, res, next) => {
  try {
    const result = await svc.listPayments(req.params.id, req.query);
    res.json(result);
  } catch (e) { next(e); }
};

exports.createPayment = async (req, res, next) => {
  try {
    const result = await svc.createPayment(req.params.id, req.body);
    res.json({ success: true, message: "Pembayaran berhasil dicatat", data: result });
  } catch (e) { next(e); }
};
