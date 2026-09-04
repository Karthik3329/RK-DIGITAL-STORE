import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getMyOrder } from "../services/orderService";
import { useAuth } from "../context/AuthContext";

function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(
    location.state?.order || null
  );

  const [loading, setLoading] = useState(
    !location.state?.order
  );

  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId || !user) {
        return;
      }

      /*
       * If we already have order data from checkout,
       * still fetch the latest version from backend.
       *
       * This is important because payment status may
       * have changed after checkout.
       */
      try {
        setLoading(true);
        setError("");

        const response = await getMyOrder(orderId);

        setOrder(response);
      } catch (err) {
        console.error(
          "Unable to load order:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to load your order."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      loadOrder();
    }
  }, [orderId, user, authLoading]);

  /*
   * Wait for authentication restoration
   */
  if (authLoading) {
    return (
      <main className="order-success-page">
        <div className="order-success-loading">
          <span className="success-spinner"></span>
          <p>Loading your order...</p>
        </div>
      </main>
    );
  }

  /*
   * User isn't logged in
   */
  if (!user) {
    return (
      <main className="order-success-page">
        <div className="order-success-message">
          <div className="order-success-message-icon">
            🔐
          </div>

          <h2>Login Required</h2>

          <p>
            Please login to view your order.
          </p>

          <button
            className="success-primary-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  /*
   * Loading
   */
  if (loading && !order) {
    return (
      <main className="order-success-page">
        <div className="order-success-loading">
          <span className="success-spinner"></span>
          <p>Loading order details...</p>
        </div>
      </main>
    );
  }

  /*
   * Error
   */
  if (error && !order) {
    return (
      <main className="order-success-page">
        <div className="order-success-message">
          <div className="order-success-message-icon error-icon">
            !
          </div>

          <h2>Order Not Found</h2>

          <p>{error}</p>

          <div className="success-message-actions">
            <Link
              to="/products"
              className="success-secondary-button"
            >
              Browse Products
            </Link>

            <Link
              to="/profile"
              className="success-primary-link"
            >
              My Profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  /*
   * Order status
   */
  const isPaid =
    order.payment_status === "paid";

  const isVerified =
    order.verification_status === "verified";

  const hasDownloadAccess =
    order.download_access === true;

  return (
    <main className="order-success-page">

      <div className="order-success-container">

        {/* ==========================================
            SUCCESS HERO
        ========================================== */}

        <section className="success-hero">

          <div className="success-check-circle">
            <span>✓</span>
          </div>

          <div className="success-badge">
            <span></span>
            ORDER RECEIVED
          </div>

          <h1>
            Payment{" "}
            <span>Successful!</span>
          </h1>

          <p>
            Thank you for your purchase.
            Your payment has been received
            successfully.
          </p>

        </section>


        {/* ==========================================
            ORDER NUMBER
        ========================================== */}

        <section className="order-number-card">

          <div>
            <span className="order-label">
              ORDER REFERENCE
            </span>

            <strong>
              {order.order_number}
            </strong>
          </div>

          <div className="order-status-pill paid">
            <span></span>
            Payment Received
          </div>

        </section>


        {/* ==========================================
            STATUS TIMELINE
        ========================================== */}

        <section className="verification-card">

          <div className="verification-header">

            <div className="verification-icon">
              🔐
            </div>

            <div>
              <h2>
                Order Verification
              </h2>

              <p>
                Your payment has been received.
                We're completing the verification
                process before unlocking your files.
              </p>
            </div>

          </div>


          <div className="verification-timeline">

            {/* Payment */}

            <div className="timeline-item completed">

              <div className="timeline-dot">
                ✓
              </div>

              <div className="timeline-content">
                <strong>
                  Payment Received
                </strong>

                <span>
                  Razorpay payment successfully
                  verified.
                </span>
              </div>

            </div>


            <div className="timeline-line completed"></div>


            {/* Verification */}

            <div
              className={`timeline-item ${
                isVerified
                  ? "completed"
                  : "current"
              }`}
            >

              <div className="timeline-dot">

                {isVerified ? "✓" : "2"}

              </div>

              <div className="timeline-content">

                <strong>
                  Order Verification
                </strong>

                <span>
                  {isVerified
                    ? "Your order has been verified."
                    : "Waiting for admin verification."}
                </span>

              </div>

            </div>


            <div
              className={`timeline-line ${
                isVerified
                  ? "completed"
                  : ""
              }`}
            ></div>


            {/* Download */}

            <div
              className={`timeline-item ${
                hasDownloadAccess
                  ? "completed"
                  : "locked"
              }`}
            >

              <div className="timeline-dot">

                {hasDownloadAccess
                  ? "✓"
                  : "🔒"}

              </div>

              <div className="timeline-content">

                <strong>
                  Digital Download
                </strong>

                <span>
                  {hasDownloadAccess
                    ? "Your download is ready."
                    : "Download will unlock after verification."}
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* ==========================================
            ORDER DETAILS
        ========================================== */}

        <section className="success-content-grid">

          {/* Products */}

          <div className="success-card">

            <div className="success-card-heading">

              <div>
                <span>
                  YOUR PURCHASE
                </span>

                <h2>
                  Order Items
                </h2>
              </div>

              <span className="item-count">
                {order.items?.length || 0}{" "}
                {order.items?.length === 1
                  ? "Item"
                  : "Items"}
              </span>

            </div>


            <div className="success-items">

              {order.items?.map((item, index) => (
                <div
                  className="success-item"
                  key={
                    item.product_id ||
                    `${item.title}-${index}`
                  }
                >

                  <div className="success-item-image">
                    <span>📦</span>
                  </div>

                  <div className="success-item-info">

                    <h3>
                      {item.title}
                    </h3>

                    <span>
                      Qty: {item.quantity}
                    </span>

                  </div>

                  <strong>
                    ₹
                    {Number(
                      item.total || 0
                    ).toFixed(2)}
                  </strong>

                </div>
              ))}

            </div>


            <div className="success-total">

              <span>
                Total Paid
              </span>

              <strong>
                ₹
                {Number(
                  order.total || 0
                ).toFixed(2)}
              </strong>

            </div>

          </div>


          {/* Customer information */}

          <div className="success-card">

            <div className="success-card-heading">

              <div>
                <span>
                  CUSTOMER
                </span>

                <h2>
                  Account Details
                </h2>
              </div>

            </div>


            <div className="customer-details">

              <div className="customer-detail">

                <span>
                  👤
                </span>

                <div>
                  <small>
                    Name
                  </small>

                  <strong>
                    {order.customer?.name ||
                      user.name}
                  </strong>
                </div>

              </div>


              <div className="customer-detail">

                <span>
                  ✉️
                </span>

                <div>
                  <small>
                    Email
                  </small>

                  <strong>
                    {order.customer?.email ||
                      user.email}
                  </strong>
                </div>

              </div>


              <div className="customer-detail">

                <span>
                  📱
                </span>

                <div>
                  <small>
                    Phone
                  </small>

                  <strong>
                    {order.customer?.phone ||
                      user.phone ||
                      "Not provided"}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ==========================================
            DOWNLOAD ACCESS
        ========================================== */}

        <section
          className={`download-status-card ${
            hasDownloadAccess
              ? "download-ready"
              : ""
          }`}
        >

          <div className="download-status-icon">

            {hasDownloadAccess
              ? "⬇️"
              : "🔒"}

          </div>

          <div className="download-status-content">

            <span className="download-status-label">
              {hasDownloadAccess
                ? "DOWNLOAD READY"
                : "DOWNLOAD LOCKED"}
            </span>

            <h2>
              {hasDownloadAccess
                ? "Your digital product is ready!"
                : "Your download is being prepared"}
            </h2>

            <p>
              {hasDownloadAccess
                ? "You can now access your purchased digital files."
                : "Your payment has been received. Once the order is verified, your digital download will be unlocked automatically."}
            </p>

          </div>


          {hasDownloadAccess && (
            <Link
              to="/downloads"
              className="download-button"
            >
              Go to Downloads →
            </Link>
          )}

        </section>


        {/* ==========================================
            ACTIONS
        ========================================== */}

        <div className="success-actions">

          <Link
            to="/products"
            className="success-secondary-button"
          >
            Continue Shopping
          </Link>

          <Link
            to="/profile"
            className="success-primary-link"
          >
            View My Account →
          </Link>

        </div>


        {/* ==========================================
            TRUST
        ========================================== */}

        <div className="success-trust">

          <div>
            <span>🔒</span>
            Secure Payment
          </div>

          <div>
            <span>✓</span>
            Payment Verified
          </div>

          <div>
            <span>⚡</span>
            Digital Delivery
          </div>

          <div>
            <span>🛡️</span>
            Protected Order
          </div>

        </div>

      </div>

    </main>
  );
}

export default OrderSuccess;