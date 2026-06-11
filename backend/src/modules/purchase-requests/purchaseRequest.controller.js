const svc = require("./purchaseRequest.service");

exports.list = async (req, res, next) => { try { const data = await svc.list(req.user, req.branchContext, req.query); res.json({ success: true, data }); } catch (e) { next(e); } };
exports.getById = async (req, res, next) => { try { const data = await svc.getById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { const data = await svc.create(req.user, req.body); res.json({ success: true, message: "PR berhasil dibuat", data }); } catch (e) { next(e); } };
exports.submit = async (req, res, next) => { try { const data = await svc.submit(req.params.id, req.user); res.json({ success: true, message: "PR disubmit", data }); } catch (e) { next(e); } };
exports.approve = async (req, res, next) => { try { const data = await svc.approve(req.params.id, req.user, req.body); res.json({ success: true, message: "PR diapprove", data }); } catch (e) { next(e); } };
exports.reject = async (req, res, next) => { try { const data = await svc.reject(req.params.id, req.user, req.body); res.json({ success: true, message: "PR ditolak", data }); } catch (e) { next(e); } };
