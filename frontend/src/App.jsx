import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./core/components/ProtectedRoute";
import { authApi } from "./features/auth/services/authApi";
import LoginPage from "./features/auth/pages/LoginPage";
import NotFoundPage from "./features/dashboard/pages/NotFoundPage";
import CrewCashWithdrawalsPage from "./features/crew/pages/CrewCashWithdrawalsPage";
import CrewPerformancePage from "./features/crew/pages/CrewPerformancePage";
import CrewPosPage from "./features/crew/pages/CrewPosPage";
import CrewStockOpnamePage from "./features/crew/pages/CrewStockOpnamePage";
import CrewStockOutletPage from "./features/crew/pages/CrewStockOutletPage";
import CrewHomePage from "./features/crew/pages/CrewHomePage";
import CrewSalesTodayPage from "./features/crew/pages/CrewSalesTodayPage";
import CrewOperationalPage from "./features/crew/pages/CrewOperationalPage";
import ErpAccessControlPage from "./features/dashboard/pages/ErpAccessControlPage";
import ErpSuppliersPage from "./features/dashboard/pages/ErpSuppliersPage";
import ErpPurchaseRequestPage from "./features/dashboard/pages/ErpPurchaseRequestPage";
import ErpPurchaseOrderPage from "./features/dashboard/pages/ErpPurchaseOrderPage";
import ErpGoodsReceiptPage from "./features/dashboard/pages/ErpGoodsReceiptPage";
import ErpReturnsPage from "./features/dashboard/pages/ErpReturnsPage";
import ErpPayrollPage from "./features/dashboard/pages/ErpPayrollPage";
import ErpWastePage from "./features/dashboard/pages/ErpWastePage";
import ErpCrossBranchPage from "./features/dashboard/pages/ErpCrossBranchPage";
import ErpNotificationsPage from "./features/dashboard/pages/ErpNotificationsPage";
import ErpPurchasingPage from "./features/dashboard/pages/ErpPurchasingPage";
import ErpCashControlPage from "./features/dashboard/pages/ErpCashControlPage";
import ErpPurchasingQueuePage from "./features/dashboard/pages/ErpPurchasingQueuePage";
import ErpShipmentTrackingPage from "./features/dashboard/pages/ErpShipmentTrackingPage";
import ErpMasterDataPage from "./features/dashboard/pages/ErpMasterDataPage";
import ErpOperationsLogPage from "./features/dashboard/pages/ErpOperationsLogPage";
import ErpBranchOrdersPage from "./features/dashboard/pages/ErpBranchOrdersPage";
import ErpCompliancePage from "./features/dashboard/pages/ErpCompliancePage";
import ErpReferencePage from "./features/dashboard/pages/ErpReferencePage";
import ErpCustomersPage from "./features/dashboard/pages/ErpCustomersPage";
import ErpSupplierInvoicesPage from "./features/dashboard/pages/ErpSupplierInvoicesPage";
import ErpInvoicePaymentsPage from "./features/dashboard/pages/ErpInvoicePaymentsPage";
import ErpAttendancePage from "./features/dashboard/pages/ErpAttendancePage";
import ErpBranchAssignmentsPage from "./features/dashboard/pages/ErpBranchAssignmentsPage";
import ErpBranchPricingPage from "./features/dashboard/pages/ErpBranchPricingPage";
import ErpBranchesPage from "./features/dashboard/pages/ErpBranchesPage";
import ErpDashboard from "./features/dashboard/pages/ErpDashboard";
import ErpFeaturePage from "./features/dashboard/pages/ErpFeaturePage";
import ErpDepotTransfersPage from "./features/dashboard/pages/ErpDepotTransfersPage";
import ErpCashWithdrawalsPage from "./features/dashboard/pages/ErpCashWithdrawalsPage";
import ErpCashSessionsPage from "./features/dashboard/pages/ErpCashSessionsPage";
import ErpInventoryItemsPage from "./features/dashboard/pages/ErpInventoryItemsPage";
import ErpInventoryMovementPage from "./features/dashboard/pages/ErpInventoryMovementPage";
import ErpWarehousePage from "./features/dashboard/pages/ErpWarehousePage";
import ErpAuditLogsPage from "./features/dashboard/pages/ErpAuditLogsPage";
import ErpStockOpnamePage from "./features/dashboard/pages/ErpStockOpnamePage";
import ErpMenuRecipesPage from "./features/dashboard/pages/ErpMenuRecipesPage";
import ErpPerformancePage from "./features/dashboard/pages/ErpPerformancePage";
import ErpOutletExpensesPage from "./features/dashboard/pages/ErpOutletExpensesPage";
import ErpProductCategoriesPage from "./features/dashboard/pages/ErpProductCategoriesPage";
import ErpProductsPage from "./features/dashboard/pages/ErpProductsPage";
import ErpSalesPage from "./features/dashboard/pages/ErpSalesPage";
import ErpSettingsPage from "./features/dashboard/pages/ErpSettingsPage";
import ErpTransactionsPage from "./features/dashboard/pages/ErpTransactionsPage";
import ErpReportsCenterPage from "./features/dashboard/pages/ErpReportsCenterPage";
import ErpUsersPage from "./features/dashboard/pages/ErpUsersPage";
import ErpDynamicReportPage from "./features/dashboard/pages/ErpDynamicReportPage";
import SalesRecapReportPage from "./features/dashboard/pages/SalesRecapReportPage";
import { ERP_REPORTS } from "./features/dashboard/reportCatalog";
import {
  clearSession,
  getHomePathByRole,
  getStoredToken,
  getStoredUser,
  updateStoredAccess,
  updateStoredUser,
} from "./core/auth/session";

