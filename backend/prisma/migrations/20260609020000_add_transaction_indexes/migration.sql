-- CreateIndex
CREATE INDEX "Transaction_branchId_createdAt_status_idx" ON "public"."Transaction"("branchId", "createdAt", "status");

-- CreateIndex
CREATE INDEX "Transaction_cashierId_createdAt_idx" ON "public"."Transaction"("cashierId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_cashSessionId_idx" ON "public"."Transaction"("cashSessionId");

