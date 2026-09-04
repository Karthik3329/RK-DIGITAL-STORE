import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function AdminDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="profile-page">

      <div className="profile-container">

        <div className="profile-header">

          <div className="profile-avatar">
            🛡️
          </div>

          <div>
            <span className="profile-label">
              Administrator
            </span>

            <h1>
              Welcome, {user.name}
            </h1>

            <p>
              {user.email}
            </p>
          </div>

        </div>

        <div className="profile-grid">

          <div className="profile-card">
            <span>📊</span>

            <h3>Dashboard</h3>

            <p>
              Store statistics and analytics.
            </p>
          </div>

          <div className="profile-card">
            <span>📦</span>

            <h3>Products</h3>

            <p>
              Manage your digital products.
            </p>
          </div>

          <div className="profile-card">
            <span>🛒</span>

            <h3>Orders</h3>

            <p>
              View and manage customer orders.
            </p>
          </div>

          <div className="profile-card">
            <span>👥</span>

            <h3>Customers</h3>

            <p>
              Manage registered customers.
            </p>
          </div>

          <div className="profile-card">
            <span>🏷️</span>

            <h3>Coupons</h3>

            <p>
              Create and manage discount coupons.
            </p>
          </div>

          <div className="profile-card">
            <span>📈</span>

            <h3>Analytics</h3>

            <p>
              Monitor store performance.
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}

export default AdminDashboard;