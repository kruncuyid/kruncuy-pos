const prisma = require("../../core/config/prisma");

async function getSettingsOverview() {
  const [systemSettings, featureFlags] = await Promise.all([
    prisma.systemSetting.findMany({
      where: {
        isActive: true,
      },
      include: {
        branch: true,
      },
      orderBy: [
        { scope: "asc" },
        { key: "asc" },
      ],
    }),
    prisma.featureFlag.findMany({
      include: {
        branch: true,
      },
      orderBy: {
        key: "asc",
      },
    }),
  ]);

  return {
    systemSettings,
    featureFlags,
  };
}

async function upsertSystemSetting(key, payload = {}) {
  if (!key) {
    const error = new Error("Key setting wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const scope = payload.scope || "GLOBAL";
  const branchId = payload.branchId || null;

  const existing = await prisma.systemSetting.findFirst({
    where: {
      key,
      scope,
      branchId,
    },
  });

  if (existing) {
    return prisma.systemSetting.update({
      where: { id: existing.id },
      data: {
        value: payload.value,
        scope,
        branchId,
        description: payload.description || null,
        isActive: payload.isActive ?? true,
      },
      include: {
        branch: true,
      },
    });
  }

  return prisma.systemSetting.create({
    data: {
      key,
      value: payload.value,
      scope,
      branchId,
      description: payload.description || null,
      isActive: payload.isActive ?? true,
    },
    include: {
      branch: true,
    },
  });
}

async function upsertFeatureFlag(key, payload = {}) {
  if (!key) {
    const error = new Error("Key feature flag wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const scope = payload.scope || "GLOBAL";
  const branchId = payload.branchId || null;

  const existing = await prisma.featureFlag.findFirst({
    where: {
      key,
      scope,
      branchId,
    },
  });

  if (existing) {
    return prisma.featureFlag.update({
      where: { id: existing.id },
      data: {
        name: payload.name || key,
        description: payload.description || null,
        enabled: payload.enabled ?? false,
        scope,
        branchId,
      },
      include: {
        branch: true,
      },
    });
  }

  return prisma.featureFlag.create({
    data: {
      key,
      name: payload.name || key,
      description: payload.description || null,
      enabled: payload.enabled ?? false,
      scope,
      branchId,
    },
    include: {
      branch: true,
    },
  });
}

module.exports = {
  getSettingsOverview,
  upsertSystemSetting,
  upsertFeatureFlag,
};
