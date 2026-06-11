const prisma = require("../../core/config/prisma");

exports.getAssignments = async (filters = {}) => {
  return prisma.branchAssignment.findMany({
    where: {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
    },
    include: {
      user: true,
      branch: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

exports.createAssignment = async (payload) => {
  const userId = payload.userId;
  const branchId = payload.branchId;
  const startDate = payload.startDate ? new Date(payload.startDate) : new Date();

  if (!userId || !branchId) {
    const error = new Error("User dan branch wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const existingActive = await prisma.branchAssignment.findFirst({
    where: {
      userId,
      branchId,
      isActive: true,
    },
  });

  if (existingActive) {
    const error = new Error("Assignment aktif untuk user dan branch ini sudah ada");
    error.statusCode = 409;
    throw error;
  }

  if (payload.isPrimary) {
    await prisma.branchAssignment.updateMany({
      where: {
        userId,
        isPrimary: true,
        isActive: true,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  return prisma.branchAssignment.create({
    data: {
      userId,
      branchId,
      startDate,
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      isActive: payload.isActive ?? true,
      isPrimary: payload.isPrimary ?? false,
    },
    include: {
      user: true,
      branch: true,
    },
  });
};

exports.deactivateAssignment = async (id) => {
  const existing = await prisma.branchAssignment.findUnique({
    where: { id },
  });

  if (!existing) {
    const error = new Error("Assignment tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return prisma.branchAssignment.update({
    where: { id },
    data: {
      isActive: false,
      endDate: new Date(),
    },
    include: {
      user: true,
      branch: true,
    },
  });
};

exports.activateAssignment = async (id) => {
  const existing = await prisma.branchAssignment.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Assignment tidak ditemukan"); e.statusCode = 404; throw e; }
  return prisma.branchAssignment.update({
    where: { id }, data: { isActive: true, endDate: null },
    include: { user: true, branch: true },
  });
};

exports.updateAssignment = async (id, payload) => {
  const existing = await prisma.branchAssignment.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Assignment tidak ditemukan"); e.statusCode = 404; throw e; }
  return prisma.branchAssignment.update({
    where: { id },
    data: {
      ...(payload.branchId ? { branchId: payload.branchId } : {}),
      ...(payload.startDate ? { startDate: new Date(payload.startDate) } : {}),
      ...(payload.endDate !== undefined ? { endDate: payload.endDate ? new Date(payload.endDate) : null } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.isPrimary !== undefined ? { isPrimary: payload.isPrimary } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    },
    include: { user: true, branch: true },
  });
};

exports.quickAssign = async (userId, branchId, date) => {
  if (!userId || !branchId) { const e = new Error("User dan branch wajib"); e.statusCode = 400; throw e; }
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);

  // Nonaktifkan assignment aktif user di branch lain
  await prisma.branchAssignment.updateMany({
    where: { userId, isActive: true, branchId: { not: branchId } },
    data: { isActive: false, endDate: new Date() },
  });

  // Cek apakah sudah ada assignment untuk branch & tanggal ini
  const existing = await prisma.branchAssignment.findFirst({
    where: { userId, branchId, isActive: true },
  });

  if (existing) return existing;

  return prisma.branchAssignment.create({
    data: { userId, branchId, startDate: startOfDay, endDate: endOfDay, isActive: true, isPrimary: false },
    include: { user: true, branch: true },
  });
};