const erpStandardReportRoutes = ERP_REPORTS.filter((report) => report.path !== "/erp/reports/sales-recap");

const erpPlaceholderRoutesRaw = [
  {
    path: "/erp/branch-assignments",
    permission: "branch-assignments:read",
    title: "Branch Assignments",
    description: "Tempat untuk mengatur penempatan kru ke branch tertentu sesuai kebutuhan operasional.",
    purpose:
      "Halaman ini akan dipakai untuk mengelola assignment kru ke branch, melihat riwayat penempatan, dan memantau cabang mana saja yang sedang ditangani tiap crew.",
    ideas: [
      "Daftar crew dan branch home base",
      "Riwayat penempatan crew lintas branch",
      "Status assignment aktif dan jadwal perpindahan",
    ],
  },
  {
    path: "/erp/sales",
    permission: "reports:read",
    title: "Sales Overview",
    description: "Ringkasan penjualan harian, channel online/offline, dan cash movement lintas branch.",
    purpose:
      "Halaman ini akan jadi ringkasan sales lintas branch agar tim ERP cepat melihat performa harian tanpa masuk ke detail transaksi.",
    ideas: [
      "Summary penjualan harian per branch",
      "Breakdown cash, qris, dan channel online",
      "Quick insight untuk trend sales hari ini",
    ],
  },
  {
    path: "/erp/transactions",
    permission: "transactions:read",
    title: "Transactions",
    description: "Daftar transaksi penjualan yang masuk ke sistem ERP.",
    purpose:
      "Halaman ini akan menampung histori transaksi agar admin bisa melihat detail order, status void, dan sumber channel penjualan.",
    ideas: [
      "Daftar invoice masuk",
      "Filter berdasarkan branch dan channel",
      "Detail pembayaran dan status transaksi",
    ],
  },
  {
    path: "/erp/cash-sessions",
    permission: "cash-sessions:read",
    title: "Cash Sessions",
    description: "Flow open shift, close shift, dan rekonsiliasi kas outlet.",
    purpose:
      "Halaman ini akan dipakai untuk memantau sesi kasir, opening cash, expected cash, dan closing cash per branch.",
    ideas: [
      "Daftar sesi kasir aktif dan selesai",
      "Opening cash dan closing cash",
      "Selisih cash outlet dengan sistem",
    ],
  },
  {
    path: "/erp/inventory",
    permission: "inventory:read",
    title: "Inventory Items",
    description: "Master item bahan baku, packaging, utility, dan supply.",
    purpose:
      "Halaman ini akan dipakai untuk mengelola master item inventory yang akan dipakai di stock opname, purchasing, dan resep menu.",
    ideas: [
      "CRUD item inventory",
      "Unit, tipe item, dan status aktif",
      "Penanda item yang wajib stock opname",
    ],
  },
  {
    path: "/erp/stock-opname",
    permission: "inventory:read",
    title: "Stock Opname",
    description: "Opening dan closing opname per branch.",
    purpose:
      "Halaman ini akan menampilkan hasil opname harian, selisih stok, serta status pembuka dan penutup shift outlet.",
    ideas: [
      "Form opening opname",
      "Form closing opname",
      "Variance per item dan status selesai",
    ],
  },
  {
    path: "/erp/inventory-movement",
    permission: "inventory:read",
    title: "Inventory Movement",
    description: "Jejak mutasi barang masuk, konsumsi, adjustment, dan waste.",
    purpose:
      "Halaman ini akan menampung histori pergerakan stok agar tim operasional bisa audit barang masuk dan keluar dengan jelas.",
    ideas: [
      "Barang masuk dari pembelian",
      "Barang keluar karena penjualan atau waste",
      "Riwayat adjustment stok",
    ],
  },
  {
    path: "/erp/products",
    permission: "products:read",
    title: "Products",
    description: "Master menu dan varian harga dasar.",
    purpose:
      "Halaman ini akan dipakai untuk mengelola master produk dan price baseline yang nantinya dipakai oleh branch pricing dan channel online.",
    ideas: [
      "CRUD menu utama",
      "Harga dasar dan pcs per paket",
      "Status aktif menu",
    ],
  },
  {
    path: "/erp/product-categories",
    permission: "product-categories:read",
    title: "Product Categories",
    description: "Kategori menu agar tampilan dan filter produk lebih rapi.",
    purpose:
      "Halaman ini akan dipakai untuk mengelompokkan menu agar pengaturan produk dan POS lebih terstruktur.",
    ideas: [
      "CRUD kategori menu",
      "Sort order kategori",
      "Status aktif/inaktif kategori",
    ],
  },
  {
    path: "/erp/branch-products",
    permission: "branch-products:read",
    title: "Branch Pricing",
    description: "Atur harga dan availability per branch.",
    purpose:
      "Halaman ini akan menjadi tempat pengaturan harga menu per branch agar cabang bisa punya harga yang berbeda bila dibutuhkan.",
    ideas: [
      "List harga per branch",
      "Availability per outlet",
      "Overwrite harga default",
    ],
  },
  {
    path: "/erp/menu-recipes",
    permission: "products:read",
    title: "Recipes",
    description: "Resep menu ke bahan baku dan packaging.",
    purpose:
      "Halaman ini akan dipakai untuk menghubungkan menu ke bahan baku, sehingga stok raw material bisa otomatis berkurang saat transaksi masuk.",
    ideas: [
      "Resep per menu",
      "Komposisi raw material dan packaging",
      "Versi resep dan yield",
    ],
  },
  {
    path: "/erp/purchasing",
    permission: "purchasing:read",
    title: "Purchasing",
    description: "Alur pembelian barang outlet dan pengadaan stok.",
    purpose:
      "Halaman ini akan dipakai untuk pembelian barang outlet dari depo atau supplier, termasuk alur approval dan catatan pembelian.",
    ideas: [
      "Daftar pembelian outlet",
      "Status request dan approval",
      "Item yang dibeli dan total biaya",
    ],
  },
  {
    path: "/erp/outlet-expenses",
    permission: "purchasing:read",
    title: "Outlet Expenses",
    description: "Expense outlet, nota, dan dampaknya ke cash.",
    purpose:
      "Halaman ini akan dipakai untuk mencatat pembelian kecil di outlet, upload nota, dan otomatis mengurangi cash outlet setelah disetujui.",
    ideas: [
      "Expense harian outlet",
      "Upload foto nota",
      "Dampak terhadap cash outlet dan stok opname",
    ],
  },
  {
    path: "/erp/users",
    permission: "users:read",
    title: "Users",
    description: "User, role, dan penempatan kru.",
    purpose:
      "Halaman ini akan dipakai untuk mengelola user ERP dan crew, termasuk role assignment dan branch penempatan.",
    ideas: [
      "CRUD user",
      "Assign role dari database",
      "Atur home base dan penempatan branch",
    ],
  },
  {
    path: "/erp/attendance",
    permission: "cash-sessions:read",
    title: "Attendance",
    description: "Kehadiran crew dan open shift flow.",
    purpose:
      "Halaman ini akan dipakai untuk melihat kehadiran crew, open shift, dan closed shift agar operasional harian lebih rapi.",
    ideas: [
      "Daftar kehadiran crew",
      "Open shift dan close shift",
      "Gate stock opname sebelum shift dibuka",
    ],
  },
  {
    path: "/erp/performance",
    permission: "reports:read",
    title: "Performance",
    description: "Performa crew bulanan dan bonus.",
    purpose:
      "Halaman ini akan dipakai untuk menilai performa crew per bulan, termasuk sales, pcs terjual, kehadiran, dan estimasi bonus.",
    ideas: [
      "Rekap performa bulanan",
      "Jumlah kali masuk dan sales harian",
      "Estimasi bonus crew",
    ],
  },
  {
    path: "/erp/master-data",
    permission: "master-data:read",
    title: "Master Data",
    description: "Referensi utama lintas modul ERP.",
    purpose:
      "Halaman ini akan dipakai untuk data referensi umum seperti unit, channel, platform, dan parameter sistem lain yang dipakai lintas modul.",
    ideas: [
      "Reference data system",
      "Unit, channel, dan platform",
      "Data pendukung lintas modul",
    ],
  },
  {
    path: "/erp/settings",
    permission: "settings:read",
    title: "Settings",
    description: "System setting, feature flags, dan konfigurasi sistem.",
    purpose:
      "Halaman ini akan dipakai untuk konfigurasi ERP, feature toggle, dan parameter sistem yang memengaruhi workflow operasional.",
    ideas: [
      "System settings",
      "Feature flags",
      "Setting global dan per branch",
    ],
  },
  {
    path: "/erp/audit-logs",
    permission: "audit-logs:read",
    title: "Audit Logs",
    description: "Jejak aktivitas perubahan penting.",
    purpose:
      "Halaman ini akan menampilkan jejak perubahan penting agar tim bisa audit siapa melakukan apa, kapan, dan di branch mana.",
    ideas: [
      "Log create/update/delete",
      "Filter by user dan branch",
      "Audit aktivitas penting ERP",
    ],
  },
  {
    path: "/erp/reference",
    permission: "master-data:read",
    title: "Master Reference",
    description: "Daftar referensi dan setup tambahan untuk ERP.",
    purpose:
      "Halaman ini akan dipakai untuk setup referensi tambahan yang dipakai sebagai dasar konfigurasi modul lain.",
    ideas: [
      "Daftar referensi sistem",
      "Setup awal lintas modul",
      "Data pendukung untuk admin",
    ],
  },
  {
    path: "/erp/purchasing-queue",
    permission: "purchasing:read",
    title: "Purchasing Queue",
    description: "Antrian pembelian yang menunggu diproses.",
    purpose:
      "Halaman ini akan dipakai untuk melihat pembelian yang masih menunggu diproses atau disetujui oleh tim terkait.",
    ideas: [
      "Daftar request pembelian",
      "Status waiting, approved, done",
      "Filter per branch dan item",
    ],
  },
  {
    path: "/erp/shipment-tracking",
    permission: "inventory:read",
    title: "Shipment Tracking",
    description: "Pantau barang datang dari depo ke outlet.",
    purpose:
      "Halaman ini akan dipakai untuk tracking barang yang sedang dikirim agar outlet tahu kapan stok akan masuk.",
    ideas: [
      "Status pengiriman barang",
      "Item yang sedang transit",
      "Estimasi barang sampai branch",
    ],
  },
  {
    path: "/erp/operations-log",
    permission: "reports:read",
    title: "Operations Log",
    description: "Catatan operasional lintas modul.",
    purpose:
      "Halaman ini akan dipakai untuk mencatat ringkasan kejadian operasional penting yang terjadi di sistem ERP.",
    ideas: [
      "Ringkasan aktivitas harian",
      "Notifikasi operasional penting",
      "Jejak kerja lintas modul",
    ],
  },
  {
    path: "/erp/warehouse",
    permission: "inventory:read",
    title: "Warehouse",
    description: "Pusat stok dan distribusi barang.",
    purpose:
      "Halaman ini akan dipakai untuk manajemen gudang dan distribusi stok ke branch atau outlet.",
    ideas: [
      "Stok gudang pusat",
      "Distribusi ke branch",
      "Movement antar lokasi",
    ],
  },
  {
    path: "/erp/branch-orders",
    permission: "purchasing:read",
    title: "Branch Orders",
    description: "Permintaan barang antar branch.",
    purpose:
      "Halaman ini akan dipakai untuk permintaan barang antar branch atau dari branch ke pusat distribusi.",
    ideas: [
      "Request barang antar branch",
      "Status order pengiriman",
      "Approval order",
    ],
  },
  {
    path: "/erp/cash-control",
    permission: "cash-sessions:read",
    title: "Cash Control",
    description: "Kontrol saldo kas outlet dan selisih kas.",
    purpose:
      "Halaman ini akan dipakai untuk memantau cash outlet, selisih kas, dan cross-check dengan transaksi.",
    ideas: [
      "Saldo cash saat ini",
      "Expected cash vs actual cash",
      "Selisih kas outlet",
    ],
  },
  {
    path: "/erp/compliance",
    permission: "audit-logs:read",
    title: "Compliance",
    description: "Area kepatuhan dan jejak audit.",
    purpose:
      "Halaman ini akan dipakai untuk mengecek kepatuhan operasional dan audit trail yang penting bagi ERP.",
    ideas: [
      "Audit compliance overview",
      "Checklist kepatuhan",
      "Log pelanggaran atau perubahan penting",
    ],
  },
];

