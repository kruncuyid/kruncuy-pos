const crypto = require("crypto");
const prisma = require("../../core/config/prisma");
const accessControlService = require("../../core/services/accessControl.service");

function generateInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `KR-${date}-${random}`;
}

function resolveBranchId(user, branchContext) {
  return branchContext?.branchId || user.branchId || null;
}

async function buildBranchWhere(user, branchContext) {
  const branchId = resolveBranchId(user, branchContext);
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(user.role);

  if (hasGlobalAccess && !branchId) {
    return {};
  }

  if (!branchId) {
    return {};
  }

  return { branchId };
}

function normalizePaymentPayload(payload = {}, salesChannel) {
  const paymentDetails = payload.paymentDetails || null;
  const onlinePlatform = payload.onlinePlatform || null;

  let paymentMethod = payload.paymentMethod || "CASH";

  if (salesChannel === "ONLINE" && onlinePlatform) {
    paymentMethod = onlinePlatform;
  }

  return {
    paymentMethod,
    paymentDetails,
    onlinePlatform,
  };
}

async function applyRecipeConsumption(
  tx,
  branchId,
  preparedItems,
  type = "SALE",
  referenceType = "TRANSACTION",
  referenceId = null,
  performedById = null,
  direction = -1
) {
  const productIds = preparedItems.map((item) => item.productId);

  const recipes = await tx.menuRecipe.findMany({
    where: {
      productId: {
        in: productIds,
      },
      isActive: true,
    },
    include: {
      items: true,
    },
  });

  const recipeMap = new Map(recipes.map((recipe) => [recipe.productId, recipe]));

  // Recursively resolve all sub-recipes to get needed inventory items
  async function resolveSubRecipeItems(recipeItems, multiplier) {
    const consumptions = []; // [{ inventoryItemId, qty }]
    for (const item of recipeItems) {
      const qty = Number(item.qtyPerUnit || 0) * multiplier;
      if (!qty) continue;

      if (item.subRecipeId) {
        // Resolve sub-recipe recursively
        const subRecipe = await tx.menuRecipe.findUnique({
          where: { id: item.subRecipeId },
          include: { items: true },
        });
        if (subRecipe?.items?.length) {
          const subItems = await resolveSubRecipeItems(subRecipe.items, qty);
          consumptions.push(...subItems);
        }
      } else if (item.inventoryItemId) {
        consumptions.push({ inventoryItemId: item.inventoryItemId, qty });
      }
    }
    return consumptions;
  }

  // Resolve all consumptions for all sale items
  const allConsumptions = [];
  for (const saleItem of preparedItems) {
    const recipe = recipeMap.get(saleItem.productId);
    if (!recipe) continue;
    const saleQty = Number(saleItem.qty || 0);
    const items = await resolveSubRecipeItems(recipe.items, saleQty);
    allConsumptions.push(...items);
  }

  if (!allConsumptions.length) return;

  // Batch resolve inventory items
  const neededIds = [...new Set(allConsumptions.map(c => c.inventoryItemId))];
  const branchInventoryItems = await tx.branchInventoryItem.findMany({
    where: { branchId, inventoryItemId: { in: neededIds }, isActive: true },
  });
  const branchInventoryMap = new Map(branchInventoryItems.map(i => [i.inventoryItemId, i]));

  // Apply consumptions
  for (const { inventoryItemId, qty } of allConsumptions) {
    const stockItem = branchInventoryMap.get(inventoryItemId);
    if (!stockItem) continue;

    const consumedQty = qty * direction;
    await tx.branchInventoryItem.update({
      where: { id: stockItem.id },
      data: { currentStock: direction < 0 ? { decrement: qty } : { increment: qty } },
    });
    await tx.inventoryMovement.create({
      data: {
        branchId, inventoryItemId, performedById, type,
        quantity: consumedQty, referenceType, referenceId,
        notes: `Auto ${referenceType.toLowerCase()}`,
      },
    });
  }
}

