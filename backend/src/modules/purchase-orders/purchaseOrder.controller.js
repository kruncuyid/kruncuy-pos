const svc = require("./purchaseOrder.service");
exports.list = async (req, res, next) => { try { const d = await svc.list(req.user, req.branchContext, req.query); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getById = async (req, res, next) => { try { const d = await svc.getById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { const d = await svc.create(req.user, req.body); res.json({ success: true, message: "PO berhasil dibuat", data: d }); } catch (e) { next(e); } };
exports.submit = async (req, res, next) => { try { const d = await svc.submit(req.params.id); res.json({ success: true, message: "PO dikirim", data: d }); } catch (e) { next(e); } };
exports.approve = async (req, res, next) => { try { const d = await svc.approve(req.params.id, req.user, req.body); res.json({ success: true, message: "PO diapprove", data: d }); } catch (e) { next(e); } };
exports.cancel = async (req, res, next) => { try { const d = await svc.cancel(req.params.id, req.body); res.json({ success: true, message: "PO dibatalkan", data: d }); } catch (e) { next(e); } };
