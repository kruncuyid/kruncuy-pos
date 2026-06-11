const productService = require("./product.service");

exports.getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const result = await productService.getProductById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const result = await productService.createProduct(req.body);

    res.json({
      success: true,
      message: "Produk berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const result = await productService.updateProduct(req.params.id, req.body);

    res.json({
      success: true,
      message: "Produk berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);

    res.json({
      success: true,
      message: "Produk berhasil dihapus",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
