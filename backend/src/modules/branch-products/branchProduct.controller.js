const branchProductService = require("./branchProduct.service");

exports.getBranchProducts = async (req, res, next) => {
  try {
    const result = await branchProductService.getBranchProducts(
      req.user,
      req.branchContext
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchPricingCatalog = async (req, res, next) => {
  try {
    const result = await branchProductService.getBranchPricingCatalog(
      req.user,
      req.branchContext
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchMenuVariants = async (req, res, next) => {
  try {
    const result = await branchProductService.getBranchMenuVariants(
      req.user,
      req.branchContext
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductsByBranch = async (req, res, next) => {
  try {
    const result = await branchProductService.getProductsByBranch(req.params.branchId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchProductById = async (req, res, next) => {
  try {
    const result = await branchProductService.getBranchProductById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchMenuVariantById = async (req, res, next) => {
  try {
    const result = await branchProductService.getBranchMenuVariantById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBranchProduct = async (req, res, next) => {
  try {
    const result = await branchProductService.createBranchProduct(req.body);

    res.json({
      success: true,
      message: "Produk cabang berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBranchMenuVariant = async (req, res, next) => {
  try {
    const result = await branchProductService.createBranchMenuVariant(req.body);

    res.json({
      success: true,
      message: "Menu variant cabang berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkApplyBranchProducts = async (req, res, next) => {
  try {
    const result = await branchProductService.bulkApplyBranchProducts(req.user, req.branchContext, req.body);

    res.json({
      success: true,
      message: `Pricing offline berhasil diterapkan ke ${result.appliedCount} outlet`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkApplyBranchMenuVariants = async (req, res, next) => {
  try {
    const result = await branchProductService.bulkApplyBranchMenuVariants(
      req.user,
      req.branchContext,
      req.body
    );

    res.json({
      success: true,
      message: `Variant online berhasil diterapkan ke ${result.appliedCount} outlet`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBranchProduct = async (req, res, next) => {
  try {
    const result = await branchProductService.updateBranchProduct(req.params.id, req.body);

    res.json({
      success: true,
      message: "Produk cabang berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBranchMenuVariant = async (req, res, next) => {
  try {
    const result = await branchProductService.updateBranchMenuVariant(req.params.id, req.body);

    res.json({
      success: true,
      message: "Menu variant cabang berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBranchProduct = async (req, res, next) => {
  try {
    const result = await branchProductService.deleteBranchProduct(req.params.id);

    res.json({
      success: true,
      message: "Produk cabang berhasil dihapus",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBranchMenuVariant = async (req, res, next) => {
  try {
    const result = await branchProductService.deleteBranchMenuVariant(req.params.id);

    res.json({
      success: true,
      message: "Menu variant cabang berhasil dinonaktifkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
