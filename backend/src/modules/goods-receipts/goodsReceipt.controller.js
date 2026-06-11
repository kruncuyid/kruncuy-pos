const svc = require("./goodsReceipt.service");
exports.list = async (req, res, next) => { try { const d = await svc.list(req.query); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getById = async (req, res, next) => { try { const d = await svc.getById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { const d = await svc.create(req.user, req.branchContext, req.body); res.json({ success: true, message: "Penerimaan barang berhasil dicatat", data: d }); } catch (e) { next(e); } };
