const svc = require("./return.service");
exports.list = async (req, res, next) => { try { const d = await svc.list(req.user, req.branchContext, req.query); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getById = async (req, res, next) => { try { const d = await svc.getById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { const d = await svc.create(req.user, req.branchContext, req.body); res.json({ success: true, message: "Return berhasil dibuat", data: d }); } catch (e) { next(e); } };
exports.approve = async (req, res, next) => { try { const d = await svc.approve(req.params.id, req.body); res.json({ success: true, message: "Return diapprove", data: d }); } catch (e) { next(e); } };
