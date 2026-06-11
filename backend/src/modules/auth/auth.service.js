const prisma = require("../../core/config/prisma");
const { signToken, signRefreshToken } = require("../../core/utils/jwt");
const { comparePassword } = require("../../core/utils/password");
const { getPermissionsByRole } = require("../../core/middleware/permission.middleware");
const { getEffectiveBranchForUser } = require("../../core/services/branchAccess.service");

exports.login = async ({ username, password }) => {
  if (!username || !password) {
    const error = new Error("Username dan password wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const loginKey = String(username).trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: loginKey },
        { email: loginKey },
      ],
    },
    include: {
      branch: true,
    },
  });

  if (!user) {
    const error = new Error("Username atau password salah");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Akun tidak aktif");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    const error = new Error("Username atau password salah");
    error.statusCode = 401;
    throw error;
  }

  const effectiveBranch = await getEffectiveBranchForUser(user);
  const activeBranchId = effectiveBranch.branchId || user.branchId || null;
  const activeBranch = effectiveBranch.branch || user.branch || null;

  const tokenPayload = {
    id: user.id,
    name: user.name,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    roleId: user.roleId || null,
    branchId: activeBranchId,
    homeBranchId: user.branchId,
  };

  // Access token: short-lived (15 menit)
  const token = signToken(tokenPayload, "15m");
  // Refresh token: long-lived (30 hari)
  const refreshToken = signRefreshToken(user.id);

  const permissions = await getPermissionsByRole(user.role);
  const branchScope = effectiveBranch?.scope === "all" ? "all" : "single";

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      roleId: user.roleId || null,
      branchId: activeBranchId,
      homeBranchId: user.branchId,
      branch: activeBranch,
      homeBranch: user.branch,
    },
    token,
    refreshToken,
    access: {
      branchScope,
      permissions,
      branchId: activeBranchId,
      homeBranchId: user.branchId,
    },
  };
};

exports.refresh = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error("Refresh token tidak ditemukan");
    error.statusCode = 401;
    throw error;
  }

  const { verifyRefreshToken, signToken, signRefreshToken } = require("../../core/utils/jwt");
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const error = new Error("Refresh token tidak valid");
    error.statusCode = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { branch: true },
  });

  if (!user || !user.isActive) {
    const error = new Error("Akun tidak ditemukan atau tidak aktif");
    error.statusCode = 401;
    throw error;
  }

  const effectiveBranch = await getEffectiveBranchForUser(user);
  const activeBranchId = effectiveBranch.branchId || user.branchId || null;

  const tokenPayload = {
    id: user.id,
    name: user.name,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    roleId: user.roleId || null,
    branchId: activeBranchId,
    homeBranchId: user.branchId,
  };

  const newToken = signToken(tokenPayload, "15m");
  const newRefreshToken = signRefreshToken(user.id);

  return { token: newToken, refreshToken: newRefreshToken };
};

exports.me = async (tokenUser) => {
  if (!tokenUser?.id) {
    const error = new Error("Anda belum login");
    error.statusCode = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    include: {
      branch: true,
    },
  });

  if (!user) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const effectiveBranch = await getEffectiveBranchForUser(user);
  const activeBranchId = effectiveBranch.branchId || user.branchId || null;
  const activeBranch = effectiveBranch.branch || user.branch || null;
  const permissions = await getPermissionsByRole(user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      roleId: user.roleId || null,
      branchId: activeBranchId,
      homeBranchId: user.branchId,
      branch: activeBranch,
      homeBranch: user.branch,
    },
    access: {
      branchScope: effectiveBranch?.scope === "all" ? "all" : "single",
      permissions,
      branchId: activeBranchId,
      homeBranchId: user.branchId,
    },
  };
};
