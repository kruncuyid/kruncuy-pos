const customerService = require("./customer.service");

exports.list = async (req, res, next) => {
  try {
    const result = await customerService.list(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await customerService.getById(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await customerService.create(req.body);
    res.json({ success: true, message: "Customer berhasil dibuat", data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await customerService.update(req.params.id, req.body);
    res.json({ success: true, message: "Customer berhasil diupdate", data: result });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await customerService.remove(req.params.id);
    res.json({ success: true, message: "Customer berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};
