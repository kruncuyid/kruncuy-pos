const inventoryService = require("./inventory.service");

exports.getInventoryItems = async (req, res, next) => {
  try {
    const result = await inventoryService.listInventoryItems(req.query);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.createInventoryItem = async (req, res, next) => {
  try {
    const result = await inventoryService.createInventoryItem(req.body);

    res.json({
      success: true,
      message: "Inventory item berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const result = await inventoryService.updateInventoryItem(req.params.id, req.body);

    res.json({
      success: true,
      message: "Inventory item berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.listBranchInventory(req.params.branchId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBranchInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.upsertBranchInventory(
      req.params.branchId,
      req.body
    );

    res.json({
      success: true,
      message: "Setting stok branch berhasil disimpan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMenuRecipes = async (req, res, next) => {
  try {
    const result = await inventoryService.listMenuRecipes();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.upsertMenuRecipe = async (req, res, next) => {
  try {
    const result = await inventoryService.upsertMenuRecipe(req.params.productId, req.body);

    res.json({
      success: true,
      message: "Resep menu berhasil disimpan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
