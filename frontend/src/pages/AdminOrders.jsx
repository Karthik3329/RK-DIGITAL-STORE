import { useEffect, useState } from "react";
import api from "../services/api";

function AdminOrders() {
  // ============================================================
  // STATE
  // ============================================================

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [selectedScreenshot, setSelectedScreenshot] =
    useState(null);

  const [screenshotLoading, setScreenshotLoading] =
    useState(false);

  const [rejectOrder, setRejectOrder] =
    useState(null);

  const [rejectReason, setRejectReason] =
    useState("");

  // Used for Approve / Reject / Delete
  const [processingOrder, setProcessingOrder] =
    useState(null);

  // ============================================================
  // LOAD ORDERS
  // ============================================================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/orders");

      setOrders(
        Array.isArray(response.data?.orders)
          ? response.data.orders
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load orders:",
        error
      );

      const detail =
        error.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ============================================================
  // FILTER ORDERS
  // ============================================================

  const filteredOrders = orders.filter((order) => {
    if (filter === "pending") {
      return (
        order.payment_status ===
          "payment_submitted" &&
        order.verification_status ===
          "pending"
      );
    }

    if (filter === "approved") {
      return (
        order.payment_status === "paid" ||
        order.verification_status === "verified"
      );
    }

    if (filter === "rejected") {
      return (
        order.payment_status === "rejected" ||
        order.verification_status === "rejected"
      );
    }

    return true;
  });

  // ============================================================
  // STATS
  // ============================================================

  const pendingCount = orders.filter(
    (order) =>
      order.payment_status ===
        "payment_submitted" &&
      order.verification_status ===
        "pending"
  ).length;

  const approvedCount = orders.filter(
    (order) =>
      order.payment_status === "paid" ||
      order.verification_status === "verified"
  ).length;

  const rejectedCount = orders.filter(
    (order) =>
      order.payment_status === "rejected" ||
      order.verification_status === "rejected"
  ).length;

  // ============================================================
  // VIEW SCREENSHOT
  // ============================================================

  const viewScreenshot = async (orderId) => {
    try {
      setScreenshotLoading(true);

      const response = await api.get(
        `/admin/orders/${orderId}/payment-proof`,
        {
          responseType: "blob",
        }
      );

      const imageUrl = URL.createObjectURL(
        response.data
      );

      setSelectedScreenshot(imageUrl);
    } catch (error) {
      console.error(
        "Failed to load screenshot:",
        error
      );

      const detail =
        error.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "Unable to load payment screenshot."
      );
    } finally {
      setScreenshotLoading(false);
    }
  };

  // ============================================================
  // CLOSE SCREENSHOT
  // ============================================================

  const closeScreenshot = () => {
    if (selectedScreenshot) {
      URL.revokeObjectURL(
        selectedScreenshot
      );
    }

    setSelectedScreenshot(null);
  };

  // ============================================================
  // APPROVE PAYMENT
  // ============================================================

  const approvePayment = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this payment?\n\n" +
        "The order will be marked as PAID.\n" +
        "A secure download link will be generated.\n" +
        "The customer will receive the download link by Gmail."
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingOrder(orderId);

      const response = await api.put(
        `/admin/orders/${orderId}/approve-payment`
      );

      console.log(
        "Payment approval response:",
        response.data
      );

      if (
        response.data?.email_sent === false
      ) {
        alert(
          "✅ Payment approved successfully.\n\n" +
            "⚠️ The secure download link was generated, " +
            "but the Gmail could not be sent.\n\n" +
            "Please check your Gmail SMTP configuration."
        );
      } else {
        alert(
          "✅ Payment approved successfully!\n\n" +
            "📧 The secure download link has been sent " +
            "to the customer's Gmail."
        );
      }

      await loadOrders();
    } catch (error) {
      console.error(
        "Approve payment failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "Failed to approve payment."
      );
    } finally {
      setProcessingOrder(null);
    }
  };

  // ============================================================
  // OPEN REJECT MODAL
  // ============================================================

  const openRejectModal = (order) => {
    setRejectOrder(order);
    setRejectReason("");
  };

  // ============================================================
  // CLOSE REJECT MODAL
  // ============================================================

  const closeRejectModal = () => {
    setRejectOrder(null);
    setRejectReason("");
  };

  // ============================================================
  // SUBMIT REJECT
  // ============================================================

  const submitReject = async () => {
    if (!rejectOrder) {
      return;
    }

    if (!rejectReason.trim()) {
      alert(
        "Please enter a reason for rejecting the payment."
      );
      return;
    }

    try {
      setProcessingOrder(
        rejectOrder.id
      );

      await api.put(
        `/admin/orders/${rejectOrder.id}/reject-payment`,
        {
          reason: rejectReason.trim(),
        }
      );

      alert(
        "❌ Payment rejected successfully."
      );

      closeRejectModal();

      await loadOrders();
    } catch (error) {
      console.error(
        "Payment rejection failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "Failed to reject payment."
      );
    } finally {
      setProcessingOrder(null);
    }
  };

  // ============================================================
  // DELETE ORDER
  // ============================================================

  const deleteOrder = async (order) => {
    const confirmed = window.confirm(
      `Delete order ${order.order_number}?\n\n` +
        `Amount: ₹${Number(
          order.total || 0
        ).toFixed(2)}\n\n` +
        "This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingOrder(order.id);

      await api.delete(
        `/admin/orders/${order.id}`
      );

      setOrders((currentOrders) =>
        currentOrders.filter(
          (item) =>
            item.id !== order.id
        )
      );

      alert(
        "🗑 Order deleted successfully."
      );
    } catch (error) {
      console.error(
        "Order deletion failed:",
        error
      );

      const detail =
        error.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "Failed to delete order."
      );
    } finally {
      setProcessingOrder(null);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleString(
      "en-IN"
    );
  };

  // ============================================================
  // PAYMENT STATUS
  // ============================================================

  const getPaymentStatus = (order) => {
    if (
      order.payment_status === "paid" ||
      order.verification_status ===
        "verified"
    ) {
      return {
        label: "Paid",
        className: "status-paid",
      };
    }

    if (
      order.payment_status ===
        "rejected" ||
      order.verification_status ===
        "rejected"
    ) {
      return {
        label: "Rejected",
        className: "status-rejected",
      };
    }

    if (
      order.payment_status ===
        "payment_submitted" ||
      order.verification_status ===
        "pending"
    ) {
      return {
        label: "Pending Verification",
        className: "status-pending",
      };
    }

    return {
      label: "Unpaid",
      className: "status-unpaid",
    };
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-orders-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="admin-page-header">

        <div>
          <h1>Orders</h1>

          <p>
            Manually verify customer payments
            and manage download access.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={loadOrders}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ======================================================
          STATS
          ====================================================== */}

      <div className="admin-order-stats">

        <div className="admin-order-stat">
          <span>
            Pending Verification
          </span>

          <strong>
            {pendingCount}
          </strong>
        </div>

        <div className="admin-order-stat">
          <span>Approved</span>

          <strong>
            {approvedCount}
          </strong>
        </div>

        <div className="admin-order-stat">
          <span>Rejected</span>

          <strong>
            {rejectedCount}
          </strong>
        </div>

        <div className="admin-order-stat">
          <span>Total Orders</span>

          <strong>
            {orders.length}
          </strong>
        </div>

      </div>

      {/* ======================================================
          FILTERS
          ====================================================== */}

      <div className="admin-order-filters">

        <button
          type="button"
          className={
            filter === "pending"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("pending")
          }
        >
          Pending
        </button>

        <button
          type="button"
          className={
            filter === "approved"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("approved")
          }
        >
          Approved
        </button>

        <button
          type="button"
          className={
            filter === "rejected"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("rejected")
          }
        >
          Rejected
        </button>

        <button
          type="button"
          className={
            filter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("all")
          }
        >
          All Orders
        </button>

      </div>

      {/* ======================================================
          ORDERS TABLE
          ====================================================== */}

      <div className="admin-orders-table-container">

        {loading ? (

          <div className="admin-orders-loading">
            Loading orders...
          </div>

        ) : filteredOrders.length === 0 ? (

          <div className="admin-orders-empty">
            No orders found.
          </div>

        ) : (

          <table className="admin-orders-table">

            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>AMOUNT</th>
                <th>
                  TRANSACTION / UTR
                </th>
                <th>PAYMENT</th>
                <th>SCREENSHOT</th>
                <th>DOWNLOAD</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {filteredOrders.map(
                (order) => {

                  const paymentStatus =
                    getPaymentStatus(
                      order
                    );

                  const isPending =
                    order.payment_status ===
                      "payment_submitted" &&
                    order.verification_status ===
                      "pending";

                  const isProcessing =
                    processingOrder ===
                    order.id;

                  return (
                    <tr
                      key={order.id}
                    >

                      {/* ========================================
                          ORDER
                          ======================================== */}

                      <td>

                        <div className="order-number">
                          {order.order_number}
                        </div>

                        <div className="order-product-count">
                          {order.items?.length ||
                            0}{" "}
                          product
                          {order.items?.length ===
                          1
                            ? ""
                            : "s"}
                        </div>

                      </td>

                      {/* ========================================
                          CUSTOMER
                          ======================================== */}

                      <td>

                        <div className="customer-name">
                          {order.customer
                            ?.name || "-"}
                        </div>

                        <div className="customer-email">
                          {order.customer
                            ?.email || "-"}
                        </div>

                        {order.customer
                          ?.phone && (
                          <div className="customer-phone">
                            {
                              order
                                .customer
                                .phone
                            }
                          </div>
                        )}

                      </td>

                      {/* ========================================
                          AMOUNT
                          ======================================== */}

                      <td>

                        <strong className="order-amount">
                          ₹
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </strong>

                        {Number(
                          order.discount || 0
                        ) > 0 && (
                          <div className="order-discount">
                            Discount: ₹
                            {Number(
                              order.discount
                            ).toFixed(2)}
                          </div>
                        )}

                      </td>

                      {/* ========================================
                          TRANSACTION / UTR
                          ======================================== */}

                      <td>

                        {order.payment_reference ? (

                          <div className="transaction-box">

                            <span className="transaction-label">
                              UTR / Reference
                            </span>

                            <strong className="transaction-id">
                              {
                                order.payment_reference
                              }
                            </strong>

                          </div>

                        ) : (

                          <span className="not-submitted">
                            Not submitted
                          </span>

                        )}

                      </td>

                      {/* ========================================
                          PAYMENT
                          ======================================== */}

                      <td>

                        <span
                          className={`payment-status ${paymentStatus.className}`}
                        >
                          {
                            paymentStatus.label
                          }
                        </span>

                      </td>

                      {/* ========================================
                          SCREENSHOT
                          ======================================== */}

                      <td>

                        {order.payment_screenshot ? (

                          <button
                            type="button"
                            className="view-screenshot-btn"
                            onClick={() =>
                              viewScreenshot(
                                order.id
                              )
                            }
                            disabled={
                              screenshotLoading ||
                              isProcessing
                            }
                          >
                            🖼 View Screenshot
                          </button>

                        ) : (

                          <span className="not-submitted">
                            No screenshot
                          </span>

                        )}

                      </td>

                      {/* ========================================
                          DOWNLOAD
                          ======================================== */}

                      <td>

                        {order.download_access ? (

                          <span className="download-enabled">
                            🔓 Enabled
                          </span>

                        ) : (

                          <span className="download-locked">
                            🔒 Locked
                          </span>

                        )}

                      </td>

                      {/* ========================================
                          DATE
                          ======================================== */}

                      <td>

                        <span className="order-date">
                          {formatDate(
                            order.created_at
                          )}
                        </span>

                      </td>

                      {/* ========================================
                          ACTIONS
                          ======================================== */}

                      <td>

                        <div className="admin-action-buttons">

                          {/* VIEW */}

                          {order.payment_screenshot && (

                            <button
                              type="button"
                              className="admin-action-btn admin-view-btn"
                              onClick={() =>
                                viewScreenshot(
                                  order.id
                                )
                              }
                              disabled={
                                isProcessing ||
                                screenshotLoading
                              }
                              title="View payment screenshot"
                            >
                              👁 View
                            </button>

                          )}

                          {/* APPROVE */}

                          {isPending && (

                            <button
                              type="button"
                              className="admin-action-btn admin-approve-btn"
                              onClick={() =>
                                approvePayment(
                                  order.id
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              title="Approve payment"
                            >
                              {isProcessing
                                ? "Approving..."
                                : "✓ Approve"}
                            </button>

                          )}

                          {/* REJECT */}

                          {isPending && (

                            <button
                              type="button"
                              className="admin-action-btn admin-reject-btn"
                              onClick={() =>
                                openRejectModal(
                                  order
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              title="Reject payment"
                            >
                              ✕ Reject
                            </button>

                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            className="admin-action-btn admin-delete-btn"
                            onClick={() =>
                              deleteOrder(
                                order
                              )
                            }
                            disabled={
                              isProcessing
                            }
                            title="Delete order"
                          >
                            {isProcessing
                              ? "Deleting..."
                              : "🗑 Delete"}
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* ======================================================
          SCREENSHOT MODAL
          ====================================================== */}

      {selectedScreenshot && (

        <div
          className="payment-screenshot-overlay"
          onClick={
            closeScreenshot
          }
        >

          <div
            className="payment-screenshot-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="payment-screenshot-header">

              <h2>
                Payment Screenshot
              </h2>

              <button
                type="button"
                onClick={
                  closeScreenshot
                }
                className="close-modal-btn"
              >
                ×
              </button>

            </div>

            <div className="payment-screenshot-body">

              <img
                src={selectedScreenshot}
                alt="Customer payment proof"
              />

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          REJECT MODAL
          ====================================================== */}

      {rejectOrder && (

        <div className="reject-modal-overlay">

          <div className="reject-modal">

            <div className="reject-modal-header">

              <div>

                <h2>
                  Reject Payment
                </h2>

                <p>
                  {
                    rejectOrder.order_number
                  }
                </p>

              </div>

              <button
                type="button"
                className="close-modal-btn"
                onClick={
                  closeRejectModal
                }
              >
                ×
              </button>

            </div>

            <div className="reject-modal-content">

              <div className="reject-order-info">

                <div>

                  <span>
                    Amount
                  </span>

                  <strong>
                    ₹
                    {Number(
                      rejectOrder.total ||
                        0
                    ).toFixed(2)}
                  </strong>

                </div>

                <div>

                  <span>
                    Transaction / UTR
                  </span>

                  <strong>
                    {
                      rejectOrder.payment_reference ||
                      "Not submitted"
                    }
                  </strong>

                </div>

              </div>

              <label>
                Rejection Reason
              </label>

              <textarea
                value={
                  rejectReason
                }
                onChange={(event) =>
                  setRejectReason(
                    event.target.value
                  )
                }
                placeholder="Example: Payment not received / incorrect amount / invalid UTR..."
                rows="4"
              />

              <div className="reject-modal-actions">

                <button
                  type="button"
                  className="cancel-reject-btn"
                  onClick={
                    closeRejectModal
                  }
                  disabled={
                    processingOrder ===
                    rejectOrder.id
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-reject-btn"
                  onClick={
                    submitReject
                  }
                  disabled={
                    processingOrder ===
                    rejectOrder.id
                  }
                >
                  {processingOrder ===
                  rejectOrder.id
                    ? "Rejecting..."
                    : "Reject Payment"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminOrders;