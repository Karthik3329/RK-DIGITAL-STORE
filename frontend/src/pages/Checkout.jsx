import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [paymentDetails, setPaymentDetails] = useState({ upi_id: "", account_name: "" });
  const [qrError, setQrError] = useState(false);
  const [qrVersion, setQrVersion] = useState(Date.now());
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const subtotal = useMemo(() => Number(cartTotal || 0), [cartTotal]);
  const finalTotal = useMemo(
    () => Math.max(0, subtotal - Number(couponDiscount || 0)),
    [subtotal, couponDiscount]
  );
  const isFreeOrder = finalTotal <= 0;
  const qrUrl = useMemo(
    () => `${API_BASE_URL}/payments/qr?v=${qrVersion}`,
    [qrVersion]
  );

  useEffect(() => {
    let active = true;
    api.get("/payments/details")
      .then(({ data }) => {
        if (active) setPaymentDetails({
          upi_id: data?.upi_id || "",
          account_name: data?.account_name || "DigitalStore",
        });
      })
      .catch((err) => console.error("Payment details error:", err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (user) setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const retryQr = () => {
    setQrError(false);
    setQrVersion(Date.now());
  };

  const openQr = () => window.open(qrUrl, "_blank", "noopener,noreferrer");

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      setCouponMessage("");
      return;
    }
    if (subtotal <= 0) {
      setCouponError("Your cart total must be greater than ₹0.");
      return;
    }
    try {
      setCouponLoading(true);
      setCouponError("");
      setCouponMessage("");
      const { data } = await api.post("/coupons/validate", {
        coupon_code: code,
        subtotal,
      });
      if (!data?.valid || !data?.coupon) throw new Error("Invalid coupon.");
      setAppliedCoupon(data.coupon);
      setCouponDiscount(Number(data.discount || 0));
      setCouponMessage(`Coupon ${data.coupon.code} applied successfully.`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage("");
      setCouponError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.message || "Unable to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setScreenshot(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      setScreenshot(null);
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot must be smaller than 5 MB.");
      setScreenshot(null);
      event.target.value = "";
      return;
    }
    setError("");
    setScreenshot(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");

    if (!cartItems.length) return setError("Your cart is empty.");
    if (!formData.name.trim()) return setError("Please enter your name.");
    if (!formData.email.trim()) return setError("Please enter your email.");
    if (!formData.phone.trim()) return setError("Please enter your phone number.");

    if (!isFreeOrder) {
      if (!paymentReference.trim()) {
        return setError("Please enter your payment reference / UTR number.");
      }
      if (!screenshot) return setError("Please upload your payment screenshot.");
    }

    try {
      setLoading(true);
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.id || item._id,
          quantity: Number(item.quantity || 1),
        })),
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        coupon_code: appliedCoupon?.code || null,
      };

      // Order prices, coupon discounts, and free eligibility MUST be checked server-side.
      const orderResponse = await createOrder(orderData);
      const order = orderResponse?.data?.id ? orderResponse.data : orderResponse;
      if (!order?.id) throw new Error("Order was not created. Please check the backend response.");

      if (isFreeOrder) {
        // The order creation API must approve genuine free orders itself.
        // Never fake payment_status or download_access on the client.
        if (order.payment_status !== "paid" || order.download_access !== true) {
          throw new Error(
            `Order ${order.order_number || order.id} was created, but free download access ` +
            "was not activated by the backend. Please contact support."
          );
        }
        clearCart();
        navigate(`/order-success/${order.id}`, { state: { order } });
        return;
      }

      const uploadData = new FormData();
      uploadData.append("payment_reference", paymentReference.trim());
      uploadData.append("screenshot", screenshot);
      await api.post(`/payments/submit-proof/${order.id}`, uploadData);

      clearCart();
      setSuccess(
        `Payment proof submitted successfully. Order ${order.order_number} is waiting for verification.`
      );
      setTimeout(() => {
        navigate(`/order-success/${order.id}`, {
          state: {
            order: {
              ...order,
              payment_status: "payment_submitted",
              verification_status: "pending",
              download_access: false,
            },
          },
        });
      }, 1800);
    } catch (err) {
      console.error("Checkout error:", err);
      const detail = err.response?.data?.detail;
      let message = "Unable to complete checkout.";
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail)) {
        message = detail.map((item) =>
          typeof item === "string"
            ? item
            : `${Array.isArray(item.loc) ? `${item.loc.join(" → ")}: ` : ""}${item.msg || JSON.stringify(item)}`
        ).join("\n");
      } else if (err.response?.data?.message) message = err.response.data.message;
      else if (err.message) message = err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <span>SECURE CHECKOUT</span>
          <h1>Complete Your <strong>Purchase</strong></h1>
          <p>{isFreeOrder
            ? "No payment required. Complete your order to access your free products."
            : "Pay using UPI and submit your payment proof for verification."}</p>
        </div>

        <div className="checkout-grid">
          <form className="checkout-card" onSubmit={handleSubmit}>
            <div className="checkout-card-header">
              <div className="checkout-step">01</div>
              <div><h2>Customer Details</h2><p>Enter your contact information.</p></div>
            </div>
            <div className="checkout-fields">
              <div className="checkout-field">
                <label htmlFor="checkout-name">Full Name</label>
                <input id="checkout-name" type="text" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Your name" required />
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-email">Email Address</label>
                <input id="checkout-email" type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="you@example.com" required />
                <small>Your download link will be sent to this email if email delivery is enabled.</small>
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-phone">Phone Number</label>
                <input id="checkout-phone" type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="Your phone number" required />
              </div>
            </div>

            <div className="checkout-card-header payment-header">
              <div className="checkout-step">%</div>
              <div><h2>Have a Coupon?</h2><p>Apply your discount before checkout.</p></div>
            </div>
            <div className="coupon-box">
              {!appliedCoupon ? (
                <div className="coupon-input-row">
                  <input type="text" value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setCouponError(""); setCouponMessage("");
                    }}
                    placeholder="Enter coupon code" maxLength={50} />
                  <button type="button" onClick={handleApplyCoupon}
                    disabled={couponLoading} className="coupon-apply-button">
                    {couponLoading ? "Checking..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="coupon-applied">
                  <div><strong>🎟️ {appliedCoupon.code}</strong><span>Coupon applied successfully</span></div>
                  <button type="button" onClick={handleRemoveCoupon}
                    className="coupon-remove-button">Remove</button>
                </div>
              )}
              {couponMessage && <div className="coupon-success">✓ {couponMessage}</div>}
              {couponError && <div className="coupon-error">{couponError}</div>}
            </div>

            {isFreeOrder ? (
              <div className="checkout-free-box">
                <div className="checkout-step">✓</div>
                <h2>Free Digital Product</h2>
                <p>Your total is ₹0.00. No UPI payment, UTR number, or screenshot is required.</p>
                <p>Complete checkout to get your digital product after server approval.</p>
              </div>
            ) : (
              <>
                <div className="checkout-card-header payment-header">
                  <div className="checkout-step">02</div>
                  <div><h2>Make Payment</h2><p>Pay the exact amount using UPI.</p></div>
                </div>
                <div className="manual-payment-box">
                  <div className="payment-qr-section">
                    <div className="payment-qr-wrapper">
                      {!qrError ? (
                        <button type="button" className="payment-qr-clickable"
                          onClick={openQr} title="Click to open QR in full size">
                          <img key={qrVersion} src={qrUrl} alt="UPI Payment QR Code"
                            className="payment-qr-image" onError={() => setQrError(true)} />
                        </button>
                      ) : (
                        <div className="payment-qr-error">
                          <span>QR unavailable</span>
                          <small>Use the UPI ID below to make payment.</small>
                          <button type="button" onClick={retryQr}
                            className="payment-qr-retry">Retry QR</button>
                        </div>
                      )}
                    </div>
                    <div className="payment-qr-info">
                      <div className="payment-qr-title">SCAN &amp; PAY</div>
                      <p>Scan this QR using Google Pay, PhonePe, Paytm or another UPI app.</p>
                      <small>Click the QR to open it in full size.</small>
                    </div>
                  </div>
                  <div className="payment-amount-label">AMOUNT TO PAY</div>
                  <div className="payment-amount">₹{finalTotal.toFixed(2)}</div>
                  <div className="payment-upi">
                    <span>UPI ID</span><strong>{paymentDetails.upi_id || "Loading..."}</strong>
                  </div>
                  <div className="payment-account">
                    <span>Account Name</span>
                    <strong>{paymentDetails.account_name || "DigitalStore"}</strong>
                  </div>
                  <div className="payment-instruction">
                    <strong>How to pay</strong>
                    <ol>
                      <li>Open your UPI app.</li>
                      <li>Pay exactly ₹{finalTotal.toFixed(2)}.</li>
                      <li>Copy the UTR / transaction reference.</li>
                      <li>Take a screenshot of the successful payment.</li>
                    </ol>
                  </div>
                </div>
                <div className="checkout-card-header payment-header">
                  <div className="checkout-step">03</div>
                  <div><h2>Submit Payment Proof</h2>
                    <p>Upload your payment details for verification.</p></div>
                </div>
                <div className="checkout-fields">
                  <div className="checkout-field">
                    <label htmlFor="checkout-utr">Payment Reference / UTR</label>
                    <input id="checkout-utr" type="text" value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      placeholder="Enter UTR / transaction reference" required />
                    <small>Enter the transaction reference shown in your UPI app.</small>
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="checkout-screenshot">Payment Screenshot</label>
                    <input id="checkout-screenshot" type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleScreenshotChange} required />
                    <small>JPG, PNG or WEBP • Maximum 5 MB</small>
                    {screenshot && <div className="selected-file">✓ {screenshot.name}</div>}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="checkout-error" role="alert">
                {String(error).split("\n").map((message, index) => (
                  <div key={index}>{message}</div>
                ))}
              </div>
            )}
            {success && <div className="checkout-success" role="status">{success}</div>}
            <button type="submit" className="checkout-primary-button" disabled={loading}>
              {loading
                ? (isFreeOrder ? "Processing Free Order..." : "Submitting Payment Proof...")
                : (isFreeOrder ? "Get Free Product →" : "Submit Payment Proof →")}
            </button>
          </form>

          <aside className="checkout-card checkout-summary">
            <div className="checkout-card-header">
              <div className="checkout-step">CART</div>
              <div><h2>Order Summary</h2><p>Your digital products.</p></div>
            </div>
            <div className="checkout-items">
              {cartItems.map((item) => (
                <div className="checkout-item" key={item.id || item._id}>
                  <div className="checkout-item-info">
                    <strong>{item.title}</strong>
                    <span>Qty: {item.quantity || 1}</span>
                  </div>
                  <strong>₹{(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}</strong>
                </div>
              ))}
            </div>
            <div className="checkout-total-row">
              <span>Subtotal</span><strong>₹{subtotal.toFixed(2)}</strong>
            </div>
            {couponDiscount > 0 && (
              <div className="checkout-total-row coupon-total-row">
                <span>Coupon Discount</span><strong>-₹{couponDiscount.toFixed(2)}</strong>
              </div>
            )}
            {appliedCoupon && (
              <div className="checkout-applied-code">🎟️ <span>{appliedCoupon.code}</span></div>
            )}
            <div className="checkout-grand-total">
              <span>Total</span><strong>₹{finalTotal.toFixed(2)}</strong>
            </div>
            <div className="checkout-security-note">
              {isFreeOrder
                ? "✓ No payment needed. Free order eligibility is verified by the server."
                : "🔒 Your payment screenshot is submitted for manual verification."}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
