import {
  useEffect,
  useState,
} from "react";

import {
  getAdminDashboard,
} from "../services/adminService";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const result =
        await getAdminDashboard();

      setData(result);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        {error}
      </div>
    );
  }

  const stats =
    data?.statistics || {};

  return (
    <div className="admin-page">

      <div className="admin-page-heading">

        <div>
          <span>
            OVERVIEW
          </span>

          <h2>
            Dashboard
          </h2>

          <p>
            Monitor your digital store
            performance.
          </p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>

      </div>


      {stats.pending_payments > 0 && (
        <div className="admin-payment-alert">

          <div className="alert-icon">
            🔴
          </div>

          <div>
            <strong>
              Payment verification required
            </strong>

            <p>
              {stats.pending_payments} payment
              {stats.pending_payments !== 1
                ? "s"
                : ""} waiting for verification.
            </p>
          </div>

          <a href="/admin/orders">
            Review Payments →
          </a>

        </div>
      )}


      <div className="admin-stat-grid">

        <div className="admin-stat-card">
          <span className="stat-icon">
            💰
          </span>

          <span className="stat-label">
            TOTAL REVENUE
          </span>

          <strong>
            ₹
            {Number(
              stats.total_revenue || 0
            ).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </strong>
        </div>


        <div className="admin-stat-card">
          <span className="stat-icon">
            🛒
          </span>

          <span className="stat-label">
            TOTAL ORDERS
          </span>

          <strong>
            {stats.total_orders || 0}
          </strong>
        </div>


        <div className="admin-stat-card">
          <span className="stat-icon">
            👥
          </span>

          <span className="stat-label">
            CUSTOMERS
          </span>

          <strong>
            {stats.total_customers || 0}
          </strong>
        </div>


        <div className="admin-stat-card">
          <span className="stat-icon">
            📦
          </span>

          <span className="stat-label">
            PRODUCTS
          </span>

          <strong>
            {stats.total_products || 0}
          </strong>
        </div>

      </div>


      <div className="admin-section-card">

        <div className="admin-section-header">

          <div>
            <h3>
              Recent Orders
            </h3>

            <p>
              Latest customer purchases.
            </p>
          </div>

          <a href="/admin/orders">
            View All →
          </a>

        </div>


        <div className="admin-table-wrapper">

          <table className="admin-table">

            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>AMOUNT</th>
                <th>PAYMENT</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>

              {data?.recent_orders?.map(
                (order) => (
                  <tr key={order.id}>

                    <td>
                      <strong>
                        {order.order_number}
                      </strong>
                    </td>

                    <td>
                      <div className="table-customer">
                        <strong>
                          {
                            order.customer
                              ?.name
                          }
                        </strong>

                        <span>
                          {
                            order.customer
                              ?.email
                          }
                        </span>
                      </div>
                    </td>

                    <td>
                      ₹
                      {Number(
                        order.total || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${order.payment_status}`}
                      >
                        {order.payment_status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${order.verification_status}`}
                      >
                        {
                          order.verification_status
                        }
                      </span>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;