import { useEffect, useState } from "react";
import api from "../services/api";

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/analytics");

      setAnalytics(response.data);
    } catch (err) {
      console.error(
        "Failed to load analytics:",
        err
      );

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Failed to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-analytics-page">
        <div className="analytics-loading">
          Loading analytics...
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="admin-analytics-page">
        <div className="analytics-error">
          <h2>Unable to load analytics</h2>

          <p>{error}</p>

          <button
            onClick={loadAnalytics}
            className="analytics-retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // ============================================================
  // DATA
  // ============================================================

  const stats = analytics.stats || {};

  const revenueByDay =
    analytics.revenue_by_day || [];

  const productSales =
    analytics.product_sales || [];

  const paymentStats =
    analytics.payment_stats || {};

  const totalProducts =
    Number(stats.total_products || 0);

  const totalCustomers =
    Number(stats.total_customers || 0);

  const totalOrders =
    Number(stats.total_orders || 0);

  const paidOrders =
    Number(stats.paid_orders || 0);

  const pendingPayments =
    Number(stats.pending_payments || 0);

  const rejectedOrders =
    Number(stats.rejected_orders || 0);

  const totalRevenue =
    Number(stats.total_revenue || 0);

  // ============================================================
  // MAX REVENUE FOR BAR CHART
  // ============================================================

  const maxRevenue = Math.max(
    ...revenueByDay.map((item) =>
      Number(item.revenue || 0)
    ),
    1
  );

  // ============================================================
  // MAX PRODUCT SALES
  // ============================================================

  const maxProductSales = Math.max(
    ...productSales.map((item) =>
      Number(
        item.quantity ||
          item.sales ||
          item.total_quantity ||
          0
      )
    ),
    1
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-analytics-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="analytics-header">

        <div>
          <h1>Analytics</h1>

          <p>
            Overview of your digital store
            performance.
          </p>
        </div>

        <button
          className="analytics-refresh-btn"
          onClick={loadAnalytics}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ======================================================
          OVERVIEW CARDS
      ====================================================== */}

      <div className="analytics-stat-grid">

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">
            📦
          </div>

          <div>
            <span>Total Products</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">
            👥
          </div>

          <div>
            <span>Total Customers</span>
            <strong>{totalCustomers}</strong>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">
            🛒
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{totalOrders}</strong>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">
            💰
          </div>

          <div>
            <span>Total Revenue</span>
            <strong>
              {formatCurrency(totalRevenue)}
            </strong>
          </div>
        </div>

      </div>

      {/* ======================================================
          PAYMENT SUMMARY
      ====================================================== */}

      <div className="analytics-section">

        <div className="analytics-section-header">
          <div>
            <h2>Payment Overview</h2>

            <p>
              Manual UPI payment verification
              status.
            </p>
          </div>
        </div>

        <div className="payment-analytics-grid">

          <div className="payment-analytics-card paid">

            <span className="payment-card-icon">
              ✓
            </span>

            <div>
              <span>Paid Orders</span>

              <strong>
                {paidOrders}
              </strong>
            </div>

          </div>

          <div className="payment-analytics-card pending">

            <span className="payment-card-icon">
              ⏳
            </span>

            <div>
              <span>Pending Verification</span>

              <strong>
                {pendingPayments}
              </strong>
            </div>

          </div>

          <div className="payment-analytics-card rejected">

            <span className="payment-card-icon">
              ✕
            </span>

            <div>
              <span>Rejected Orders</span>

              <strong>
                {rejectedOrders}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          REVENUE CHART
      ====================================================== */}

      <div className="analytics-section">

        <div className="analytics-section-header">

          <div>
            <h2>Revenue Overview</h2>

            <p>
              Revenue generated from approved
              payments.
            </p>
          </div>

          <div className="analytics-total-revenue">
            {formatCurrency(totalRevenue)}
          </div>

        </div>

        {revenueByDay.length === 0 ? (
          <div className="analytics-empty">
            No revenue data available.
          </div>
        ) : (
          <div className="revenue-chart">

            {revenueByDay.map(
              (item, index) => {

                const revenue =
                  Number(
                    item.revenue || 0
                  );

                const height =
                  Math.max(
                    (revenue /
                      maxRevenue) *
                      100,
                    4
                  );

                return (
                  <div
                    className="revenue-chart-item"
                    key={
                      item.date ||
                      item._id ||
                      index
                    }
                  >

                    <div className="revenue-bar-wrapper">

                      <div
                        className="revenue-bar"
                        style={{
                          height: `${height}%`,
                        }}
                        title={formatCurrency(
                          revenue
                        )}
                      />

                    </div>

                    <span>
                      {formatDate(
                        item.date ||
                          item._id
                      )}
                    </span>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          PRODUCT SALES
      ====================================================== */}

      <div className="analytics-section">

        <div className="analytics-section-header">

          <div>
            <h2>Product Performance</h2>

            <p>
              Best-selling digital products.
            </p>
          </div>

        </div>

        {productSales.length === 0 ? (
          <div className="analytics-empty">
            No product sales available.
          </div>
        ) : (
          <div className="product-sales-list">

            {productSales.map(
              (product, index) => {

                const quantity =
                  Number(
                    product.quantity ||
                      product.sales ||
                      product.total_quantity ||
                      0
                  );

                const revenue =
                  Number(
                    product.revenue ||
                      product.total_revenue ||
                      0
                  );

                const percentage =
                  Math.max(
                    (quantity /
                      maxProductSales) *
                      100,
                    3
                  );

                return (
                  <div
                    className="product-sales-row"
                    key={
                      product.product_id ||
                      product._id ||
                      index
                    }
                  >

                    <div className="product-sales-rank">
                      #{index + 1}
                    </div>

                    <div className="product-sales-info">

                      <strong>
                        {product.title ||
                          product.product_name ||
                          "Unknown Product"}
                      </strong>

                      <span>
                        {product.product_id ||
                          product.public_product_id ||
                          ""}
                      </span>

                      <div className="product-sales-progress">
                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                    </div>

                    <div className="product-sales-quantity">
                      <strong>
                        {quantity}
                      </strong>

                      <span>
                        sales
                      </span>
                    </div>

                    <div className="product-sales-revenue">
                      {formatCurrency(
                        revenue
                      )}
                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          PAYMENT STATISTICS
      ====================================================== */}

      <div className="analytics-section">

        <div className="analytics-section-header">

          <div>
            <h2>Payment Statistics</h2>

            <p>
              Detailed payment verification
              information.
            </p>
          </div>

        </div>

        <div className="payment-statistics">

          {Object.entries(
            paymentStats
          ).map(([key, value]) => {

            const label = key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
              );

            return (
              <div
                className="payment-stat-row"
                key={key}
              >

                <span>
                  {label}
                </span>

                <strong>
                  {typeof value ===
                  "number"
                    ? value
                    : String(value)}
                </strong>

              </div>
            );
          })}

          {Object.keys(paymentStats)
            .length === 0 && (
            <div className="analytics-empty">
              No payment statistics
              available.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default AdminAnalytics;