import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute() {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return (
      <main className="page-center">
        <div className="loading">
          Checking admin access...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

export default AdminRoute;