exports.getTransactions = async (user, branchContext, query = {}) => {
  const branchWhere = await buildBranchWhere(user, branchContext);
  const { parsePagination } = require("../../core/utils/pagination");
  const { page, limit, skip } = parsePagination(query);

  const where = {
    ...branchWhere,
    ...(query.status ? { status: query.status } : {}),
    ...(query.startDate || query.endDate ? {
      createdAt: {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      },
    } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, invoiceNumber: true, totalAmount: true, totalPcs: true,
        paymentMethod: true, salesChannel: true, onlinePlatform: true,
        status: true, createdAt: true,
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: {
          select: { id: true, productName: true, qty: true, price: true, pcs: true, subtotal: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

exports.getTodayTransactions = async (user, branchContext, options = {}) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const branchWhere = await buildBranchWhere(user, branchContext);

  return prisma.transaction.findMany({
    where: {
      ...branchWhere,
      ...(options.includeVoid ? {} : { status: "COMPLETED" }),
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      branch: true,
      cashier: true,
      cashSession: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.getTransactionById = async (id, user, branchContext) => {
  const branchWhere = await buildBranchWhere(user, branchContext);

  return prisma.transaction.findFirst({
    where: {
      id,
      ...branchWhere,
    },
    include: {
      branch: true,
      cashier: true,
      cashSession: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

exports.createTransaction = async (user, payload, branchContext) => {
  const items = payload.items || [];

  if (!items.length) {
    const error = new Error("Item transaksi tidak boleh kosong");
    error.statusCode = 400;
    throw error;
  }

  const branchId = resolveBranchId(user, branchContext);
  const salesChannel = payload.salesChannel || "OFFLINE";
  const onlinePlatform = payload.onlinePlatform || null;
  const payment = normalizePaymentPayload(payload, salesChannel);
  const actor =
    user?.username && user?.nickname !== undefined
      ? user
      : await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            username: true,
            nickname: true,
            branchId: true,
          },
        });

  if (salesChannel === "ONLINE" && !onlinePlatform) {
    const error = new Error("Platform online wajib dipilih");
    error.statusCode = 400;
    throw error;
  }

  if (!branchId) {
    const error = new Error("Branch transaksi belum dipilih");
    error.statusCode = 400;
    throw error;
  }

  const activeSession = await prisma.cashSession.findFirst({
    where: {
      userId: user.id,
      branchId,
      status: "OPEN",
    },
  });

  if (!activeSession) {
    const error = new Error("Shift belum dimulai. Silakan mulai shift dulu.");
    error.statusCode = 400;
    throw error;
  }

  const productIds = items.map((item) => item.productId);

  const branchProducts = await prisma.branchProduct.findMany({
    where: {
      branchId,
      productId: {
        in: productIds,
      },
      isActive: true,
      isAvailable: true,
      product: {
        isActive: true,
      },
    },
    include: {
      product: true,
    },
  });

  const branchProductMap = new Map(
    branchProducts.map((branchProduct) => [branchProduct.productId, branchProduct])
  );

  const preparedItems = items.map((item) => {
    const branchProduct = branchProductMap.get(item.productId);

    if (!branchProduct) {
      const error = new Error(`Produk tidak tersedia di branch ini: ${item.productId}`);
      error.statusCode = 404;
      throw error;
    }

    const qty = Number(item.qty || 1);
    const price = Number(item.price ?? branchProduct.price);
    const pcs = Number(item.pcs ?? branchProduct.product.pcs);
    const subtotal = qty * price;

    return {
      productId: branchProduct.productId,
      productName: branchProduct.product.name,
      qty,
      price,
      pcs,
      subtotal,
    };
  });

  if (salesChannel === "ONLINE") {
    const onlineVariants = await prisma.branchMenuVariant.findMany({
      where: {
        branchId,
        salesChannel: "ONLINE",
        onlinePlatform,
        isActive: true,
        isAvailable: true,
        productId: {
          in: productIds,
        },
      },
    });

    const variantMap = new Map(
      onlineVariants.map((variant) => [variant.productId, variant])
    );

    for (const item of preparedItems) {
      const variant = variantMap.get(item.productId);
      if (!variant) {
        const error = new Error(`Menu tidak tersedia pada platform ${onlinePlatform}: ${item.productId}`);
        error.statusCode = 404;
        throw error;
      }

      if (variant.displayName) {
        item.productName = variant.displayName;
      }

      if (variant.price !== null && variant.price !== undefined) {
        item.price = Number(variant.price);
        item.subtotal = item.qty * item.price;
      }

      if (
        variant.pcs !== null &&
        variant.pcs !== undefined &&
        Number(variant.pcs) > 0
      ) {
        item.pcs = Number(variant.pcs);
      }
    }
  }

  const totalAmount = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalPcs = preparedItems.reduce((sum, item) => sum + item.qty * item.pcs, 0);

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        branchId,
        cashierId: user.id,
        cashierUsernameSnapshot: actor?.username || null,
        cashierFullNameSnapshot: actor?.nickname ? `${actor.nickname} (${actor.name})` : actor?.name || null,
        cashSessionId: activeSession.id,
        totalAmount,
        totalPcs,
        salesChannel,
        onlinePlatform,
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment.paymentDetails,
        status: "COMPLETED",
        items: {
          create: preparedItems,
        },
      },
      include: {
        branch: true,
        cashier: true,
        cashSession: true,
        items: true,
      },
    });

    await applyRecipeConsumption(
      tx,
      branchId,
      preparedItems,
      "SALE",
      "TRANSACTION",
      transaction.id,
      user.id,
      -1
    );

    return transaction;
  });
};

const VOID_REASONS = ["SALAH_INPUT", "CANCEL", "REFUND", "OTHER"];
const VALID_REASONS = new Set(VOID_REASONS);

exports.voidTransaction = async (id, payload, user, branchContext) => {
  const transaction = await exports.getTransactionById(id, user, branchContext);

  if (!transaction) {
    const error = new Error("Transaksi tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (transaction.status === "VOID") {
    return transaction;
  }

  // Validasi reason
  const reason = payload.reason || "";
  if (!VALID_REASONS.has(reason) && reason !== "OTHER") {
    const e = new Error("Alasan void wajib dipilih: SALAH_INPUT / CANCEL / REFUND / OTHER");
    e.statusCode = 400; throw e;
  }

  // Threshold check: void > threshold butuh manager
  const amount = Number(transaction.totalAmount || 0);
  const voidThreshold = Number(process.env.VOID_THRESHOLD || 100000);
  const isBelowThreshold = amount <= voidThreshold;
  const isManager = ["SUPERADMIN", "OWNER", "ADMIN"].includes(user.role);

  if (!isBelowThreshold && !isManager) {
    // Cek apakah sudah di-approve manager
    if (payload.managerApproval !== true) {
      const e = new Error(`Void > Rp ${voidThreshold.toLocaleString()} memerlukan persetujuan manajer. Login dengan akun ADMIN/OWNER.`);
      e.statusCode = 403; throw e;
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        status: "VOID",
        voidReason: reason,
        voidedAt: new Date(),
      },
    });

    const items = await tx.transactionItem.findMany({
      where: { transactionId: id },
      include: {
        product: true,
      },
    });

    const preparedItems = items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      qty: item.qty,
      price: item.price,
      pcs: item.pcs,
      subtotal: item.subtotal,
    }));

    await applyRecipeConsumption(
      tx,
      transaction.branchId,
      preparedItems,
      "ADJUSTMENT",
      "VOID_TRANSACTION",
      transaction.id,
      user.id,
      1
    );

    return updated;
  });
};
