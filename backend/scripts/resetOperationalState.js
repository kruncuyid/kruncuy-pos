const prisma = require("../src/core/config/prisma");

async function main() {
  const summary = {
    transactionItems: await prisma.transactionItem.count(),
    transactions: await prisma.transaction.count(),
    outletExpenseItems: await prisma.outletExpenseItem.count(),
    outletExpenses: await prisma.outletExpense.count(),
    stockOpnameItems: await prisma.stockOpnameItem.count(),
    stockOpnames: await prisma.stockOpname.count(),
    depotTransferItems: await prisma.depotTransferItem.count(),
    depotTransfers: await prisma.depotTransfer.count(),
    inventoryMovements: await prisma.inventoryMovement.count(),
    warehouseMovements: await prisma.warehouseMovement.count(),
    itemPurchaseLots: await prisma.itemPurchaseLot.count(),
    inventoryCostHistories: await prisma.inventoryCostHistory.count(),
    crewAttendances: await prisma.crewAttendance.count(),
    cashSessions: await prisma.cashSession.count(),
  };

  await prisma.$transaction(async (tx) => {
    await tx.inventoryCostHistory.deleteMany({});
    await tx.itemPurchaseLot.deleteMany({});
    await tx.warehouseMovement.deleteMany({});
    await tx.inventoryMovement.deleteMany({});

    await tx.outletExpenseItem.deleteMany({});
    await tx.outletExpense.deleteMany({});

    await tx.transactionItem.deleteMany({});
    await tx.transaction.deleteMany({});

    await tx.stockOpnameItem.deleteMany({});
    await tx.stockOpname.deleteMany({});

    await tx.depotTransferItem.deleteMany({});
    await tx.depotTransfer.deleteMany({});

    await tx.crewAttendance.deleteMany({});
    await tx.cashSession.deleteMany({});
  });

  const remaining = {
    transactionItems: await prisma.transactionItem.count(),
    transactions: await prisma.transaction.count(),
    outletExpenseItems: await prisma.outletExpenseItem.count(),
    outletExpenses: await prisma.outletExpense.count(),
    stockOpnameItems: await prisma.stockOpnameItem.count(),
    stockOpnames: await prisma.stockOpname.count(),
    depotTransferItems: await prisma.depotTransferItem.count(),
    depotTransfers: await prisma.depotTransfer.count(),
    inventoryMovements: await prisma.inventoryMovement.count(),
    warehouseMovements: await prisma.warehouseMovement.count(),
    itemPurchaseLots: await prisma.itemPurchaseLot.count(),
    inventoryCostHistories: await prisma.inventoryCostHistory.count(),
    crewAttendances: await prisma.crewAttendance.count(),
    cashSessions: await prisma.cashSession.count(),
  };

  console.log(JSON.stringify({ summary, remaining }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
