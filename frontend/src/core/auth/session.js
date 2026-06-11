// Token disimpan di sessionStorage — bertahan saat refresh, hilang saat tab ditutup
// Jauh lebih aman daripada localStorage (tidak persist antar sesi)
// httpOnly cookie refresh token tetap jadi fallback untuk extra security

export function getStoredToken() {
  return sessionStorage.getItem("kruncuy_token_session");
}

export function setToken(token) {
  if (token) {
    sessionStorage.setItem("kruncuy_token_session", token);
  } else {
    sessionStorage.removeItem("kruncuy_token_session");
  }
}

export function getStoredUser() {
  const rawUser = localStorage.getItem("kruncuy_user");
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function getStoredAccess() {
  const rawAccess = localStorage.getItem("kruncuy_access");
  if (!rawAccess) return null;
  try {
    return JSON.parse(rawAccess);
  } catch {
    return null;
  }
}

export function saveSession({ token, user, access }) {
  if (token) {
    sessionStorage.setItem("kruncuy_token_session", token);
  }
  localStorage.setItem("kruncuy_user", JSON.stringify(user));
  if (access) {
    localStorage.setItem("kruncuy_access", JSON.stringify(access));
  }
}

export function updateStoredAccess(access) {
  if (!access) return;
  localStorage.setItem("kruncuy_access", JSON.stringify(access));
}

export function updateStoredUser(user) {
  if (!user) return;
  localStorage.setItem("kruncuy_user", JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem("kruncuy_token_session");
  localStorage.removeItem("kruncuy_token");
  localStorage.removeItem("kruncuy_user");
  localStorage.removeItem("kruncuy_access");
}

export function getHomePathByRole(role) {
  if (role === "OWNER" || role === "SUPERADMIN" || role === "ADMIN" || role === "PURCHASING") {
    return "/erp";
  }
  if (role === "CREW") return "/crew";
  return "/login";
}

export function getRoleLabel(role) {
  if (role === "SUPERADMIN") return "Super Admin";
  if (role === "ADMIN") return "ERP Admin";
  if (role === "PURCHASING") return "Purchasing";
  if (role === "OWNER") return "ERP Admin";
  if (role === "CREW") return "Outlet Crew";
  return "Unknown";
}
