const productCategoryService = require("./productCategory.service");

exports.getProductCategories = async (req, res, next) => {
  try {
    const result = await productCategoryService.getProductCategories();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductCategoryById = async (req, res, next) => {
  try {
    const result = await productCategoryService.getProductCategoryById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.createProductCategory = async (req, res, next) => {
  try {
    const result = await productCategoryService.createProductCategory(req.body);

    res.json({
      success: true,
      message: "Kategori produk berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProductCategory = async (req, res, next) => {
  try {
    const result = await productCategoryService.updateProductCategory(req.params.id, req.body);

    res.json({
      success: true,
      message: "Kategori produk berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProductCategory = async (req, res, next) => {
  try {
    const result = await productCategoryService.deleteProductCategory(req.params.id);

    res.json({
      success: true,
      message: "Kategori produk berhasil dihapus",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
