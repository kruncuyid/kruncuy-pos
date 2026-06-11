import api from "../../../core/api/api";

export const warehouseApi = {
  getWarehouses() {
    return api.get("/warehouses");
  },
  getWarehouse(id) {
    return api.get(`/warehouses/${id}`);
  },
  createWarehouse(payload) {
    return api.post("/warehouses", payload);
  },
  updateWarehouse(id, payload) {
    return api.patch(`/warehouses/${id}`, payload);
  },
  getWarehouseStocks(warehouseId) {
    return api.get(`/warehouses/${warehouseId}/stocks`);
  },
  updateWarehouseStocks(warehouseId, payload) {
    return api.put(`/warehouses/${warehouseId}/stocks`, payload);
  },
};
