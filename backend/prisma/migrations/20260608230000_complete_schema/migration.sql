-- CreateEnum
CREATE TYPE "public"."RoleBranchScope" AS ENUM ('ALL', 'SINGLE');

-- CreateEnum
CREATE TYPE "public"."SalesChannel" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "public"."OnlinePlatform" AS ENUM ('GRABFOOD', 'GOFOOD', 'SHOPEEFOOD');

-- CreateEnum
CREATE TYPE "public"."InventoryItemType" AS ENUM ('RAW_MATERIAL', 'PACKAGING', 'UTILITY', 'SUPPLY');

-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('PURCHASE', 'CONSUMPTION', 'ADJUSTMENT', 'SALE', 'OPNAME', 'WASTE', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "public"."WarehouseMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "public"."InventoryCostMovementType" AS ENUM ('IN', 'OUT', 'ADJUST');

-- CreateEnum
CREATE TYPE "public"."InventoryCostSourceType" AS ENUM ('PURCHASE', 'OUTLET_EXPENSE', 'TRANSACTION', 'VOID_TRANSACTION', 'VOID_OUTLET_EXPENSE', 'MANUAL_ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."DepotTransferStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'VOID');

-- CreateEnum
CREATE TYPE "public"."StockOpnameKind" AS ENUM ('OPENING', 'CLOSING');

-- CreateEnum
CREATE TYPE "public"."OutletExpenseStatus" AS ENUM ('REQUESTED', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "public"."CashWithdrawalStatus" AS ENUM ('REQUESTED', 'OTP_ISSUED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'SPLIT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."UserRole" ADD VALUE 'SUPERADMIN';
ALTER TYPE "public"."UserRole" ADD VALUE 'ADMIN';
ALTER TYPE "public"."UserRole" ADD VALUE 'PURCHASING';

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "cashierFullNameSnapshot" TEXT,
ADD COLUMN     "cashierUsernameSnapshot" TEXT,
ADD COLUMN     "onlinePlatform" "public"."OnlinePlatform",
ADD COLUMN     "paymentDetails" JSONB,
ADD COLUMN     "salesChannel" "public"."SalesChannel" NOT NULL DEFAULT 'OFFLINE';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "roleId" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "branchScope" "public"."RoleBranchScope" NOT NULL DEFAULT 'SINGLE',
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PermissionModule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BranchMenuVariant" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "salesChannel" "public"."SalesChannel" NOT NULL,
    "onlinePlatform" "public"."OnlinePlatform",
    "displayName" TEXT,
    "price" INTEGER,
    "pcs" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "promoLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchMenuVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "type" "public"."InventoryItemType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPurchasable" BOOLEAN NOT NULL DEFAULT true,
    "isOpnameRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BranchInventoryItem" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "currentStock" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(18,3),
    "maxStock" DECIMAL(18,3),
    "isOpnameRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastOpnameAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WarehouseStock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "currentStock" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(18,3),
    "maxStock" DECIMAL(18,3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastAdjustmentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WarehouseMovement" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "performedById" TEXT,
    "type" "public"."WarehouseMovementType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuRecipe" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "yieldQty" DECIMAL(18,3) NOT NULL DEFAULT 1,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuRecipeItem" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "qtyPerUnit" DECIMAL(18,3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuRecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "performedById" TEXT,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemPurchaseLot" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "performedById" TEXT,
    "sourceType" "public"."InventoryCostSourceType" NOT NULL,
    "sourceId" TEXT,
    "sourceItemId" TEXT,
    "purchasedQty" DECIMAL(18,3) NOT NULL,
    "remainingQty" DECIMAL(18,3) NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPurchaseLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryCostHistory" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "itemPurchaseLotId" TEXT,
    "performedById" TEXT,
    "sourceType" "public"."InventoryCostSourceType" NOT NULL,
    "sourceId" TEXT,
    "sourceItemId" TEXT,
    "movementType" "public"."InventoryCostMovementType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unitCost" INTEGER,
    "totalCost" INTEGER NOT NULL,
    "resultingUnitCost" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCostHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutletExpense" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" INTEGER NOT NULL,
    "receiptPhotoUrl" TEXT NOT NULL,
    "note" TEXT,
    "approvalNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" "public"."OutletExpenseStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutletExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutletExpenseItem" (
    "id" TEXT NOT NULL,
    "outletExpenseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "qty" DECIMAL(18,3) NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutletExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DepotTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceWarehouseId" TEXT,
    "sourceBranchId" TEXT NOT NULL,
    "targetBranchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedCashSessionId" TEXT,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."DepotTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "approvalNote" TEXT,
    "voidReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepotTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DepotTransferItem" (
    "id" TEXT NOT NULL,
    "depotTransferId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "qty" DECIMAL(18,3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepotTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashWithdrawal" (
    "id" TEXT NOT NULL,
    "withdrawalNumber" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "issuedById" TEXT,
    "verifiedById" TEXT,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "status" "public"."CashWithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "otpHash" TEXT,
    "otpSalt" TEXT,
    "otpIssuedAt" TIMESTAMP(3),
    "otpExpiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BranchAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockOpname" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "opnameDate" TIMESTAMP(3) NOT NULL,
    "kind" "public"."StockOpnameKind" NOT NULL DEFAULT 'OPENING',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOpname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockOpnameItem" (
    "id" TEXT NOT NULL,
    "stockOpnameId" TEXT NOT NULL,
    "branchInventoryItemId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "systemQty" DECIMAL(18,3) NOT NULL,
    "countedQty" DECIMAL(18,3) NOT NULL,
    "varianceQty" DECIMAL(18,3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOpnameItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrewAttendance" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "branchId" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "branchId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "public"."Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionModule_code_key" ON "public"."PermissionModule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "public"."Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_moduleId_isActive_idx" ON "public"."Permission"("moduleId", "isActive");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_allowed_idx" ON "public"."RolePermission"("roleId", "allowed");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_allowed_idx" ON "public"."RolePermission"("permissionId", "allowed");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "public"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "BranchMenuVariant_branchId_salesChannel_onlinePlatform_isAc_idx" ON "public"."BranchMenuVariant"("branchId", "salesChannel", "onlinePlatform", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BranchMenuVariant_branchId_productId_salesChannel_onlinePla_key" ON "public"."BranchMenuVariant"("branchId", "productId", "salesChannel", "onlinePlatform");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_code_key" ON "public"."InventoryItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BranchInventoryItem_branchId_inventoryItemId_key" ON "public"."BranchInventoryItem"("branchId", "inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "public"."Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStock_warehouseId_inventoryItemId_key" ON "public"."WarehouseStock"("warehouseId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "WarehouseMovement_warehouseId_inventoryItemId_createdAt_idx" ON "public"."WarehouseMovement"("warehouseId", "inventoryItemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenuRecipe_productId_key" ON "public"."MenuRecipe"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuRecipeItem_recipeId_inventoryItemId_key" ON "public"."MenuRecipeItem"("recipeId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_branchId_inventoryItemId_createdAt_idx" ON "public"."InventoryMovement"("branchId", "inventoryItemId", "createdAt");

-- CreateIndex
CREATE INDEX "ItemPurchaseLot_branchId_inventoryItemId_isActive_idx" ON "public"."ItemPurchaseLot"("branchId", "inventoryItemId", "isActive");

-- CreateIndex
CREATE INDEX "ItemPurchaseLot_sourceType_sourceId_idx" ON "public"."ItemPurchaseLot"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ItemPurchaseLot_performedById_createdAt_idx" ON "public"."ItemPurchaseLot"("performedById", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryCostHistory_branchId_inventoryItemId_createdAt_idx" ON "public"."InventoryCostHistory"("branchId", "inventoryItemId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryCostHistory_sourceType_sourceId_idx" ON "public"."InventoryCostHistory"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "InventoryCostHistory_itemPurchaseLotId_idx" ON "public"."InventoryCostHistory"("itemPurchaseLotId");

-- CreateIndex
CREATE INDEX "InventoryCostHistory_performedById_createdAt_idx" ON "public"."InventoryCostHistory"("performedById", "createdAt");

-- CreateIndex
CREATE INDEX "OutletExpense_branchId_expenseDate_idx" ON "public"."OutletExpense"("branchId", "expenseDate");

-- CreateIndex
CREATE INDEX "OutletExpense_cashSessionId_idx" ON "public"."OutletExpense"("cashSessionId");

-- CreateIndex
CREATE INDEX "OutletExpense_createdById_idx" ON "public"."OutletExpense"("createdById");

-- CreateIndex
CREATE INDEX "OutletExpenseItem_outletExpenseId_idx" ON "public"."OutletExpenseItem"("outletExpenseId");

-- CreateIndex
CREATE INDEX "OutletExpenseItem_inventoryItemId_idx" ON "public"."OutletExpenseItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DepotTransfer_transferNumber_key" ON "public"."DepotTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "DepotTransfer_sourceBranchId_transferDate_idx" ON "public"."DepotTransfer"("sourceBranchId", "transferDate");

-- CreateIndex
CREATE INDEX "DepotTransfer_sourceWarehouseId_transferDate_idx" ON "public"."DepotTransfer"("sourceWarehouseId", "transferDate");

-- CreateIndex
CREATE INDEX "DepotTransfer_targetBranchId_transferDate_idx" ON "public"."DepotTransfer"("targetBranchId", "transferDate");

-- CreateIndex
CREATE INDEX "DepotTransfer_status_transferDate_idx" ON "public"."DepotTransfer"("status", "transferDate");

-- CreateIndex
CREATE INDEX "DepotTransfer_approvedCashSessionId_idx" ON "public"."DepotTransfer"("approvedCashSessionId");

-- CreateIndex
CREATE INDEX "DepotTransferItem_depotTransferId_idx" ON "public"."DepotTransferItem"("depotTransferId");

-- CreateIndex
CREATE INDEX "DepotTransferItem_inventoryItemId_idx" ON "public"."DepotTransferItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CashWithdrawal_withdrawalNumber_key" ON "public"."CashWithdrawal"("withdrawalNumber");

-- CreateIndex
CREATE INDEX "CashWithdrawal_branchId_createdAt_idx" ON "public"."CashWithdrawal"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "CashWithdrawal_cashSessionId_status_idx" ON "public"."CashWithdrawal"("cashSessionId", "status");

-- CreateIndex
CREATE INDEX "CashWithdrawal_requestedById_status_idx" ON "public"."CashWithdrawal"("requestedById", "status");

-- CreateIndex
CREATE INDEX "CashWithdrawal_issuedById_status_idx" ON "public"."CashWithdrawal"("issuedById", "status");

-- CreateIndex
CREATE INDEX "BranchAssignment_userId_isActive_idx" ON "public"."BranchAssignment"("userId", "isActive");

-- CreateIndex
CREATE INDEX "BranchAssignment_branchId_isActive_idx" ON "public"."BranchAssignment"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "StockOpname_performedById_opnameDate_idx" ON "public"."StockOpname"("performedById", "opnameDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockOpname_branchId_opnameDate_kind_key" ON "public"."StockOpname"("branchId", "opnameDate", "kind");

-- CreateIndex
CREATE INDEX "StockOpnameItem_stockOpnameId_idx" ON "public"."StockOpnameItem"("stockOpnameId");

-- CreateIndex
CREATE INDEX "CrewAttendance_branchId_attendanceDate_idx" ON "public"."CrewAttendance"("branchId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "CrewAttendance_userId_attendanceDate_key" ON "public"."CrewAttendance"("userId", "attendanceDate");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_branchId_createdAt_idx" ON "public"."AuditLog"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_createdAt_idx" ON "public"."AuditLog"("performedById", "createdAt");

-- CreateIndex
CREATE INDEX "SystemSetting_key_scope_branchId_idx" ON "public"."SystemSetting"("key", "scope", "branchId");

-- CreateIndex
CREATE INDEX "SystemSetting_scope_isActive_idx" ON "public"."SystemSetting"("scope", "isActive");

-- CreateIndex
CREATE INDEX "SystemSetting_branchId_idx" ON "public"."SystemSetting"("branchId");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_scope_branchId_idx" ON "public"."FeatureFlag"("key", "scope", "branchId");

-- CreateIndex
CREATE INDEX "FeatureFlag_scope_enabled_idx" ON "public"."FeatureFlag"("scope", "enabled");

-- CreateIndex
CREATE INDEX "FeatureFlag_branchId_idx" ON "public"."FeatureFlag"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_roleId_isActive_idx" ON "public"."User"("roleId", "isActive");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permission" ADD CONSTRAINT "Permission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."PermissionModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchMenuVariant" ADD CONSTRAINT "BranchMenuVariant_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchMenuVariant" ADD CONSTRAINT "BranchMenuVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchInventoryItem" ADD CONSTRAINT "BranchInventoryItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchInventoryItem" ADD CONSTRAINT "BranchInventoryItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Warehouse" ADD CONSTRAINT "Warehouse_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseStock" ADD CONSTRAINT "WarehouseStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseStock" ADD CONSTRAINT "WarehouseStock_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuRecipe" ADD CONSTRAINT "MenuRecipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuRecipeItem" ADD CONSTRAINT "MenuRecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."MenuRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuRecipeItem" ADD CONSTRAINT "MenuRecipeItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemPurchaseLot" ADD CONSTRAINT "ItemPurchaseLot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemPurchaseLot" ADD CONSTRAINT "ItemPurchaseLot_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemPurchaseLot" ADD CONSTRAINT "ItemPurchaseLot_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryCostHistory" ADD CONSTRAINT "InventoryCostHistory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryCostHistory" ADD CONSTRAINT "InventoryCostHistory_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryCostHistory" ADD CONSTRAINT "InventoryCostHistory_itemPurchaseLotId_fkey" FOREIGN KEY ("itemPurchaseLotId") REFERENCES "public"."ItemPurchaseLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryCostHistory" ADD CONSTRAINT "InventoryCostHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutletExpense" ADD CONSTRAINT "OutletExpense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutletExpense" ADD CONSTRAINT "OutletExpense_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutletExpense" ADD CONSTRAINT "OutletExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutletExpense" ADD CONSTRAINT "OutletExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutletExpenseItem" ADD CONSTRAINT "OutletExpenseItem_outletExpenseId_fkey" FOREIGN KEY ("outletExpenseId") REFERENCES "public"."OutletExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutletExpenseItem" ADD CONSTRAINT "OutletExpenseItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransfer" ADD CONSTRAINT "DepotTransfer_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransfer" ADD CONSTRAINT "DepotTransfer_sourceBranchId_fkey" FOREIGN KEY ("sourceBranchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransfer" ADD CONSTRAINT "DepotTransfer_targetBranchId_fkey" FOREIGN KEY ("targetBranchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransfer" ADD CONSTRAINT "DepotTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransfer" ADD CONSTRAINT "DepotTransfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransfer" ADD CONSTRAINT "DepotTransfer_approvedCashSessionId_fkey" FOREIGN KEY ("approvedCashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransferItem" ADD CONSTRAINT "DepotTransferItem_depotTransferId_fkey" FOREIGN KEY ("depotTransferId") REFERENCES "public"."DepotTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepotTransferItem" ADD CONSTRAINT "DepotTransferItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashWithdrawal" ADD CONSTRAINT "CashWithdrawal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashWithdrawal" ADD CONSTRAINT "CashWithdrawal_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashWithdrawal" ADD CONSTRAINT "CashWithdrawal_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashWithdrawal" ADD CONSTRAINT "CashWithdrawal_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashWithdrawal" ADD CONSTRAINT "CashWithdrawal_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchAssignment" ADD CONSTRAINT "BranchAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchAssignment" ADD CONSTRAINT "BranchAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockOpname" ADD CONSTRAINT "StockOpname_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockOpname" ADD CONSTRAINT "StockOpname_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockOpnameItem" ADD CONSTRAINT "StockOpnameItem_stockOpnameId_fkey" FOREIGN KEY ("stockOpnameId") REFERENCES "public"."StockOpname"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockOpnameItem" ADD CONSTRAINT "StockOpnameItem_branchInventoryItemId_fkey" FOREIGN KEY ("branchInventoryItemId") REFERENCES "public"."BranchInventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockOpnameItem" ADD CONSTRAINT "StockOpnameItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrewAttendance" ADD CONSTRAINT "CrewAttendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrewAttendance" ADD CONSTRAINT "CrewAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemSetting" ADD CONSTRAINT "SystemSetting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureFlag" ADD CONSTRAINT "FeatureFlag_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

