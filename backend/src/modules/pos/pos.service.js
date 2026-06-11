const transactionService = require("../transactions/transaction.service");
const cashSessionService = require("../cash-sessions/cashSession.service");
const prisma = require("../../core/config/prisma");

function resolveBranchId(user, branchContext) {
  return branchContext?.branchId || user.branchId || null;
}

async function getCatalog(user, branchContext, query = {}) {
  const branchId = resolveBranchId(user, branchContext);
  const salesChannel = query.channel === "ONLINE" ? "ONLINE" : "OFFLINE";
  const onlinePlatform = salesChannel === "ONLINE" ? query.platform || null : null;

  if (salesChannel === "ONLINE" && !onlinePlatform) {
    const error = new Error("Platform online wajib dipilih");
    error.statusCode = 400;
    throw error;
  }

  const categories = await prisma.productCategory.findMany({
    where: {
      isActive: true,
    },
    include: {
      products: {
        where: {
          isActive: true,
        },
        include: {
          branchProducts: {
            where: {
              branchId,
              isActive: true,
              isAvailable: true,
            },
          },
          branchMenuVariants: {
            where: {
              branchId,
              salesChannel,
              ...(onlinePlatform ? { onlinePlatform } : {}),
              isActive: true,
              isAvailable: true,
            },
          },
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const normalizedCategories = categories
    .map((category) => {
      const products = category.products
        .map((product) => {
          const offlineVariant = product.branchProducts[0];
          const channelVariant = product.branchMenuVariants[0];

          if (salesChannel === "ONLINE" && !channelVariant) {
            return null;
          }

          const price =
            channelVariant?.price ??
            offlineVariant?.price ??
            product.price;
          const pcs =
            channelVariant?.pcs !== null &&
            channelVariant?.pcs !== undefined &&
            Number(channelVariant.pcs) > 0
              ? Number(channelVariant.pcs)
              : product.pcs;

          return {
            id: product.id,
            code: product.code,
            name: channelVariant?.displayName || product.name,
            price,
            pcs,
            categoryId: product.categoryId,
            category: {
              id: category.id,
              name: category.name,
              code: category.code,
            },
            promoLabel: channelVariant?.promoLabel || null,
            salesChannel,
            onlinePlatform,
          };
        })
        .filter(Boolean);

      return {
        id: category.id,
        name: category.name,
        code: category.code,
        products,
      };
    })
    .filter((category) => category.products.length > 0);

  return {
    branchId,
    salesChannel,
    onlinePlatform,
    categories: normalizedCategories,
  };
}

exports.getSummary = async (user, branchContext) => {
  const activeSession = await cashSessionService.getActiveSession(
    user,
    branchContext
  );
  const transactions = await transactionService.getTodayTransactions(
    user,
    branchContext
  );

  const completedTransactions = transactions.filter(
    (trx) => trx.status === "COMPLETED"
  );

  const totalSales = completedTransactions.reduce(
    (sum, trx) => sum + trx.totalAmount,
    0
  );

  const totalPcs = completedTransactions.reduce(
    (sum, trx) => sum + trx.totalPcs,
    0
  );

  const cashSales = completedTransactions
    .filter((trx) => trx.paymentMethod === "CASH")
    .reduce((sum, trx) => sum + trx.totalAmount, 0);

  const qrisSales = completedTransactions
    .filter((trx) => trx.paymentMethod === "QRIS")
    .reduce((sum, trx) => sum + trx.totalAmount, 0);

  const gofoodSales = completedTransactions
    .filter((trx) => trx.paymentMethod === "GOFOOD")
    .reduce((sum, trx) => sum + trx.totalAmount, 0);

  const grabfoodSales = completedTransactions
    .filter((trx) => trx.paymentMethod === "GRABFOOD")
    .reduce((sum, trx) => sum + trx.totalAmount, 0);

  const shopeefoodSales = completedTransactions
    .filter((trx) => trx.paymentMethod === "SHOPEEFOOD")
    .reduce((sum, trx) => sum + trx.totalAmount, 0);

  let targetPcs = 450;
  try {
    const setting = await prisma.systemSetting.findFirst({
      where: { key: "pos_target_pcs" },
      orderBy: { updatedAt: "desc" },
    });
    if (setting?.value) {
      const numeric = Number(setting.value);
      if (Number.isFinite(numeric)) targetPcs = numeric;
    }
  } catch { /* default */ }

  return {
    activeSession,
    totalTransactions: completedTransactions.length,
    totalSales,
    totalPcs,
    targetPcs,
    remainingTarget: Math.max(targetPcs - totalPcs, 0),
    paymentSummary: {
      CASH: cashSales,
      QRIS: qrisSales,
      GOFOOD: gofoodSales,
      GRABFOOD: grabfoodSales,
      SHOPEEFOOD: shopeefoodSales,
    },
  };
};

exports.checkout = async (user, payload, branchContext) => {
  return transactionService.createTransaction(user, payload, branchContext);
};

exports.getCatalog = async (user, branchContext, query) => {
  return getCatalog(user, branchContext, query);
};
