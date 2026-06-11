const prisma = require("../../core/config/prisma");

const PAYMENT_METHODS = ["CASH", "QRIS", "SPLIT", "GOFOOD", "GRABFOOD", "SHOPEEFOOD"];
const SALES_CHANNELS = ["OFFLINE", "ONLINE"];
const ONLINE_PLATFORMS = ["GOFOOD", "GRABFOOD", "SHOPEEFOOD"];
const INVENTORY_ITEM_TYPES = ["RAW_MATERIAL", "PACKAGING", "UTILITY", "SUPPLY"];

exports.getReferenceData = async () => {
  const [inventoryUnits, productCategories, branches, roles] = await Promise.all([
    prisma.inventoryItem.findMany({
      distinct: ["unit"],
      select: {
        unit: true,
      },
      orderBy: {
        unit: "asc",
      },
    }),
    prisma.productCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        sortOrder: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.role.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        branchScope: true,
        isSystem: true,
      },
      orderBy: [
        { isSystem: "desc" },
        { name: "asc" },
      ],
    }),
  ]);

  return {
    enums: {
      paymentMethods: PAYMENT_METHODS,
      salesChannels: SALES_CHANNELS,
      onlinePlatforms: ONLINE_PLATFORMS,
      inventoryItemTypes: INVENTORY_ITEM_TYPES,
      userRoles: roles.map((role) => role.code),
    },
    inventoryUnits: inventoryUnits.map((row) => row.unit).filter(Boolean),
    productCategories,
    branches,
    roles,
  };
};
