const prisma = require("../../core/config/prisma");
const { hashPassword } = require("../../core/utils/password");
const { parsePagination } = require("../../core/utils/pagination");

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function normalizeRole(role, currentRole = "CREW") {
  const value = String(role || "").toUpperCase();
  if (!value) return currentRole;
  const allowed = ["SUPERADMIN", "ADMIN", "PURCHASING", "OWNER", "CREW"];
  return allowed.includes(value) ? value : currentRole;
}

async function resolveRoleRelation(roleCode, fallbackRoleCode = "CREW") {
  const normalized = normalizeRole(roleCode, fallbackRoleCode);
  const role = await prisma.role.findUnique({
    where: { code: normalized },
  });

  return {
    roleCode: role?.code || normalized,
    roleId: role?.id || null,
  };
}

exports.getUsers = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive === "true";
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { username: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, name: true, username: true, email: true, nickname: true, role: true, isActive: true, createdAt: true, branch: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

exports.createUser = async (payload = {}, currentUser = {}) => {
  const name = String(payload.name || "").trim();
  const username = normalizeUsername(payload.username || payload.email?.split("@")?.[0] || "");
  const nickname = String(payload.nickname || "").trim() || null;
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "").trim();
  const role = normalizeRole(payload.role, "CREW");
  const branchId = payload.branchId || null;
  const isActive = payload.isActive ?? true;
  const roleRelation = await resolveRoleRelation(role, "CREW");

  if (!name || !username || !email || !password) {
    const error = new Error("Nama lengkap, username, email, dan password wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (role === "OWNER" && currentUser.role !== "SUPERADMIN") {
    const error = new Error("Hanya superadmin yang boleh membuat akun owner");
    error.statusCode = 403;
    throw error;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const error = new Error("Email sudah terdaftar");
    error.statusCode = 409;
    throw error;
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    const error = new Error("Username sudah terdaftar");
    error.statusCode = 409;
    throw error;
  }

  return prisma.user.create({
    data: {
      name,
      username,
      nickname,
      email,
      password: await hashPassword(password),
      role: roleRelation.roleCode,
      roleId: roleRelation.roleId,
      branchId,
      isActive,
    },
    include: {
      branch: true,
    },
  });
};

exports.updateUser = async (id, payload = {}, currentUser = {}) => {
  if (!id) {
    const error = new Error("ID user wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { branch: true },
  });

  if (!existing) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (existing.role === "OWNER") {
    const error = new Error("Akun owner tidak bisa diubah dari halaman ini");
    error.statusCode = 403;
    throw error;
  }

  const nextRole = normalizeRole(payload.role, existing.role);
  const nextRoleRelation = await resolveRoleRelation(nextRole, existing.role);
  if (nextRole === "OWNER" && currentUser.role !== "SUPERADMIN") {
    const error = new Error("Hanya superadmin yang boleh mengubah user menjadi owner");
    error.statusCode = 403;
    throw error;
  }

  const nextUsername = normalizeUsername(payload.username || existing.username || existing.email?.split("@")?.[0] || "");
  const nextEmail = String(payload.email || existing.email || "").trim().toLowerCase();
  const nextName = String(payload.name || existing.name || "").trim();
  const nextNickname = payload.nickname === undefined ? existing.nickname || null : String(payload.nickname || "").trim() || null;

  if (!nextName || !nextUsername || !nextEmail) {
    const error = new Error("Nama lengkap, username, dan email wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      email: nextEmail,
      NOT: { id },
    },
  });

  if (duplicate) {
    const error = new Error("Email sudah terdaftar");
    error.statusCode = 409;
    throw error;
  }

  const duplicateUsername = await prisma.user.findFirst({
    where: {
      username: nextUsername,
      NOT: { id },
    },
  });

  if (duplicateUsername) {
    const error = new Error("Username sudah terdaftar");
    error.statusCode = 409;
    throw error;
  }

  const updateData = {
    name: nextName,
    username: nextUsername,
    nickname: nextNickname,
    email: nextEmail,
    role: nextRoleRelation.roleCode,
    roleId: nextRoleRelation.roleId,
    branchId: payload.branchId === undefined ? existing.branchId : payload.branchId || null,
    isActive: payload.isActive ?? existing.isActive,
  };

  if (payload.password && String(payload.password).trim()) {
    updateData.password = await hashPassword(String(payload.password).trim());
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      branch: true,
    },
  });
};

exports.deleteUser = async (id) => {
  if (!id) {
    const error = new Error("ID user wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (existing.role === "OWNER") {
    const error = new Error("Akun owner tidak bisa dihapus");
    error.statusCode = 403;
    throw error;
  }

  await prisma.user.delete({
    where: { id },
  });

  return { deleted: true };
};
