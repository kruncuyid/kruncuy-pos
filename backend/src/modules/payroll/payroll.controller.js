const svc = require("./payroll.service");
exports.list = async (req, res, next) => { try { const d = await svc.list(req.query); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getById = async (req, res, next) => { try { const d = await svc.getById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.calculate = async (req, res, next) => { try { const d = await svc.calculate(req.user.id, Number(req.query.month || new Date().getMonth()+1), Number(req.query.year || new Date().getFullYear()), req.query.branchId); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { const d = await svc.create(req.body); res.json({ success: true, message: "Payroll dibuat", data: d }); } catch (e) { next(e); } };
exports.approve = async (req, res, next) => { try { const d = await svc.approve(req.params.id); res.json({ success: true, message: "Payroll diapprove", data: d }); } catch (e) { next(e); } };
exports.pay = async (req, res, next) => { try { const d = await svc.pay(req.params.id); res.json({ success: true, message: "Payroll dibayar", data: d }); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { await svc.remove(req.params.id); res.json({ success: true, message: "Payroll dihapus" }); } catch (e) { next(e); } };
