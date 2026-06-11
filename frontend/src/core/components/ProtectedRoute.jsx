import { Navigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import {
  getHomePathByRole,
  getStoredAccess,
  getStoredToken,
  getStoredUser,
} from "../auth/session";

export default function ProtectedRoute({ children, allowedRoles, allowedPermissions }) {
  const token = getStoredToken();
  const user = getStoredUser();
  const access = getStoredAccess();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedPermissions?.length) {
    const permissions = access?.permissions || [];
    const hasPermission = allowedPermissions.some((permission) =>
      permissions.includes(permission)
    );

    if (!hasPermission) {
      return <Navigate to={getHomePathByRole(user?.role)} replace />;
    }
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getHomePathByRole(user?.role)} replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
