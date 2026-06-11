const prisma = require("../config/prisma");
const accessControlService = require("./accessControl.service");

function getTodayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

exports.getActiveBranchAssignment = async (userId, date = new Date()) => {
  const { start, end } = getTodayRange(date);

  return prisma.branchAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      AND: [
        { startDate: { lte: end } },
        {
          OR: [{ endDate: null }, { endDate: { gte: start } }],
        },
      ],
    },
    include: {
      branch: true,
    },
    orderBy: [
      { isPrimary: "desc" },
      { updatedAt: "desc" },
    ],
  });
};

exports.getEffectiveBranchForUser = async (user, requestedBranchId = null) => {
  const roleCode = accessControlService.resolveRoleCode(user?.role) || user.role;
  const hasGlobalAccess = await accessControlService.canAccessAllBranches(roleCode);

  if (hasGlobalAccess) {
    if (!requestedBranchId) {
      return {
        branchId: null,
        scope: "all",
        branch: null,
      };
    }

    const branch = await prisma.branch.findUnique({
      where: { id: requestedBranchId },
    });

    return {
      branchId: branch?.id || null,
      scope: "single",
      branch,
    };
  }

  const assignment = await exports.getActiveBranchAssignment(user.id);
  const activeBranchId = assignment?.branchId || user.branchId || null;

  if (requestedBranchId && requestedBranchId !== activeBranchId) {
    return {
      branchId: null,
      scope: "forbidden",
      branch: null,
    };
  }

  return {
    branchId: activeBranchId,
    scope: "single",
    branch: assignment?.branch || null,
    assignment,
  };
};

exports.getTodayRange = getTodayRange;
