import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createOrder } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function Checkout() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();

  // ============================================================
  // CUSTOMER
  // ============================================================

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // ============================================================
  // PAYMENT DETAILS
  // ============================================================

  const [paymentDetails, setPaymentDetails] = useState({
    upi_id: "",
    account_name: "",
  });

  // ============================================================
  // QR
  // ============================================================

  const [qrError, setQrError] = useState(false);
  const [qrVersion, setQrVersion] = useState(Date.now());

  const qrUrl = useMemo(() => {
    return `${API_BASE_URL}/payments/qr?v=${qrVersion}`;
  }, [qrVersion]);

  const retryQr = () => {
    setQrError(false);
    setQrVersion(Date.now());
  };

  const openQr = () => {
    window.open(
      qrUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ============================================================
  // COUPON
  // ============================================================

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");

  // ============================================================
  // PAYMENT PROOF
  // ============================================================

  const [paymentReference, setPaymentReference] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  // ============================================================
  // GENERAL
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // SUBTOTAL
  // ============================================================

  const subtotal = useMemo(() => {
    return Number(cartTotal || 0);
  }, [cartTotal]);

  // ============================================================
  // FINAL TOTAL
  // ============================================================

  const finalTotal = useMemo(() => {
    return Math.max(
      subtotal - Number(couponDiscount || 0),
      0
    );
  }, [subtotal, couponDiscount]);

  // ============================================================
  // LOAD PAYMENT DETAILS
  // ============================================================

  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        const response = await api.get(
          "/payments/details"
        );

        setPaymentDetails({
          upi_id: response.data?.upi_id || "",
          account_name:
            response.data?.account_name ||
            "DigitalStore",
        });
      } catch (err) {
        console.error(
          "Payment details error:",
          err
        );
      }
    };

    loadPaymentDetails();
  }, []);

  // ============================================================
  // UPDATE CUSTOMER
  // ============================================================

  useEffect(() => {
    if (!user) return;

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // APPLY COUPON
  // ============================================================

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      setCouponError(
        "Please enter a coupon code."
      );

      setCouponMessage("");

      return;
    }

    if (subtotal <= 0) {
      setCouponError(
        "Your cart total must be greater than ₹0."
      );

      return;
    }

    try {
      setCouponLoading(true);

      setCouponError("");
      setCouponMessage("");

      const response = await api.post(
        "/coupons/validate",
        {
          coupon_code: code,
          subtotal,
        }
      );

      const data = response.data;

      if (!data?.valid) {
        throw new Error(
          "Invalid coupon."
        );
      }

      setAppliedCoupon(data.coupon);

      setCouponDiscount(
        Number(data.discount || 0)
      );

      setCouponMessage(
        `Coupon ${data.coupon.code} applied successfully.`
      );
    } catch (err) {
      console.error(
        "Coupon error:",
        err
      );

      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage("");

      setCouponError(
        typeof err.response?.data?.detail ===
          "string"
          ? err.response.data.detail
          : err.message ||
              "Unable to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // ============================================================
  // REMOVE COUPON
  // ============================================================

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  // ============================================================
  // SCREENSHOT
  // ============================================================

  const handleScreenshotChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      setScreenshot(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      setError(
        "Only JPG, PNG, and WEBP images are allowed."
      );

      setScreenshot(null);
      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Screenshot must be smaller than 5 MB."
      );

      setScreenshot(null);
      event.target.value = "";

      return;
    }

    setError("");
    setScreenshot(file);
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ==========================================================
    // CART
    // ==========================================================

    if (!cartItems.length) {
      setError(
        "Your cart is empty."
      );

      return;
    }

    // ==========================================================
    // CUSTOMER
    // ==========================================================

    if (!formData.name.trim()) {
      setError(
        "Please enter your name."
      );

      return;
    }

    if (!formData.email.trim()) {
      setError(
        "Please enter your email."
      );

      return;
    }

    if (!formData.phone.trim()) {
      setError(
        "Please enter your phone number."
      );

      return;
    }

    // ==========================================================
    // PAYMENT REFERENCE
    // ==========================================================

    if (!paymentReference.trim()) {
      setError(
        "Please enter your payment reference / UTR number."
      );

      return;
    }

    // ==========================================================
    // SCREENSHOT
    // ==========================================================

    if (!screenshot) {
      setError(
        "Please upload your payment screenshot."
      );

      return;
    }

    try {
      setLoading(true);

      // ========================================================
      // CREATE ORDER
      // ========================================================

      const orderData = {
        items: cartItems.map(
          (item) => ({
            product_id:
              item.id || item._id,

            quantity: Number(
              item.quantity || 1
            ),
          })
        ),

        customer: {
          name: formData.name.trim(),

          email:
            formData.email.trim(),

          phone:
            formData.phone.trim(),
        },

        coupon_code:
          appliedCoupon?.code || null,
      };

      console.log(
        "Creating order with:",
        orderData
      );

      const orderResponse =
        await createOrder(
          orderData
        );

      console.log(
        "CREATE ORDER RESPONSE:",
        orderResponse
      );

      // ========================================================
      // IMPORTANT
      // Backend returns the order directly:
      //
      // return serialize_order(order)
      //
      // Therefore:
      //
      // order = orderResponse
      // ========================================================

      const order =
        orderResponse;

      if (!order?.id) {
        console.error(
          "Invalid order response:",
          orderResponse
        );

        throw new Error(
          "Order was not created. Please check the backend response."
        );
      }

      console.log(
        "Order created successfully:",
        order
      );

      // ========================================================
      // PAYMENT PROOF
      // ========================================================

      const uploadData =
        new FormData();

      uploadData.append(
        "payment_reference",
        paymentReference.trim()
      );

      uploadData.append(
        "screenshot",
        screenshot
      );

      console.log(
        "Submitting payment proof..."
      );

      await api.post(
        `/payments/submit-proof/${order.id}`,
        uploadData
      );

      console.log(
        "Payment proof submitted successfully."
      );

      // ========================================================
      // CLEAR CART
      // ========================================================

      clearCart();

      // ========================================================
      // SUCCESS
      // ========================================================

      setSuccess(
        `Payment proof submitted successfully. Order ${order.order_number} is waiting for verification.`
      );

      // ========================================================
      // REDIRECT
      // ========================================================

      setTimeout(() => {
        navigate(
          `/order-success/${order.id}`,
          {
            state: {
              order: {
                ...order,

                payment_status:
                  "payment_submitted",

                verification_status:
                  "pending",

                download_access:
                  false,
              },
            },
          }
        );
      }, 1800);

    } catch (err) {
      console.error(
        "Checkout error:",
        err
      );

      const responseData =
        err.response?.data;

      const detail =
        responseData?.detail;

      let errorMessage =
        "Unable to submit your payment proof.";

      if (
        typeof detail ===
        "string"
      ) {
        errorMessage =
          detail;
      } else if (
        Array.isArray(detail)
      ) {
        errorMessage =
          detail
            .map((item) => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              if (item?.msg) {
                const location =
                  Array.isArray(
                    item.loc
                  )
                    ? item.loc.join(
                        " → "
                      )
                    : "";

                return location
                  ? `${location}: ${item.msg}`
                  : item.msg;
              }

              return JSON.stringify(
                item
              );
            })
            .join("\n");
      } else if (
        typeof responseData?.message ===
        "string"
      ) {
        errorMessage =
          responseData.message;
      } else if (
        err.message
      ) {
        errorMessage =
          err.message;
      }

      setError(
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="checkout-page">

      <div className="checkout-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="checkout-header">

          <span>
            SECURE CHECKOUT
          </span>

          <h1>
            Complete Your{" "}
            <strong>
              Purchase
            </strong>
          </h1>

          <p>
            Pay using UPI and submit
            your payment proof for
            verification.
          </p>

        </div>

        <div className="checkout-grid">

          {/* ==================================================
              LEFT
          ================================================== */}

          <form
            className="checkout-card"
            onSubmit={handleSubmit}
          >

            {/* =================================================
                STEP 01
            ================================================= */}

            <div className="checkout-card-header">

              <div className="checkout-step">
                01
              </div>

              <div>
                <h2>
                  Customer Details
                </h2>

                <p>
                  Enter your contact
                  information.
                </p>
              </div>

            </div>

            <div className="checkout-fields">

              <div className="checkout-field">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={
                    handleChange
                  }
                  placeholder="Your name"
                  required
                />

              </div>

              <div className="checkout-field">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={
                    handleChange
                  }
                  placeholder="you@example.com"
                  required
                />

                <small>
                  Your download link
                  will be sent to this
                  email.
                </small>

              </div>

              <div className="checkout-field">

                <label>
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={
                    handleChange
                  }
                  placeholder="Your phone number"
                  required
                />

              </div>

            </div>

            {/* =================================================
                COUPON
            ================================================= */}

            <div className="checkout-card-header payment-header">

              <div className="checkout-step">
                %
              </div>

              <div>
                <h2>
                  Have a Coupon?
                </h2>

                <p>
                  Apply your discount
                  before payment.
                </p>
              </div>

            </div>

            <div className="coupon-box">

              {!appliedCoupon ? (

                <div className="coupon-input-row">

                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(
                        event.target.value.toUpperCase()
                      );

                      setCouponError("");
                      setCouponMessage("");
                    }}
                    placeholder="Enter coupon code"
                    maxLength={50}
                  />

                  <button
                    type="button"
                    onClick={
                      handleApplyCoupon
                    }
                    disabled={
                      couponLoading
                    }
                    className="coupon-apply-button"
                  >
                    {couponLoading
                      ? "Checking..."
                      : "Apply"}
                  </button>

                </div>

              ) : (

                <div className="coupon-applied">

                  <div>

                    <strong>
                      🎟️{" "}
                      {
                        appliedCoupon.code
                      }
                    </strong>

                    <span>
                      Coupon applied
                      successfully
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleRemoveCoupon
                    }
                    className="coupon-remove-button"
                  >
                    Remove
                  </button>

                </div>

              )}

              {couponMessage && (
                <div className="coupon-success">
                  ✓ {couponMessage}
                </div>
              )}

              {couponError && (
                <div className="coupon-error">
                  {couponError}
                </div>
              )}

            </div>

            {/* =================================================
                STEP 02
            ================================================= */}

            <div className="checkout-card-header payment-header">

              <div className="checkout-step">
                02
              </div>

              <div>
                <h2>
                  Make Payment
                </h2>

                <p>
                  Pay the exact amount
                  using UPI.
                </p>
              </div>

            </div>

            {/* =================================================
                PAYMENT
            ================================================= */}

            <div className="manual-payment-box">

              {/* =================================================
                  QR
              ================================================= */}

              <div className="payment-qr-section">

                <div className="payment-qr-wrapper">

                  {!qrError ? (

                    <button
                      type="button"
                      className="payment-qr-clickable"
                      onClick={
                        openQr
                      }
                      title="Click to open QR in full size"
                    >

                      <img
                        key={qrVersion}
                        src={qrUrl}
                        alt="UPI Payment QR Code"
                        className="payment-qr-image"
                        onError={() => {
                          console.error(
                            "Unable to load payment QR:",
                            qrUrl
                          );

                          setQrError(
                            true
                          );
                        }}
                      />

                    </button>

                  ) : (

                    <div className="payment-qr-error">

                      <span>
                        QR unavailable
                      </span>

                      <small>
                        Use the UPI ID
                        below to make
                        payment.
                      </small>

                      <button
                        type="button"
                        onClick={
                          retryQr
                        }
                        className="payment-qr-retry"
                      >
                        Retry QR
                      </button>

                    </div>

                  )}

                </div>

                <div className="payment-qr-info">

                  <div className="payment-qr-title">
                    SCAN & PAY
                  </div>

                  <p>
                    Scan this QR using
                    Google Pay, PhonePe,
                    Paytm or another UPI
                    app.
                  </p>

                  <small>
                    Click the QR to open
                    it in full size.
                  </small>

                </div>

              </div>

              {/* =================================================
                  AMOUNT
              ================================================= */}

              <div className="payment-amount-label">
                AMOUNT TO PAY
              </div>

              <div className="payment-amount">
                ₹{finalTotal.toFixed(2)}
              </div>

              {/* =================================================
                  UPI
              ================================================= */}

              <div className="payment-upi">

                <span>
                  UPI ID
                </span>

                <strong>
                  {paymentDetails.upi_id ||
                    "Loading..."}
                </strong>

              </div>

              {/* =================================================
                  ACCOUNT
              ================================================= */}

              <div className="payment-account">

                <span>
                  Account Name
                </span>

                <strong>
                  {
                    paymentDetails.account_name ||
                    "DigitalStore"
                  }
                </strong>

              </div>

              {/* =================================================
                  INSTRUCTION
              ================================================= */}

              <div className="payment-instruction">

                <strong>
                  How to pay
                </strong>

                <ol>

                  <li>
                    Open your UPI
                    app.
                  </li>

                  <li>
                    Pay exactly ₹
                    {finalTotal.toFixed(
                      2
                    )}
                    .
                  </li>

                  <li>
                    Copy the UTR /
                    transaction
                    reference.
                  </li>

                  <li>
                    Take a screenshot
                    of the successful
                    payment.
                  </li>

                </ol>

              </div>

            </div>

            {/* =================================================
                STEP 03
            ================================================= */}

            <div className="checkout-card-header payment-header">

              <div className="checkout-step">
                03
              </div>

              <div>
                <h2>
                  Submit Payment Proof
                </h2>

                <p>
                  Upload your payment
                  details for
                  verification.
                </p>
              </div>

            </div>

            <div className="checkout-fields">

              {/* UTR */}

              <div className="checkout-field">

                <label>
                  Payment Reference / UTR
                </label>

                <input
                  type="text"
                  value={
                    paymentReference
                  }
                  onChange={(event) =>
                    setPaymentReference(
                      event.target.value
                    )
                  }
                  placeholder="Enter UTR / transaction reference"
                  required
                />

                <small>
                  Enter the transaction
                  reference shown in your
                  UPI app.
                </small>

              </div>

              {/* SCREENSHOT */}

              <div className="checkout-field">

                <label>
                  Payment Screenshot
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleScreenshotChange
                  }
                  required
                />

                <small>
                  JPG, PNG or WEBP •
                  Maximum 5 MB
                </small>

                {screenshot && (
                  <div className="selected-file">
                    ✓ {screenshot.name}
                  </div>
                )}

              </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="checkout-error">

                {String(error)
                  .split("\n")
                  .map(
                    (
                      message,
                      index
                    ) => (
                      <div
                        key={index}
                      >
                        {message}
                      </div>
                    )
                  )}

              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
              <div className="checkout-success">
                {success}
              </div>
            )}

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              className="checkout-primary-button"
              disabled={loading}
            >
              {loading
                ? "Submitting Payment Proof..."
                : "Submit Payment Proof →"}
            </button>

          </form>

          {/* ==================================================
              RIGHT SUMMARY
          ================================================== */}

          <aside className="checkout-card checkout-summary">

            <div className="checkout-card-header">

              <div className="checkout-step">
                CART
              </div>

              <div>
                <h2>
                  Order Summary
                </h2>

                <p>
                  Your digital products.
                </p>
              </div>

            </div>

            <div className="checkout-items">

              {cartItems.map(
                (item) => (

                  <div
                    className="checkout-item"
                    key={
                      item.id ||
                      item._id
                    }
                  >

                    <div className="checkout-item-info">

                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        Qty:{" "}
                        {
                          item.quantity ||
                          1
                        }
                      </span>

                    </div>

                    <strong>
                      ₹
                      {(
                        Number(
                          item.price
                        ) *
                        Number(
                          item.quantity ||
                            1
                        )
                      ).toFixed(2)}
                    </strong>

                  </div>

                )
              )}

            </div>

            {/* SUBTOTAL */}

            <div className="checkout-total-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹{subtotal.toFixed(2)}
              </strong>

            </div>

            {/* COUPON DISCOUNT */}

            {couponDiscount > 0 && (
              <div className="checkout-total-row coupon-total-row">

                <span>
                  Coupon Discount
                </span>

                <strong>
                  -₹
                  {couponDiscount.toFixed(
                    2
                  )}
                </strong>

              </div>
            )}

            {/* COUPON CODE */}

            {appliedCoupon && (
              <div className="checkout-applied-code">

                🎟️{" "}

                <span>
                  {
                    appliedCoupon.code
                  }
                </span>

              </div>
            )}

            {/* TOTAL */}

            <div className="checkout-grand-total">

              <span>
                Total
              </span>

              <strong>
                ₹{finalTotal.toFixed(2)}
              </strong>

            </div>

            {/* SECURITY */}

            <div className="checkout-security-note">

              🔒 Your payment screenshot
              is securely submitted for
              manual verification.

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}

export default Checkout;