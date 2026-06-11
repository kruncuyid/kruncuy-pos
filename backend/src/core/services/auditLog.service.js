const prisma = require("../config/prisma");
const { parsePagination } = require("../utils/pagination");

exports.createAuditLog = async ({
  action,
  entity,
  entityId = null,
  description = null,
  metadata = null,
  branchId = null,
  performedById = null,
  client = prisma,
}) => {
  if (!action || !entity) {
    return null;
  }

  return client.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      description,
      metadata: metadata || undefined,
      branchId,
      performedById,
    },
  });
};

exports.listRecentAuditLogs = async ({ branchId = null, limit = 50 } = {}) => {
  return prisma.auditLog.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
    },
    include: {
      branch: true,
      performedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
};

exports.searchAuditLogs = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (query.branchId) where.branchId = query.branchId;
  if (query.action) where.action = query.action;
  if (query.entity) where.entity = query.entity;
  if (query.performedById) where.performedById = query.performedById;
  if (query.startDate || query.endDate) {
    where.createdAt = {
      ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
      ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
    };
  }
  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: "insensitive" } },
      { entity: { contains: query.search, mode: "insensitive" } },
      { action: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, action: true, entity: true, entityId: true,
        description: true, createdAt: true,
        performedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};
