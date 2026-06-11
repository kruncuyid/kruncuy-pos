import api from "../../../core/api/api";

export const productApi = {
  getProducts() {
    return api.get("/products");
  },
  getProductById(id) {
    return api.get(`/products/${id}`);
  },
  createProduct(payload) {
    return api.post("/products", payload);
  },
  updateProduct(id, payload) {
    return api.put(`/products/${id}`, payload);
  },
  deleteProduct(id) {
    return api.delete(`/products/${id}`);
  },
};