const erpPlaceholderRoutes = erpPlaceholderRoutesRaw.filter(
  (route) =>
    ![
      "/erp/products",
      "/erp/inventory",
      "/erp/menu-recipes",
      "/erp/branch-assignments",
      "/erp/sales",
      "/erp/cash-sessions",
      "/erp/transactions",
      "/erp/branch-products",
      "/erp/product-categories",
      "/erp/outlet-expenses",
      "/erp/users",
      "/erp/attendance",
      "/erp/performance",
      "/erp/settings",
      "/erp/inventory-movement",
      "/erp/warehouse",
      "/erp/audit-logs",
      "/erp/suppliers",
      "/erp/purchase-requests",
      "/erp/purchase-orders",
      "/erp/goods-receipts",
      "/erp/returns",
      "/erp/waste",
      "/erp/payroll",
      "/erp/stock-opname",
      "/erp/customers",
      "/erp/supplier-invoices",
      "/erp/purchasing",
      "/erp/cash-control",
      "/erp/purchasing-queue",
      "/erp/shipment-tracking",
      "/erp/master-data",
      "/erp/operations-log",
      "/erp/branch-orders",
      "/erp/compliance",
      "/erp/reference",
    ].includes(route.path)
);

function HomeRedirect() {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token) return <Navigate to="/login" replace />;

  return <Navigate to={getHomePathByRole(user?.role)} replace />;
}

