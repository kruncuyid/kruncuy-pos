/*
  Warnings:

  - The primary key for the `BranchProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `BranchProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."BranchProduct" DROP CONSTRAINT "BranchProduct_pkey",
DROP COLUMN "id";

-- CreateIndex
CREATE INDEX "Branch_isActive_idx" ON "public"."Branch"("isActive");

-- CreateIndex
CREATE INDEX "InventoryItem_isActive_idx" ON "public"."InventoryItem"("isActive");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "public"."Product"("isActive");
