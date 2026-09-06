import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function AdminGuard() {
  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();

  // Wait for authentication
  if (loading) {
    return (
      <div className="admin-loading">
        Loading admin panel...
      </div>
    );
  }

  // User is not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // User is not an admin
  if (user.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Admin is authorized
  return <Outlet />;
}

export default AdminGuard;