function SessionBootstrap() {
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    let cancelled = false;

    async function refreshSession() {
      try {
        const response = await authApi.me();
        if (cancelled) return;

        const nextUser = response.data?.data?.user;
        const nextAccess = response.data?.data?.access;

        if (nextUser) {
          updateStoredUser(nextUser);
        }

        if (nextAccess) {
          updateStoredAccess(nextAccess);
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          clearSession();
        }
      }
    }

    refreshSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <>
      <SessionBootstrap />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<HomeRedirect />} />

      <Route
        path="/erp"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <ErpDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/cross-branch"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <ErpCrossBranchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/notifications"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <ErpNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/branches"
        element={
          <ProtectedRoute allowedPermissions={["branches:read"]}>
            <ErpBranchesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/access-control"
        element={
          <ProtectedRoute allowedPermissions={["access-control:read"]}>
            <ErpAccessControlPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/products"
        element={
          <ProtectedRoute allowedPermissions={["products:read"]}>
            <ErpProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/inventory"
        element={
          <ProtectedRoute allowedPermissions={["inventory:read"]}>
            <ErpInventoryItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/menu-recipes"
        element={
          <ProtectedRoute allowedPermissions={["inventory:read"]}>
            <ErpMenuRecipesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/branch-assignments"
        element={
          <ProtectedRoute allowedPermissions={["branch-assignments:read"]}>
            <ErpBranchAssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/depot-transfers"
        element={
          <ProtectedRoute allowedPermissions={["depot-transfers:read"]}>
            <ErpDepotTransfersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/cash-withdrawals"
        element={
          <ProtectedRoute allowedPermissions={["cash-withdrawals:read"]}>
            <ErpCashWithdrawalsPage />
          </ProtectedRoute>
        }
      />
        <Route
        path="/erp/inventory-movement"
        element={
          <ProtectedRoute allowedPermissions={["inventory:read"]}>
            <ErpInventoryMovementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/warehouse"
        element={
          <ProtectedRoute allowedPermissions={["inventory:read"]}>
            <ErpWarehousePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/stock-opname"
        element={
          <ProtectedRoute allowedPermissions={["inventory:read"]}>
            <ErpStockOpnamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/suppliers"
        element={
          <ProtectedRoute allowedPermissions={["suppliers:read"]}>
            <ErpSuppliersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/supplier-invoices"
        element={
          <ProtectedRoute allowedPermissions={["purchasing:read"]}>
            <ErpSupplierInvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/supplier-invoices/:id/payments"
        element={
          <ProtectedRoute allowedPermissions={["purchasing:read"]}>
            <ErpInvoicePaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/purchase-requests"
        element={
          <ProtectedRoute allowedPermissions={["purchasing-request:read"]}>
            <ErpPurchaseRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/purchase-orders"
        element={
          <ProtectedRoute allowedPermissions={["purchasing-order:read"]}>
            <ErpPurchaseOrderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/goods-receipts"
        element={
          <ProtectedRoute allowedPermissions={["goods-receipt:read"]}>
            <ErpGoodsReceiptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/returns"
        element={
          <ProtectedRoute allowedPermissions={["returns:read"]}>
            <ErpReturnsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/waste"
        element={
          <ProtectedRoute allowedPermissions={["waste:read"]}>
            <ErpWastePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/payroll"
        element={
          <ProtectedRoute allowedPermissions={["payroll:read"]}>
            <ErpPayrollPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/purchasing"
        element={
          <ProtectedRoute allowedPermissions={["purchasing:read"]}>
            <ErpPurchasingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/cash-control"
        element={
          <ProtectedRoute allowedPermissions={["cash-sessions:read"]}>
            <ErpCashControlPage />
          </ProtectedRoute>
        }
      />
      <Route path="/erp/purchasing-queue" element={<ProtectedRoute allowedPermissions={["purchasing:read"]}><ErpPurchasingQueuePage /></ProtectedRoute>} />
      <Route path="/erp/shipment-tracking" element={<ProtectedRoute allowedPermissions={["inventory:read"]}><ErpShipmentTrackingPage /></ProtectedRoute>} />
      <Route path="/erp/master-data" element={<ProtectedRoute allowedPermissions={["master-data:read"]}><ErpMasterDataPage /></ProtectedRoute>} />
      <Route path="/erp/operations-log" element={<ProtectedRoute allowedPermissions={["reports:read"]}><ErpOperationsLogPage /></ProtectedRoute>} />
      <Route path="/erp/branch-orders" element={<ProtectedRoute allowedPermissions={["purchasing:read"]}><ErpBranchOrdersPage /></ProtectedRoute>} />
      <Route path="/erp/compliance" element={<ProtectedRoute allowedPermissions={["audit-logs:read"]}><ErpCompliancePage /></ProtectedRoute>} />
      <Route path="/erp/reference" element={<ProtectedRoute allowedPermissions={["master-data:read"]}><ErpReferencePage /></ProtectedRoute>} />
      <Route
          path="/erp/product-categories"
          element={
            <ProtectedRoute allowedPermissions={["product-categories:read"]}>
            <ErpProductCategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/branch-products"
        element={
          <ProtectedRoute allowedPermissions={["branch-products:read"]}>
            <ErpBranchPricingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/outlet-expenses"
        element={
          <ProtectedRoute allowedPermissions={["purchasing:read"]}>
            <ErpOutletExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/users"
        element={
          <ProtectedRoute allowedPermissions={["users:read"]}>
            <ErpUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/customers"
        element={
          <ProtectedRoute allowedPermissions={["master-data:read"]}>
            <ErpCustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/sales"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <ErpSalesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/transactions"
        element={
          <ProtectedRoute allowedPermissions={["transactions:read"]}>
            <ErpTransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/cash-sessions"
        element={
          <ProtectedRoute allowedPermissions={["cash-sessions:read"]}>
            <ErpCashSessionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/attendance"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <ErpAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/erp/performance"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <ErpPerformancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/erp/settings"
        element={
          <ProtectedRoute allowedPermissions={["settings:read"]}>
            <ErpSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/erp/audit-logs"
        element={
          <ProtectedRoute allowedPermissions={["audit-logs:read"]}>
            <ErpAuditLogsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/erp/reports"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <ErpReportsCenterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/erp/reports/sales-recap"
        element={
          <ProtectedRoute allowedPermissions={["reports:read"]}>
            <SalesRecapReportPage />
          </ProtectedRoute>
        }
      />

      {erpStandardReportRoutes.map((report) => (
        <Route
          key={report.path}
          path={report.path}
          element={
            <ProtectedRoute allowedPermissions={["reports:read"]}>
              <ErpDynamicReportPage reportKey={report.key} />
            </ProtectedRoute>
          }
        />
      ))}

      {erpPlaceholderRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ProtectedRoute allowedPermissions={[route.permission]}>
              <ErpFeaturePage
                title={route.title}
                description={route.description}
                purpose={route.purpose}
                ideas={route.ideas}
                permissions={[route.permission]}
              />
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="/owner" element={<Navigate to="/erp" replace />} />
      <Route path="/owner/branches" element={<Navigate to="/erp/branches" replace />} />

      <Route
        path="/crew"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew/sales-today"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewSalesTodayPage />
          </ProtectedRoute>
        }
      />
      <Route path="/outlet-crew" element={<Navigate to="/crew" replace />} />
      <Route
        path="/crew/operational"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewOperationalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew/performance"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewPerformancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew/cash-withdrawals"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewCashWithdrawalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew/stock-opname"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewStockOpnamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew/stock-outlet"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewStockOutletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew/pos"
        element={
          <ProtectedRoute allowedRoles={["CREW"]}>
            <CrewPosPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
