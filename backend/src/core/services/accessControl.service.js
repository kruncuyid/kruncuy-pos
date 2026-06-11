const prisma = require("../config/prisma");
const {
  DEFAULT_ROLES,
  DEFAULT_ROLE_PERMISSION_CODES,
  PERMISSION_MODULES,
} = require("../constants/accessControlCatalog");

function resolveRoleCode(input) {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    return input.code || input.role || input.roleCode || input.name || null;
  }
  return null;
}

async function getRoleByCode(roleCode) {
  const resolvedRoleCode = resolveRoleCode(roleCode);
  if (!resolvedRoleCode) return null;

  return prisma.role.findUnique({
    where: { code: resolvedRoleCode },
    include: {
      rolePermissions: {
        where: { allowed: true },
        include: {
          permission: {
            include: {
              module: true,
            },
          },
        },
      },
    },
  });
}

async function getPermissionsByRole(roleCode) {
  const role = await getRoleByCode(roleCode);

  if (!role) return [];

  return role.rolePermissions
    .map((item) => item.permission?.code)
    .filter(Boolean);
}

async function canAccessAllBranches(roleCode) {
  const role = await getRoleByCode(roleCode);
  return role?.branchScope === "ALL";
}

async function getAccessMatrix() {
  const [roles, modules, permissions, rolePermissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: [
        { isSystem: "desc" },
        { name: "asc" },
      ],
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    }),
    prisma.permissionModule.findMany({
      include: {
        permissions: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
    prisma.permission.findMany({
      include: {
        module: true,
      },
      orderBy: [
        { module: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    }),
    prisma.rolePermission.findMany({
      include: {
        role: true,
        permission: true,
      },
    }),
  ]);

  return {
    roles,
    modules,
    permissions,
    rolePermissions,
  };
}

function isDeadlockError(error) {
  return error?.code === "P2034" || String(error?.message || "").includes("deadlock detected");
}

async function withDeadlockRetry(operation, maxAttempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isDeadlockError(error) || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 100));
    }
  }

  throw lastError;
}

async function replaceRolePermissions(role, resolvedPermissions) {
  await prisma.rolePermission.deleteMany({
    where: {
      roleId: role.id,
    },
  });

  if (!resolvedPermissions.length) {
    return;
  }

  await prisma.rolePermission.createMany({
    data: resolvedPermissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
      allowed: true,
    })),
    skipDuplicates: true,
  });
}

async function ensureRolePermissions(role, resolvedPermissions) {
  if (!resolvedPermissions.length) {
    return;
  }

  const existing = await prisma.rolePermission.findMany({
    where: {
      roleId: role.id,
      allowed: true,
    },
    select: {
      permissionId: true,
    },
  });

  const existingPermissionIds = new Set(existing.map((item) => item.permissionId));
  const missingPermissions = resolvedPermissions.filter(
    (permission) => !existingPermissionIds.has(permission.id)
  );

  if (!missingPermissions.length) {
    return;
  }

  await prisma.rolePermission.createMany({
    data: missingPermissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
      allowed: true,
    })),
    skipDuplicates: true,
  });
}

async function syncDefaultAccessCatalog(options = {}) {
  const { resetRolePermissions = false } = options;
  const moduleByCode = {};
  const permissionByCode = {};

  for (const moduleDef of PERMISSION_MODULES) {
    const module = await prisma.permissionModule.upsert({
      where: { code: moduleDef.code },
      update: {
        name: moduleDef.name,
        description: moduleDef.description,
        sortOrder: moduleDef.sortOrder,
        isActive: true,
      },
      create: {
        code: moduleDef.code,
        name: moduleDef.name,
        description: moduleDef.description,
        sortOrder: moduleDef.sortOrder,
        isActive: true,
      },
    });

    moduleByCode[moduleDef.code] = module;

    for (const permissionDef of moduleDef.permissions) {
      const permission = await prisma.permission.upsert({
        where: { code: permissionDef.code },
        update: {
          name: permissionDef.name,
          description: permissionDef.description,
          action: permissionDef.action,
          sortOrder: permissionDef.sortOrder,
          moduleId: module.id,
          isActive: true,
        },
        create: {
          code: permissionDef.code,
          name: permissionDef.name,
          description: permissionDef.description,
          action: permissionDef.action,
          sortOrder: permissionDef.sortOrder,
          moduleId: module.id,
          isActive: true,
        },
      });

      permissionByCode[permissionDef.code] = permission;
    }
  }

  const roleByCode = {};
  for (const roleDef of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        branchScope: roleDef.branchScope,
        isSystem: roleDef.isSystem,
        isActive: true,
      },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.description,
        branchScope: roleDef.branchScope,
        isSystem: roleDef.isSystem,
        isActive: true,
      },
    });

    roleByCode[roleDef.code] = role;
  }

  const allPermissionCodes = Object.keys(permissionByCode);
  for (const [roleCode, permissionCodes] of Object.entries(DEFAULT_ROLE_PERMISSION_CODES)) {
    const role = roleByCode[roleCode];
    if (!role) continue;

    const resolvedCodes = permissionCodes.includes("*") ? allPermissionCodes : permissionCodes;
    const resolvedPermissions = await prisma.permission.findMany({
      where: {
        code: {
          in: resolvedCodes,
        },
      },
    });

    if (resetRolePermissions) {
      await withDeadlockRetry(() => replaceRolePermissions(role, resolvedPermissions));
    } else {
      await ensureRolePermissions(role, resolvedPermissions);
    }
  }

  return { moduleByCode, permissionByCode, roleByCode };
}

async function setRolePermissions(roleCode, permissionCodes = []) {
  const role = await prisma.role.findUnique({
    where: { code: roleCode },
  });

  if (!role) {
    const error = new Error("Role tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const permissions = await prisma.permission.findMany({
    where: {
      code: {
        in: permissionCodes,
      },
    },
  });

  return prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: {
        roleId: role.id,
      },
    });

    if (permissions.length) {
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
          allowed: true,
        })),
        skipDuplicates: true,
      });
    }

    return tx.role.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });
  });
}

module.exports = {
  resolveRoleCode,
  getRoleByCode,
  getPermissionsByRole,
  canAccessAllBranches,
  getAccessMatrix,
  syncDefaultAccessCatalog,
  setRolePermissions,
};
