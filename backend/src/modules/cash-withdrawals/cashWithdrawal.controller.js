const cashWithdrawalService = require("./cashWithdrawal.service");

exports.getDashboard = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.getWithdrawalDashboard(req.user, req.branchContext, req.query);
    res.json({
      success: true,
      message: "Dashboard cash withdrawal berhasil dimuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.listWithdrawals = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.listCashWithdrawals(req.user, req.branchContext, req.query);
    res.json({
      success: true,
      message: "Daftar cash withdrawal berhasil dimuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.listMyWithdrawals = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.listMyCashWithdrawals(req.user, req.branchContext);
    res.json({
      success: true,
      message: "Riwayat cash withdrawal crew berhasil dimuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.requestWithdrawal = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.requestCashWithdrawal(req.user, req.body || {}, req.branchContext);
    res.status(201).json({
      success: true,
      message: "Setoran cash berhasil diajukan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.issueOtp = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.issueCashWithdrawalOtp(req.user, req.params.id, req.branchContext);
    res.json({
      success: true,
      message: "OTP setoran cash berhasil diterbitkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateOtp = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.generateOtpForWithdrawal(req.user, req.params.id, req.branchContext);
    res.json({
      success: true,
      message: "OTP berhasil digenerate. Berikan kode ini ke manajemen.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.verifyCashWithdrawalOtp(
      req.user,
      req.params.id,
      req.body || {},
      req.branchContext
    );
    res.json({
      success: true,
      message: "Setoran cash berhasil diverifikasi",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchCashInfo = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.getBranchAvailableCash(req.params.branchId);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getPendingOtp = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.getPendingWithdrawalsForCrew(req.user, req.branchContext);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.createFromErp = async (req, res, next) => {
  try {
    const result = await cashWithdrawalService.createWithdrawalByManagement(req.user, req.body);
    res.status(201).json({
      success: true,
      message: "Penarikan cash berhasil dibuat. OTP siap untuk crew.",
      data: result,
    });
  } catch (error) { next(error); }
};

exports.cancelWithdrawal = async (req, res, next) => {
  try {    const result = await cashWithdrawalService.cancelCashWithdrawal(req.user, req.params.id, req.body || {}, req.branchContext);
    res.json({
      success: true,
      message: "Setoran cash berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
