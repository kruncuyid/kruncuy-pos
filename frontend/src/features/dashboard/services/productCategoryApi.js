import api from "../../../core/api/api";

export const productCategoryApi = {
  getProductCategories() {
    return api.get("/product-categories");
  },
  createProductCategory(payload) {
    return api.post("/product-categories", payload);
  },
  updateProductCategory(id, payload) {
    return api.put(`/product-categories/${id}`, payload);
  },
  deleteProductCategory(id) {
    return api.delete(`/product-categories/${id}`);
  },
};
