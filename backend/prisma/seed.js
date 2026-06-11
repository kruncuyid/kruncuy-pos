const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");
const accessControlService = require("../src/core/services/accessControl.service");

const prisma = new PrismaClient();

async function main() {
  console.log("Mulai seed KRUNCUY POS...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const ownerPassword = await bcrypt.hash("owner@2026", 10);
  const crewPassword = await bcrypt.hash("crew@2026", 10);
  const purchasingPassword = await bcrypt.hash("purch@2026", 10);

  // =========================
  // 1. Branch
  // =========================
  const branch = await prisma.branch.upsert({
    where: {
      code: "GONDOKUSUMAN",
    },
    update: {},
    create: {
      name: "KRUNCUY Gondokusuman",
      code: "GONDOKUSUMAN",
      address: "Depan Kantor Kecamatan Gondokusuman",
      lat: -7.8018,
      lng: 110.3647,
      isActive: true,
    },
  });

  const secondBranch = await prisma.branch.upsert({
    where: {
      code: "TUGU",
    },
    update: {},
    create: {
      name: "KRUNCUY Tugu",
      code: "TUGU",
      address: "Dekat area Tugu Yogyakarta",
      lat: -7.7828,
      lng: 110.3672,
      isActive: true,
    },
  });

  const extraBranches = [
    {
      code: "MANTRIJERON",
      name: "KRUNCUY Mantrijeron",
      address: "Outlet KRUNCUY area Mantrijeron",
      lat: -7.8142,
      lng: 110.3589,
    },
    {
      code: "UMBULHARJO",
      name: "KRUNCUY Umbulharjo",
      address: "Outlet KRUNCUY area Umbulharjo",
      lat: -7.8128,
      lng: 110.3742,
    },
    {
      code: "MINGGIR",
      name: "KRUNCUY Minggir",
      address: "Outlet KRUNCUY area Minggir",
      lat: -7.7247,
      lng: 110.2442,
    },
    {
      code: "DEPOK",
      name: "KRUNCUY Depok",
      address: "Outlet KRUNCUY area Depok",
      lat: -7.7967,
      lng: 110.4153,
    },
    {
      code: "KOTAGEDE",
      name: "KRUNCUY Kotagede",
      address: "Outlet KRUNCUY area Kotagede",
      lat: -7.8269,
      lng: 110.3997,
    },
    {
      code: "NGAGLIK",
      name: "KRUNCUY Ngaglik",
      address: "Outlet KRUNCUY area Ngaglik",
      lat: -7.7125,
      lng: 110.3819,
    },
    {
      code: "GEDONGTENGEN",
      name: "KRUNCUY Gedongtengen",
      address: "Outlet KRUNCUY area Gedongtengen",
      lat: -7.7908,
      lng: 110.3586,
    },
    {
      code: "JETIS",
      name: "KRUNCUY Jetis",
      address: "Outlet KRUNCUY area Jetis",
      lat: -7.7936,
      lng: 110.3708,
    },
  ];

  const extraBranchRecords = [];

  for (const item of extraBranches) {
    const record = await prisma.branch.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
        isActive: true,
      },
      create: {
        name: item.name,
        code: item.code,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
        isActive: true,
      },
    });

    extraBranchRecords.push(record);
  }

  const allBranches = [branch, secondBranch, ...extraBranchRecords];

  const depotWarehouse = await prisma.warehouse.upsert({
    where: {
      code: "DEPOT_GONDOKUSUMAN",
    },
    update: {
      name: "Depo Gondokusuman",
      address: "Depo pusat KRUNCUY area Gondokusuman",
      branchId: branch.id,
      isActive: true,
    },
    create: {
      name: "Depo Gondokusuman",
      code: "DEPOT_GONDOKUSUMAN",
      address: "Depo pusat KRUNCUY area Gondokusuman",
      branchId: branch.id,
      isActive: true,
    },
  });

  // =========================
  // 2. Users
  // =========================
  await accessControlService.syncDefaultAccessCatalog({
    resetRolePermissions: true,
  });
  const roleRecords = await prisma.role.findMany();
  const roleByCode = Object.fromEntries(roleRecords.map((role) => [role.code, role]));

  const usernameFromEmail = (email) => String(email || "").split("@")[0].trim().toLowerCase().replace(/\s+/g, "");

  const superAdmin = await prisma.user.upsert({
    where: {
      email: "admin@kruncuy.id",
    },
    update: {
      username: "admin",
      nickname: "Super Admin",
      password: adminPassword,
      role: "SUPERADMIN",
      roleId: roleByCode.SUPERADMIN?.id || null,
      branchId: branch.id,
    },
    create: {
      name: "ERP Super Admin",
      username: "admin",
      nickname: "Super Admin",
      email: "admin@kruncuy.id",
      password: adminPassword,
      role: "SUPERADMIN",
      roleId: roleByCode.SUPERADMIN?.id || null,
      branchId: branch.id,
      isActive: true,
    },
  });

  const erpAdmin = await prisma.user.upsert({
    where: {
      email: "owner@kruncuy.id",
    },
    update: {
      username: "owner",
      nickname: "ERP Admin",
      password: ownerPassword,
      role: "OWNER",
      roleId: roleByCode.OWNER?.id || null,
      branchId: branch.id,
    },
    create: {
      name: "ERP Admin KRUNCUY",
      username: "owner",
      nickname: "ERP Admin",
      email: "owner@kruncuy.id",
      password: ownerPassword,
      role: "OWNER",
      roleId: roleByCode.OWNER?.id || null,
      branchId: branch.id,
      isActive: true,
    },
  });

  const crew = await prisma.user.upsert({
    where: {
      email: "crew@kruncuy.id",
    },
    update: {
      username: "crew",
      nickname: "Crew Gondokusuman",
      password: crewPassword,
      role: "CREW",
      roleId: roleByCode.CREW?.id || null,
      branchId: branch.id,
    },
    create: {
      name: "Crew Gondokusuman",
      username: "crew",
      nickname: "Crew Gondokusuman",
      email: "crew@kruncuy.id",
      password: crewPassword,
      role: "CREW",
      roleId: roleByCode.CREW?.id || null,
      branchId: branch.id,
      isActive: true,
    },
  });

  const extraCrewDefinitions = [
    { name: "Crew A", email: "crew-a@kruncuy.id" },
    { name: "Crew B", email: "crew-b@kruncuy.id" },
    { name: "Crew C", email: "crew-c@kruncuy.id" },
    { name: "Crew D", email: "crew-d@kruncuy.id" },
    { name: "Crew E", email: "crew-e@kruncuy.id" },
    { name: "Crew F", email: "crew-f@kruncuy.id" },
    { name: "Crew G", email: "crew-g@kruncuy.id" },
    { name: "Crew H", email: "crew-h@kruncuy.id" },
    { name: "Crew I", email: "crew-i@kruncuy.id" },
    { name: "Crew J", email: "crew-j@kruncuy.id" },
  ];

  const extraCrewRecords = [];

  // Purchasing test user
  const purchasingUser = await prisma.user.upsert({
    where: { email: "purchasing@kruncuy.id" },
    update: {
      username: "purchasing",
      nickname: "Staff Purchasing",
      password: purchasingPassword,
      role: "PURCHASING",
      roleId: roleByCode.PURCHASING?.id || null,
      branchId: branch.id,
    },
    create: {
      name: "Staff Purchasing KRUNCUY",
      username: "purchasing",
      nickname: "Staff Purchasing",
      email: "purchasing@kruncuy.id",
      password: purchasingPassword,
      role: "PURCHASING",
      roleId: roleByCode.PURCHASING?.id || null,
      branchId: branch.id,
      isActive: true,
    },
  });

  for (const item of extraCrewDefinitions) {
    const record = await prisma.user.upsert({
      where: {
        email: item.email,
      },
      update: {
        name: item.name,
        username: usernameFromEmail(item.email),
        nickname: item.name,
        password: crewPassword,
        role: "CREW",
        roleId: roleByCode.CREW?.id || null,
        branchId: null,
        isActive: true,
      },
      create: {
        name: item.name,
        username: usernameFromEmail(item.email),
        nickname: item.name,
        email: item.email,
        password: crewPassword,
        role: "CREW",
        roleId: roleByCode.CREW?.id || null,
        branchId: null,
        isActive: true,
      },
    });

    extraCrewRecords.push(record);
  }

  await prisma.branchAssignment.deleteMany({
    where: {
      userId: {
        in: [crew.id, ...extraCrewRecords.map((record) => record.id)],
      },
    },
  });

  await prisma.branchAssignment.create({
    data: {
      userId: crew.id,
      branchId: branch.id,
      isActive: true,
      isPrimary: true,
      startDate: new Date(),
    },
  });

  // =========================
  // 2b. Branch Assignments for all crew
  // =========================
  const branchAssignmentMap = [
    { crew: extraCrewRecords[0], branch: allBranches[1] },  // crew-a → Tugu
    { crew: extraCrewRecords[1], branch: allBranches[2] },  // crew-b → Mantrijeron
    { crew: extraCrewRecords[2], branch: allBranches[3] },  // crew-c → Umbulharjo
    { crew: extraCrewRecords[3], branch: allBranches[4] },  // crew-d → Minggir
    { crew: extraCrewRecords[4], branch: allBranches[5] },  // crew-e → Depok
    { crew: extraCrewRecords[5], branch: allBranches[6] },  // crew-f → Kotagede
    { crew: extraCrewRecords[6], branch: allBranches[7] },  // crew-g → Ngaglik
    { crew: extraCrewRecords[7], branch: allBranches[8] },  // crew-h → Gedongtengen
    { crew: extraCrewRecords[8], branch: allBranches[9] },  // crew-i → Jetis
    { crew: extraCrewRecords[9], branch: allBranches[0] },  // crew-j → Gondokusuman
  ];

  for (const item of branchAssignmentMap) {
    const existing = await prisma.branchAssignment.findFirst({
      where: { userId: item.crew.id, branchId: item.branch.id, isActive: true },
    });
    if (!existing) {
      await prisma.branchAssignment.create({
        data: {
          userId: item.crew.id,
          branchId: item.branch.id,
          isActive: true,
          isPrimary: true,
          startDate: new Date(),
        },
      });
    }
  }

  // =========================
  // 2c. Update crew home branch to match assignment
  // =========================
  for (const item of branchAssignmentMap) {
    await prisma.user.update({
      where: { id: item.crew.id },
      data: { branchId: item.branch.id },
    });
  }

  // =========================
  // 3. System settings & feature flags
  // =========================
  async function upsertSetting(key, data) {
    const existing = await prisma.systemSetting.findFirst({
      where: {
        key,
        scope: data.scope || "GLOBAL",
        branchId: data.branchId || null,
      },
    });

    if (existing) {
      return prisma.systemSetting.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.systemSetting.create({
      data: { key, ...data },
    });
  }

  async function upsertFeature(key, data) {
    const existing = await prisma.featureFlag.findFirst({
      where: {
        key,
        scope: data.scope || "GLOBAL",
        branchId: data.branchId || null,
      },
    });

    if (existing) {
      return prisma.featureFlag.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.featureFlag.create({
      data: { key, ...data },
    });
  }

  await upsertSetting("erp.sidebarMode", {
    value: "accordion",
    scope: "GLOBAL",
    description: "Mode sidebar ERP utama",
    isActive: true,
  });

  await upsertSetting("pos.defaultSalesChannel", {
    value: "OFFLINE",
    scope: "GLOBAL",
    description: "Default channel saat buka POS",
    isActive: true,
  });

  await upsertFeature("expenseModuleEnabled", {
    name: "Outlet Expense Module",
    description: "Menyalakan modul outlet expenses dan barang masuk",
    enabled: true,
    scope: "GLOBAL",
  });

  await upsertFeature("auditLogEnabled", {
    name: "Audit Log",
    description: "Mencatat aktivitas penting ERP",
    enabled: true,
    scope: "GLOBAL",
  });

  // =========================
  // 5. Product Categories
  // =========================
  const catTahuWalik = await prisma.productCategory.upsert({
    where: {
      code: "TAHU_WALIK",
    },
    update: {},
    create: {
      name: "Tahu Walik",
      code: "TAHU_WALIK",
      description: "Menu utama Tahu Walik KRUNCUY",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catBaksoGoreng = await prisma.productCategory.upsert({
    where: {
      code: "BAKSO_GORENG",
    },
    update: {},
    create: {
      name: "Bakso Goreng",
      code: "BAKSO_GORENG",
      description: "Menu tambahan Bakso Goreng",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catExtra = await prisma.productCategory.upsert({
    where: {
      code: "EXTRA",
    },
    update: {},
    create: {
      name: "Extra",
      code: "EXTRA",
      description: "Tambahan saus dan menu ekstra",
      sortOrder: 3,
      isActive: true,
    },
  });

  // =========================
  // 6. Products
  // =========================
  const createdProducts = {};
  const products = [
    {
      code: "TW_5K",
      name: "Tahu Walik 5K",
      imageUrl: "https://placehold.co/400x300/eee/333?text=TW+5K",
      price: 5000,
      pcs: 5,
      categoryId: catTahuWalik.id,
    },
    {
      code: "TW_10K",
      name: "Tahu Walik 10K",
      imageUrl: "https://placehold.co/400x300/eee/333?text=TW+10K",
      price: 10000,
      pcs: 11,
      categoryId: catTahuWalik.id,
    },
    {
      code: "TW_20K",
      name: "Tahu Walik 20K",
      imageUrl: "https://placehold.co/400x300/eee/333?text=TW+20K",
      price: 20000,
      pcs: 24,
      categoryId: catTahuWalik.id,
    },
    {
      code: "TW_BASE",
      name: "Tahu Walik Matang (1 pcs)",
      imageUrl: null,
      price: 0,
      pcs: 1,
      categoryId: catTahuWalik.id,
    },
    {
      code: "BG_5K",
      name: "Bakso Goreng 5K",
      imageUrl: "https://placehold.co/400x300/eee/333?text=BG+5K",
      price: 5000,
      pcs: 6,
      categoryId: catBaksoGoreng.id,
    },
    {
      code: "BG_10K",
      name: "Bakso Goreng 10K",
      imageUrl: "https://placehold.co/400x300/eee/333?text=BG+10K",
      price: 10000,
      pcs: 13,
      categoryId: catBaksoGoreng.id,
    },
    {
      code: "BG_20K",
      name: "Bakso Goreng 20K",
      imageUrl: "https://placehold.co/400x300/eee/333?text=BG+20K",
      price: 20000,
      pcs: 28,
      categoryId: catBaksoGoreng.id,
    },
    {
      code: "EXTRA_SAUS",
      name: "Extra Saus",
      imageUrl: "https://placehold.co/400x300/eee/333?text=Extra+Saus",
      price: 2000,
      pcs: 0,
      categoryId: catExtra.id,
    },
  ];

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        price: item.price,
        pcs: item.pcs,
        categoryId: item.categoryId,
        imageUrl: item.imageUrl,
        isActive: true,
      },
      create: {
        name: item.name,
        code: item.code,
        price: item.price,
        pcs: item.pcs,
        categoryId: item.categoryId,
        isActive: true,
      },
    });

    createdProducts[item.code] = product;

    for (const branchTarget of allBranches) {
      await prisma.branchProduct.upsert({
        where: {
          branchId_productId: {
            branchId: branchTarget.id,
            productId: product.id,
          },
        },
        update: {
          price: item.price,
          isAvailable: true,
          isActive: true,
        },
        create: {
          branchId: branchTarget.id,
          productId: product.id,
          price: item.price,
          isAvailable: true,
          isActive: true,
        },
      });
    }
  }

  // =========================
  // 7. Menu variants per channel/platform
  // =========================
  const onlineVariantOverrides = {
    TW_5K: {
      GRABFOOD: { displayName: "Tahu Walik 5K Promo Grab", price: 5500, promoLabel: "Grab promo" },
      GOFOOD: { displayName: "Tahu Walik 5K Promo Gojek", price: 5000, promoLabel: "Go promo" },
      SHOPEEFOOD: { displayName: "Tahu Walik 5K Promo Shopee", price: 5200, promoLabel: "Shopee promo" },
    },
    TW_10K: {
      GRABFOOD: { displayName: "Tahu Walik 10K Promo Grab", price: 9500, promoLabel: "Grab promo" },
      GOFOOD: { displayName: "Tahu Walik 10K Promo Gojek", price: 10000, promoLabel: "Go promo" },
      SHOPEEFOOD: { displayName: "Tahu Walik 10K Promo Shopee", price: 9800, promoLabel: "Shopee promo" },
    },
    BG_5K: {
      GRABFOOD: { displayName: "Bakso Goreng 5K Promo Grab", price: 4800, promoLabel: "Grab promo" },
    },
  };

  for (const branchTarget of allBranches) {
    for (const item of products) {
      const product = createdProducts[item.code];

      const existingOfflineVariant = await prisma.branchMenuVariant.findFirst({
        where: {
          branchId: branchTarget.id,
          productId: product.id,
          salesChannel: "OFFLINE",
          onlinePlatform: null,
        },
      });

      if (existingOfflineVariant) {
        await prisma.branchMenuVariant.update({
          where: {
            id: existingOfflineVariant.id,
          },
          data: {
            displayName: product.name,
            price: item.price,
            isAvailable: true,
            isActive: true,
            promoLabel: null,
          },
        });
      } else {
        await prisma.branchMenuVariant.create({
          data: {
            branchId: branchTarget.id,
            productId: product.id,
            salesChannel: "OFFLINE",
            onlinePlatform: null,
            displayName: product.name,
            price: item.price,
            isAvailable: true,
            isActive: true,
          },
        });
      }

      for (const platform of ["GRABFOOD", "GOFOOD", "SHOPEEFOOD"]) {
        const override = onlineVariantOverrides[item.code]?.[platform];

        if (!override) continue;

        await prisma.branchMenuVariant.upsert({
          where: {
            branchId_productId_salesChannel_onlinePlatform: {
              branchId: branchTarget.id,
              productId: product.id,
              salesChannel: "ONLINE",
              onlinePlatform: platform,
            },
          },
          update: {
            displayName: override.displayName || product.name,
            price: override.price ?? item.price,
            isAvailable: true,
            isActive: true,
            promoLabel: override.promoLabel || null,
          },
          create: {
            branchId: branchTarget.id,
            productId: product.id,
            salesChannel: "ONLINE",
            onlinePlatform: platform,
            displayName: override.displayName || product.name,
            price: override.price ?? item.price,
            isAvailable: true,
            isActive: true,
            promoLabel: override.promoLabel || null,
          },
        });
      }
    }
  }

  // =========================
  // 8. Inventory Items
  // =========================
  const inventoryItems = [
    { code: "RAW_TAHU_PONG", name: "Tahu Pong", unit: "pcs", type: "RAW_MATERIAL" },
    { code: "RAW_ADONAN", name: "Adonan", unit: "kg", type: "RAW_MATERIAL" },
    { code: "RAW_MINYAK", name: "Minyak Goreng", unit: "liter", type: "RAW_MATERIAL" },
    { code: "RAW_GAS", name: "Gas LPG", unit: "tabung", type: "UTILITY" },
    { code: "PKG_SAUCE_BAG", name: "Saus Bag", unit: "pcs", type: "PACKAGING" },
    { code: "PKG_SAUCE_CUP", name: "Sauce Cup", unit: "pcs", type: "PACKAGING" },
    { code: "PKG_PAPER_BAG", name: "Paper Bag", unit: "pcs", type: "PACKAGING" },
  ];

  const inventoryMap = {};

  for (const item of inventoryItems) {
    const needsOpname = item.type === "RAW_MATERIAL";
    const inventoryItem = await prisma.inventoryItem.upsert({
      where: { code: item.code },
      update: {
        name: item.name, unit: item.unit, type: item.type,
        isActive: true, isOpnameRequired: needsOpname,
      },
      create: {
        name: item.name, code: item.code, unit: item.unit, type: item.type,
        isActive: true, isOpnameRequired: needsOpname,
      },
    });

    inventoryMap[item.code] = inventoryItem;
  }

  // =========================
  // 9. Branch inventory setup
  // =========================
  const branchInitialStocks = {
    RAW_TAHU_PONG: 240,
    RAW_ADONAN: 18.5,
    RAW_MINYAK: 24,
    RAW_GAS: 9,
    PKG_SAUCE_BAG: 300,
    PKG_SAUCE_CUP: 300,
    PKG_PAPER_BAG: 200,
  };

  for (const branchTarget of allBranches) {
    for (const item of inventoryItems) {
      const needsOpname = item.type === "RAW_MATERIAL";
      await prisma.branchInventoryItem.upsert({
        where: {
          branchId_inventoryItemId: {
            branchId: branchTarget.id,
            inventoryItemId: inventoryMap[item.code].id,
          },
        },
        update: {
          currentStock: branchInitialStocks[item.code] || 0,
          isActive: true,
          isOpnameRequired: needsOpname,
        },
        create: {
          branchId: branchTarget.id,
          inventoryItemId: inventoryMap[item.code].id,
          currentStock: branchInitialStocks[item.code] || 0,
          isActive: true,
          isOpnameRequired: needsOpname,
        },
      });
    }
  }

  // =========================
  // 10. Depot warehouse stock setup
  // =========================
  for (const item of inventoryItems) {
    await prisma.warehouseStock.upsert({
      where: {
        warehouseId_inventoryItemId: {
          warehouseId: depotWarehouse.id,
          inventoryItemId: inventoryMap[item.code].id,
        },
      },
      update: {
        currentStock: branchInitialStocks[item.code] || 0,
        isActive: true,
      },
      create: {
        warehouseId: depotWarehouse.id,
        inventoryItemId: inventoryMap[item.code].id,
        currentStock: branchInitialStocks[item.code] || 0,
        isActive: true,
      },
    });
  }

  // =========================
  // 11. Menu recipes
  // =========================
  const recipeDefinitions = [
    {
      productCode: "TW_BASE",
      isBase: true,
      items: [
        ["RAW_TAHU_PONG", 1],
        ["RAW_ADONAN", 0.12],
        ["RAW_MINYAK", 0.03],
      ],
    },
    {
      productCode: "TW_5K",
      subRecipeCode: "TW_BASE",
      subRecipeQty: 5,
      items: [
        ["PKG_SAUCE_CUP", 5],
        ["PKG_PAPER_BAG", 5],
      ],
    },
    {
      productCode: "TW_10K",
      subRecipeCode: "TW_BASE",
      subRecipeQty: 11,
      items: [
        ["PKG_SAUCE_CUP", 11],
        ["PKG_PAPER_BAG", 10],
      ],
    },
    {
      productCode: "TW_20K",
      subRecipeCode: "TW_BASE",
      subRecipeQty: 24,
      items: [
        ["PKG_SAUCE_CUP", 24],
        ["PKG_PAPER_BAG", 20],
      ],
    },
    {
      productCode: "BG_5K",
      items: [
        ["RAW_ADONAN", 0.18],
        ["RAW_MINYAK", 0.04],
        ["PKG_SAUCE_BAG", 1],
        ["PKG_PAPER_BAG", 1],
      ],
    },
    {
      productCode: "BG_10K",
      items: [
        ["RAW_ADONAN", 0.36],
        ["RAW_MINYAK", 0.08],
        ["PKG_SAUCE_BAG", 2],
        ["PKG_PAPER_BAG", 1],
      ],
    },
    {
      productCode: "BG_20K",
      items: [
        ["RAW_ADONAN", 0.72],
        ["RAW_MINYAK", 0.16],
        ["PKG_SAUCE_BAG", 4],
        ["PKG_PAPER_BAG", 2],
      ],
    },
  ];

  for (const definition of recipeDefinitions) {
    const product = createdProducts[definition.productCode];
    if (!product) continue;

    const recipe = await prisma.menuRecipe.upsert({
      where: { productId: product.id },
      update: { isActive: true, version: 1 },
      create: { productId: product.id, version: 1, yieldQty: 1, isActive: true },
    });

    await prisma.menuRecipeItem.deleteMany({ where: { recipeId: recipe.id } });

    // Sub-recipe (nested BOM)
    if (definition.subRecipeCode) {
      const subProduct = createdProducts[definition.subRecipeCode];
      if (subProduct) {
        const subRecipe = await prisma.menuRecipe.findUnique({ where: { productId: subProduct.id } });
        if (subRecipe) {
          await prisma.menuRecipeItem.create({
            data: { recipeId: recipe.id, subRecipeId: subRecipe.id, qtyPerUnit: definition.subRecipeQty || 1 },
          });
        }
      }
    }

    // Regular inventory items
    for (const [inventoryCode, qty] of definition.items) {
      await prisma.menuRecipeItem.create({
        data: { recipeId: recipe.id, inventoryItemId: inventoryMap[inventoryCode].id, qtyPerUnit: qty },
      });
    }
  }

  // =========================
  // 12. Dummy Transactional Data for Testing
  // =========================

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(8, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const twProducts = [createdProducts.TW_5K, createdProducts.TW_10K, createdProducts.BG_5K, createdProducts.BG_10K];

  // Clean existing test data (order matters for FK constraints)
  await prisma.outletExpenseItem.deleteMany({});
  await prisma.outletExpense.deleteMany({});
  await prisma.transactionItem.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.cashWithdrawal.deleteMany({});
  await prisma.cashSession.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.crewAttendance.deleteMany({});
  await prisma.stockOpnameItem.deleteMany({});
  await prisma.stockOpname.deleteMany({});

  // Crew Attendance — yesterday
  await prisma.crewAttendance.create({
    data: { branchId: branch.id, userId: crew.id, attendanceDate: yesterday, checkInAt: yesterday, checkOutAt: new Date(yesterday.getTime() + 10*3600000), status: "PRESENT" },
  });

  // 12a. Cash Session (CLOSED — yesterday)
  const pastSession = await prisma.cashSession.create({
    data: {
      branchId: branch.id,
      userId: crew.id,
      openingCash: 100000,
      status: "CLOSED",
      openedAt: yesterday,
      closedAt: new Date(yesterday.getTime() + 10 * 3600000),
      closingCash: 180000,
      expectedCash: 180000,
    },
  });

  // 12b. Transactions for yesterday's session
  const txData = [
    { invoiceNumber: "KR-20260607-100001", totalAmount: 10000, totalPcs: 5, paymentMethod: "CASH", items: [{ productCode: "TW_5K", qty: 1, pcs: 5, price: 10000 }] },
    { invoiceNumber: "KR-20260607-100002", totalAmount: 20000, totalPcs: 11, paymentMethod: "CASH", items: [{ productCode: "TW_10K", qty: 1, pcs: 11, price: 20000 }] },
    { invoiceNumber: "KR-20260607-100003", totalAmount: 15000, totalPcs: 6, paymentMethod: "CASH", items: [{ productCode: "BG_5K", qty: 3, pcs: 6, price: 15000 }] },
    { invoiceNumber: "KR-20260607-100004", totalAmount: 5000, totalPcs: 5, paymentMethod: "QRIS", items: [{ productCode: "TW_5K", qty: 1, pcs: 5, price: 5000 }] },
  ];

  for (const tx of txData) {
    const created = await prisma.transaction.create({
      data: {
        invoiceNumber: tx.invoiceNumber,
        branchId: branch.id,
        cashierId: crew.id,
        cashSessionId: pastSession.id,
        totalAmount: tx.totalAmount,
        totalPcs: tx.totalPcs,
        salesChannel: "OFFLINE",
        paymentMethod: tx.paymentMethod,
        status: "COMPLETED",
        createdAt: yesterday,
      },
    });
    for (const item of tx.items) {
      const product = createdProducts[item.productCode];
      await prisma.transactionItem.create({
        data: {
          transactionId: created.id,
          productId: product.id,
          productName: product.name,
          qty: item.qty,
          price: item.price,
          pcs: item.pcs,
          subtotal: item.price * item.qty,
        },
      });
    }
  }

  // 12c. Cash Withdrawal (COMPLETED)
  const pastWithdrawal = await prisma.cashWithdrawal.create({
    data: {
      withdrawalNumber: "CW-20260607-A1B2",
      branchId: branch.id,
      cashSessionId: pastSession.id,
      requestedById: crew.id,
      issuedById: erpAdmin.id,
      verifiedById: crew.id,
      amount: 20000,
      note: "Setoran cash ke owner — testing",
      status: "COMPLETED",
      verifiedAt: yesterday,
      createdAt: yesterday,
    },
  });

  // 12d. Outlet Expense (POSTED)
  const pastExpense = await prisma.outletExpense.create({
    data: {
      branchId: branch.id,
      cashSessionId: pastSession.id,
      createdById: crew.id,
      approvedById: erpAdmin.id,
      totalAmount: 15000,
      receiptPhotoUrl: "https://placehold.co/400x300?text=Struk",
      note: "Beli minyak goreng 2 liter — darurat",
      status: "POSTED",
      approvedAt: yesterday,
      expenseDate: yesterday,
    },
  });
  await prisma.outletExpenseItem.create({
    data: {
      outletExpenseId: pastExpense.id,
      inventoryItemId: inventoryMap.RAW_MINYAK.id,
      itemName: "Minyak Goreng",
      unit: "liter",
      qty: 2,
      totalAmount: 15000,
    },
  });

  // 12e. Today's active session (OPEN)
  const todaySession = await prisma.cashSession.create({
    data: {
      branchId: branch.id,
      userId: crew.id,
      openingCash: Number(pastSession.closingCash || 0),
      status: "OPEN",
      openedAt: new Date(),
    },
  });

  // Crew Attendance — today
  await prisma.crewAttendance.create({
    data: { branchId: branch.id, userId: crew.id, attendanceDate: todayStart, checkInAt: new Date(), status: "PRESENT" },
  });

  // 12f. Today's transactions (mix of Cash, QRIS, Online for testing)
  const todayTxData = [
    { inv: "KR-20260608-200001", amt: 10000, pcs: 5, pay: "CASH", ch: "OFFLINE", items: [{ code: "TW_5K", qty: 2, pcs: 5, price: 5000 }] },
    { inv: "KR-20260608-200002", amt: 20000, pcs: 11, pay: "CASH", ch: "OFFLINE", items: [{ code: "TW_10K", qty: 1, pcs: 11, price: 20000 }] },
    { inv: "KR-20260608-200003", amt: 10000, pcs: 13, pay: "CASH", ch: "OFFLINE", items: [{ code: "BG_5K", qty: 2, pcs: 6, price: 5000 }] },
    { inv: "KR-20260608-200004", amt: 50000, pcs: 24, pay: "CASH", ch: "OFFLINE", items: [{ code: "TW_20K", qty: 1, pcs: 24, price: 20000 }, { code: "BG_10K", qty: 3, pcs: 13, price: 10000 }] },
    { inv: "KR-20260608-200005", amt: 15000, pcs: 15, pay: "CASH", ch: "OFFLINE", items: [{ code: "TW_5K", qty: 3, pcs: 5, price: 5000 }] },
    { inv: "KR-20260608-200006", amt: 25000, pcs: 24, pay: "QRIS", ch: "OFFLINE", items: [{ code: "TW_20K", qty: 1, pcs: 24, price: 20000 }, { code: "TW_5K", qty: 1, pcs: 5, price: 5000 }] },
    { inv: "KR-20260608-200007", amt: 10000, pcs: 11, pay: "GOFOOD", ch: "ONLINE", plat: "GOFOOD", items: [{ code: "TW_10K", qty: 1, pcs: 11, price: 10000 }] },
  ];

  for (const tx of todayTxData) {
    const created = await prisma.transaction.create({
      data: {
        invoiceNumber: tx.inv,
        branchId: branch.id,
        cashierId: crew.id,
        cashSessionId: todaySession.id,
        totalAmount: tx.amt,
        totalPcs: tx.pcs,
        salesChannel: tx.ch || "OFFLINE",
        onlinePlatform: tx.plat || null,
        paymentMethod: tx.pay,
        status: "COMPLETED",
        createdAt: new Date(),
      },
    });
    for (const item of tx.items) {
      const product = createdProducts[item.code];
      await prisma.transactionItem.create({
        data: {
          transactionId: created.id,
          productId: product.id,
          productName: product.name,
          qty: item.qty,
          price: item.price,
          pcs: item.pcs,
          subtotal: item.price * item.qty,
        },
      });
    }
  }

  // 12g. Inventory Movements (SALE deductions from today's transactions)
  // Recursive helper for sub-recipes
  async function consumeSeedRecipe(recipe, multi, branchId) {
    const fullRecipe = await prisma.menuRecipe.findUnique({
      where: { id: recipe.id },
      include: { items: true },
    });
    if (!fullRecipe) return;
    for (const ri of fullRecipe.items) {
      if (ri.subRecipeId) {
        const sub = await prisma.menuRecipe.findUnique({
          where: { id: ri.subRecipeId },
          include: { items: true },
        });
        if (sub) await consumeSeedRecipe(sub, Number(ri.qtyPerUnit) * multi, branchId);
      } else if (ri.inventoryItemId) {
        const bs = await prisma.branchInventoryItem.findFirst({
          where: { branchId, inventoryItemId: ri.inventoryItemId },
        });
        if (bs) {
          const c = Number(ri.qtyPerUnit) * multi;
          await prisma.inventoryMovement.create({
            data: { branchId, inventoryItemId: ri.inventoryItemId, performedById: crew.id,
              type: "SALE", quantity: -c, referenceType: "TRANSACTION", referenceId: "seed",
              notes: `Penjualan x${multi}` },
          });
          await prisma.branchInventoryItem.update({
            where: { id: bs.id }, data: { currentStock: { decrement: c } },
          });
        }
      }
    }
  }
  for (const tx of todayTxData) {
    for (const item of tx.items) {
      const product = createdProducts[item.code];
      if (!product) continue;
      const recipe = await prisma.menuRecipe.findFirst({
        where: { productId: product.id, isActive: true },
      });
      if (recipe) await consumeSeedRecipe(recipe, item.qty, branch.id);
    }
  }

  // 12h. Today's Opening Stock Opname (completed)
  const todayOpeningItems = await prisma.branchInventoryItem.findMany({
    where: { branchId: branch.id, isActive: true, isOpnameRequired: true },
  });
  const openingOpname = await prisma.stockOpname.create({
    data: {
      branchId: branch.id,
      performedById: crew.id,
      opnameDate: todayStart,
      kind: "OPENING",
      isCompleted: true,
      notes: "Opening opname otomatis — seed",
    },
  });
  for (const bi of todayOpeningItems) {
    await prisma.stockOpnameItem.create({
      data: {
        stockOpnameId: openingOpname.id,
        branchInventoryItemId: bi.id,
        inventoryItemId: bi.inventoryItemId,
        systemQty: Number(bi.currentStock || 0),
        countedQty: Number(bi.currentStock || 0),
        varianceQty: 0,
      },
    });
  }

  // 12i. Completed Withdrawal for today (OTP flow)
  const todayWithdrawal = await prisma.cashWithdrawal.create({
    data: {
      withdrawalNumber: "CW-20260608-B3C4",
      branchId: branch.id,
      cashSessionId: todaySession.id,
      requestedById: crew.id,
      amount: 50000,
      note: "Setoran cash hari ini — test OTP",
      status: "REQUESTED",
    },
  });

  console.log("Data dummy transaksional berhasil dibuat.");
  console.log({
    branch: branch.name,
    secondBranch: secondBranch.name,
    superAdmin: superAdmin.email,
    owner: erpAdmin.email,
    crew: crew.email,
    password: "Lihat seed.js atau login masing-masing",
  });
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
