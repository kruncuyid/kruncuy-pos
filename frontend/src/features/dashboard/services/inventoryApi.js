import api from "../../../core/api/api";

export const inventoryApi = {
  getInventoryItems() {
    return api.get("/inventory/items");
  },
  createInventoryItem(payload) {
    return api.post("/inventory/items", payload);
  },
  updateInventoryItem(id, payload) {
    return api.patch(`/inventory/items/${id}`, payload);
  },
  getMenuRecipes() {
    return api.get("/inventory/menu-recipes");
  },
  upsertMenuRecipe(productId, payload) {
    return api.put(`/inventory/menu-recipes/${productId}`, payload);
  },
};
