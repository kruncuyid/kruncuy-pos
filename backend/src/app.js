const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const env = require("./core/config/env");
const { notFound, errorHandler } = require("./core/middleware/error.middleware");
const { requireAuth } = require("./core/middleware/auth.middleware");
const { resolveBranchContext } = require("./core/middleware/branchContext.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const branchRoutes = require("./modules/branches/branch.routes");
const productCategoryRoutes = require("./modules/product-categories/productCategory.routes");
const productRoutes = require("./modules/products/product.routes");
const branchProductRoutes = require("./modules/branch-products/branchProduct.routes");
const branchAssignmentRoutes = require("./modules/branch-assignments/branchAssignment.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const warehouseRoutes = require("./modules/warehouses/warehouse.routes");
const crewRoutes = require("./modules/crew/crew.routes");
const posRoutes = require("./modules/pos/pos.routes");
const transactionRoutes = require("./modules/transactions/transaction.routes");
const cashSessionRoutes = require("./modules/cash-sessions/cashSession.routes");
const cashWithdrawalRoutes = require("./modules/cash-withdrawals/cashWithdrawal.routes");
const reportRoutes = require("./modules/reports/report.routes");
const erpRoutes = require("./modules/erp/erp.routes");
const masterDataRoutes = require("./modules/master-data/masterData.routes");
const purchasingRoutes = require("./modules/purchasing/purchasing.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const auditLogRoutes = require("./modules/audit-logs/auditLog.routes");
const accessControlRoutes = require("./modules/access-control/accessControl.routes");
const depotTransferRoutes = require("./modules/depot-transfers/depotTransfer.routes");
const supplierRoutes = require("./modules/suppliers/supplier.routes");
const purchaseRequestRoutes = require("./modules/purchase-requests/purchaseRequest.routes");
const purchaseOrderRoutes = require("./modules/purchase-orders/purchaseOrder.routes");
const goodsReceiptRoutes = require("./modules/goods-receipts/goodsReceipt.routes");
const returnRoutes = require("./modules/returns/return.routes");
const payrollRoutes = require("./modules/payroll/payroll.routes");
const customerRoutes = require("./modules/customers/customer.routes");
const supplierInvoiceRoutes = require("./modules/supplier-invoices/supplierInvoice.routes");
const uploadRoutes = require("./modules/upload/upload.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");

const app = express();

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: "Terlalu banyak request. Coba lagi." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: "Terlalu banyak percobaan login. Coba lagi 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...(env.frontendUrl ? [env.frontendUrl] : [])],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: env.nodeEnv === "development" ? true : env.frontendUrl,
    credentials: true,
  })
);

// Set no-cache headers for all API responses
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use("/uploads", express.static("uploads"));

app.use(globalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KRUNCUY POS API Running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const prisma = require("./core/config/prisma");
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: "API health check OK",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Database tidak terhubung",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/auth", authLimiter, authRoutes);

const secureApi = express.Router();
secureApi.use(requireAuth, resolveBranchContext);
secureApi.use("/users", userRoutes);
secureApi.use("/branches", branchRoutes);
secureApi.use("/product-categories", productCategoryRoutes);
secureApi.use("/products", productRoutes);
secureApi.use("/branch-products", branchProductRoutes);
secureApi.use("/branch-assignments", branchAssignmentRoutes);
secureApi.use("/inventory", inventoryRoutes);
secureApi.use("/warehouses", warehouseRoutes);
secureApi.use("/crew", crewRoutes);
secureApi.use("/pos", posRoutes);
secureApi.use("/transactions", transactionRoutes);
secureApi.use("/cash-sessions", cashSessionRoutes);
secureApi.use("/cash-withdrawals", cashWithdrawalRoutes);
secureApi.use("/reports", reportRoutes);
secureApi.use("/erp", erpRoutes);
secureApi.use("/master-data", masterDataRoutes);
secureApi.use("/purchasing", purchasingRoutes);
secureApi.use("/settings", settingsRoutes);
secureApi.use("/audit-logs", auditLogRoutes);
secureApi.use("/access-control", accessControlRoutes);
secureApi.use("/depot-transfers", depotTransferRoutes);
secureApi.use("/suppliers", supplierRoutes);
secureApi.use("/purchase-requests", purchaseRequestRoutes);
secureApi.use("/purchase-orders", purchaseOrderRoutes);
secureApi.use("/goods-receipts", goodsReceiptRoutes);
secureApi.use("/returns", returnRoutes);
secureApi.use("/payroll", payrollRoutes);
secureApi.use("/customers", customerRoutes);
secureApi.use("/supplier-invoices", supplierInvoiceRoutes);
secureApi.use("/upload", uploadRoutes);
secureApi.use("/notifications", notificationRoutes);

app.use("/api", secureApi);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
