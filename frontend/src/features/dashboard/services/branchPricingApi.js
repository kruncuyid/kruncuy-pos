import api from "../../../core/api/api";

export const branchPricingApi = {
  getCatalog() {
    return api.get("/branch-products/catalog");
  },
  getBranchProducts() {
    return api.get("/branch-products");
  },
  getBranchMenuVariants() {
    return api.get("/branch-products/variants");
  },
  createBranchProduct(payload) {
    return api.post("/branch-products", payload);
  },
  bulkApplyBranchProducts(payload) {
    return api.post("/branch-products/bulk/products", payload);
  },
  updateBranchProduct(id, payload) {
    return api.put(`/branch-products/${id}`, payload);
  },
  deleteBranchProduct(id) {
    return api.delete(`/branch-products/${id}`);
  },
  createBranchMenuVariant(payload) {
    return api.post("/branch-products/variants", payload);
  },
  bulkApplyBranchMenuVariants(payload) {
    return api.post("/branch-products/bulk/variants", payload);
  },
  updateBranchMenuVariant(id, payload) {
    return api.put(`/branch-products/variants/${id}`, payload);
  },
  deleteBranchMenuVariant(id) {
    return api.delete(`/branch-products/variants/${id}`);
  },
};
