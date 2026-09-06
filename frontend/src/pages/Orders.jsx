import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/my-orders");

      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load orders:", err);

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "order-status-paid";

      case "payment_submitted":
        return "order-status-pending";

      case "payment_rejected":
        return "order-status-rejected";

      case "pending_payment":
        return "order-status-unpaid";

      default:
        return "order-status-default";
    }
  };

  const getStatusLabel = (order) => {
    if (
      order.payment_status === "paid" &&
      order.verification_status === "verified"
    ) {
      return "Payment Approved";
    }

    if (
      order.payment_status === "payment_submitted" ||
      order.verification_status === "pending"
    ) {
      return "Verification Pending";
    }

    if (
      order.payment_status === "rejected" ||
      order.verification_status === "rejected"
    ) {
      return "Payment Rejected";
    }

    return "Payment Pending";
  };

  const getStatusIcon = (order) => {
    if (
      order.payment_status === "paid" &&
      order.verification_status === "verified"
    ) {
      return "✓";
    }

    if (
      order.payment_status === "payment_submitted" ||
      order.verification_status === "pending"
    ) {
      return "⏳";
    }

    if (
      order.payment_status === "rejected" ||
      order.verification_status === "rejected"
    ) {
      return "✕";
    }

    return "○";
  };

  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-container">
          <div className="orders-loading">
            <div className="orders-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="orders-page">
        <div className="orders-container">
          <div className="orders-error">
            <div className="orders-error-icon">!</div>

            <h2>Unable to load orders</h2>

            <p>{error}</p>

            <button
              className="orders-retry-btn"
              onClick={loadOrders}
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="orders-container">

        {/* HEADER */}
        <section className="orders-header">
          <div>
            <span className="orders-eyebrow">
              PURCHASE HISTORY
            </span>

            <h1>My Orders</h1>

            <p>
              View your purchases, payment status and
              download your digital products.
            </p>
          </div>

          <Link
            to="/products"
            className="orders-shop-btn"
          >
            Browse Products
          </Link>
        </section>

        {/* EMPTY */}
        {orders.length === 0 ? (
          <section className="orders-empty">
            <div className="orders-empty-icon">
              🛍️
            </div>

            <h2>No orders yet</h2>

            <p>
              You haven't purchased any digital products yet.
            </p>

            <Link
              to="/products"
              className="orders-primary-btn"
            >
              Explore Products
            </Link>
          </section>
        ) : (
          <section className="orders-list">

            {orders.map((order) => (
              <article
                className="customer-order-card"
                key={order.id}
              >

                {/* ORDER TOP */}
                <div className="customer-order-top">

                  <div className="customer-order-info">

                    <span className="customer-order-label">
                      ORDER
                    </span>

                    <strong>
                      {order.order_number}
                    </strong>

                    <span className="customer-order-date">
                      {formatDate(order.created_at)}
                    </span>

                  </div>

                  <div
                    className={`customer-order-status ${getStatusClass(
                      order.status
                    )}`}
                  >
                    <span>
                      {getStatusIcon(order)}
                    </span>

                    {getStatusLabel(order)}
                  </div>

                </div>

                {/* PRODUCTS */}
                <div className="customer-order-products">

                  {order.items?.map((item, index) => (
                    <div
                      className="customer-order-product"
                      key={
                        item.product_id ||
                        item.id ||
                        `${order.id}-${index}`
                      }
                    >

                      <div className="customer-product-image">

                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title || "Product"}
                          />
                        ) : (
                          <span>📦</span>
                        )}

                      </div>

                      <div className="customer-product-details">

                        <h3>
                          {item.title ||
                            item.product_name ||
                            "Digital Product"}
                        </h3>

                        {item.product_id && (
                          <span>
                            Product ID: {item.product_id}
                          </span>
                        )}

                        <small>
                          Quantity: {item.quantity || 1}
                        </small>

                      </div>

                      <div className="customer-product-price">
                        {formatCurrency(
                          item.price || 0
                        )}
                      </div>

                    </div>
                  ))}

                </div>

                {/* PAYMENT DETAILS */}
                <div className="customer-order-payment">

                  <div className="customer-payment-item">
                    <span>Subtotal</span>
                    <strong>
                      {formatCurrency(order.subtotal)}
                    </strong>
                  </div>

                  {Number(order.discount || 0) > 0 && (
                    <div className="customer-payment-item">
                      <span>Discount</span>

                      <strong className="discount-value">
                        -
                        {formatCurrency(
                          order.discount
                        )}
                      </strong>
                    </div>
                  )}

                  <div className="customer-payment-item customer-payment-total">
                    <span>Total</span>

                    <strong>
                      {formatCurrency(order.total)}
                    </strong>
                  </div>

                </div>

                {/* PAYMENT REFERENCE */}
                {order.payment_reference && (
                  <div className="customer-transaction">

                    <div>
                      <span>
                        Transaction / UTR
                      </span>

                      <strong>
                        {order.payment_reference}
                      </strong>
                    </div>

                    <span className="transaction-submitted">
                      Payment proof submitted
                    </span>

                  </div>
                )}

                {/* REJECTION */}
                {order.rejection_reason && (
                  <div className="customer-rejection">

                    <strong>
                      Payment Rejected
                    </strong>

                    <p>
                      {order.rejection_reason}
                    </p>

                  </div>
                )}

                {/* ACTIONS */}
                <div className="customer-order-actions">

                  {order.download_access &&
                  order.payment_status === "paid" ? (
                    <Link
                      to={`/order-success/${order.id}`}
                      className="customer-download-btn"
                    >
                      ↓ Download Product
                    </Link>
                  ) : order.payment_status ===
                    "payment_submitted" ? (
                    <div className="customer-pending-message">
                      ⏳ Payment is being manually verified
                    </div>
                  ) : order.payment_status ===
                    "rejected" ? (
                    <div className="customer-rejected-message">
                      ✕ Payment verification failed
                    </div>
                  ) : (
                    <Link
                      to={`/checkout?order=${order.id}`}
                      className="customer-pay-btn"
                    >
                      Complete Payment
                    </Link>
                  )}

                </div>

              </article>
            ))}

          </section>
        )}

      </div>
    </main>
  );
}

export default Orders;