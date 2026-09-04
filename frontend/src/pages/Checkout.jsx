import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createOrder } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";


function Checkout() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();


  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });


  const [paymentDetails, setPaymentDetails] =
    useState({
      upi_id: "",
      account_name: "",
    });


  const [
    paymentReference,
    setPaymentReference,
  ] = useState("");


  const [
    screenshot,
    setScreenshot
  ] = useState(null);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  const [
    success,
    setSuccess
  ] = useState("");


  useEffect(() => {

    const loadPaymentDetails =
      async () => {

        try {

          const response =
            await api.get(
              "/payments/details"
            );

          setPaymentDetails(
            response.data
          );

        } catch (err) {

          console.error(
            "Payment details error:",
            err
          );

        }

      };

    loadPaymentDetails();

  }, []);


  useEffect(() => {

    if (!user) return;

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });

  }, [user]);


  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


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


    if (!allowedTypes.includes(
      file.type
    )) {

      setError(
        "Only JPG, PNG, and WEBP images are allowed."
      );

      event.target.value = "";

      return;
    }


    if (file.size > 5 * 1024 * 1024) {

      setError(
        "Screenshot must be smaller than 5 MB."
      );

      event.target.value = "";

      return;
    }


    setError("");

    setScreenshot(file);
  };


  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    if (!cartItems.length) {

      setError(
        "Your cart is empty."
      );

      return;
    }


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


    if (!paymentReference.trim()) {

      setError(
        "Please enter your payment reference / UTR number."
      );

      return;
    }


    if (!screenshot) {

      setError(
        "Please upload your payment screenshot."
      );

      return;
    }


    try {

      setLoading(true);


      // --------------------------------------
      // 1. Create order
      // --------------------------------------

      const orderData = {
        items: cartItems.map(
          (item) => ({
            product_id: item.id,
            quantity:
              item.quantity || 1,
          })
        ),

        customer: {
          name:
            formData.name.trim(),

          email:
            formData.email.trim(),

          phone:
            formData.phone.trim(),
        },
      };


      const orderResponse =
        await createOrder(
          orderData
        );


      const order =
        orderResponse.order;


      if (!order?.id) {

        throw new Error(
          "Order was not created."
        );
      }


      // --------------------------------------
      // 2. Upload payment proof
      // --------------------------------------

      const formDataUpload =
        new FormData();


      formDataUpload.append(
        "payment_reference",
        paymentReference.trim()
      );


      formDataUpload.append(
        "screenshot",
        screenshot
      );


      await api.post(
        `/payments/submit-proof/${order.id}`,
        formDataUpload,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );


      // --------------------------------------
      // 3. Clear cart
      // --------------------------------------

      clearCart();


      // --------------------------------------
      // 4. Show success
      // --------------------------------------

      setSuccess(
        `Payment proof submitted successfully. Order ${order.order_number} is now waiting for verification.`
      );


      // --------------------------------------
      // 5. Redirect
      // --------------------------------------

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


      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to submit your payment proof."
      );

    } finally {

      setLoading(false);

    }

  };


  return (
    <main className="checkout-page">

      <div className="checkout-container">

        <div className="checkout-header">

          <span>SECURE CHECKOUT</span>

          <h1>
            Complete Your{" "}
            <strong>Purchase</strong>
          </h1>

          <p>
            Pay using UPI and submit your
            payment proof for verification.
          </p>

        </div>


        <div className="checkout-grid">

          {/* =================================
              LEFT
              ================================= */}

          <form
            className="checkout-card"
            onSubmit={handleSubmit}
          >

            <div className="checkout-card-header">

              <div className="checkout-step">
                01
              </div>

              <div>
                <h2>
                  Customer Details
                </h2>

                <p>
                  Enter your contact information.
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
                  onChange={handleChange}
                  placeholder="Your name"
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
                  onChange={handleChange}
                  placeholder="you@example.com"
                />

                <small>
                  Your download link will be
                  sent to this email.
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
                  onChange={handleChange}
                  placeholder="Your phone number"
                />

              </div>

            </div>


            {/* ===============================
                PAYMENT
                =============================== */}

            <div className="checkout-card-header payment-header">

              <div className="checkout-step">
                02
              </div>

              <div>
                <h2>
                  Make Payment
                </h2>

                <p>
                  Pay the exact amount using
                  UPI.
                </p>
              </div>

            </div>


            <div className="manual-payment-box">
              <div className="payment-qr-wrapper">
  <div className="payment-qr-title">
    Scan & Pay
  </div>

  <img
    src={`${import.meta.env.VITE_API_URL}/payments/qr`}
    alt="UPI Payment QR Code"
    className="payment-qr"
  />

  <p className="payment-qr-hint">
    Scan this QR using Google Pay, PhonePe, Paytm or another UPI app.
  </p>
</div>

              <div className="payment-amount-label">
                AMOUNT TO PAY
              </div>

              <div className="payment-amount">
                ₹{Number(cartTotal).toFixed(2)}
              </div>


              <div className="payment-upi">

                <span>
                  UPI ID
                </span>

                <strong>
                  {paymentDetails.upi_id ||
                    "Loading..."}
                </strong>

              </div>


              <div className="payment-account">

                <span>
                  Account Name
                </span>

                <strong>
                  {paymentDetails.account_name ||
                    "DigitalStore"}
                </strong>

              </div>


              <div className="payment-instruction">

                <strong>
                  How to pay
                </strong>

                <ol>
                  <li>
                    Open your UPI app.
                  </li>

                  <li>
                    Pay exactly ₹
                    {Number(
                      cartTotal
                    ).toFixed(2)}.
                  </li>

                  <li>
                    Copy the UTR / transaction
                    reference number.
                  </li>

                  <li>
                    Take a screenshot of the
                    successful payment.
                  </li>
                </ol>

              </div>

            </div>


            {/* ===============================
                PAYMENT PROOF
                =============================== */}

            <div className="checkout-card-header payment-header">

              <div className="checkout-step">
                03
              </div>

              <div>
                <h2>
                  Submit Payment Proof
                </h2>

                <p>
                  Upload your payment details
                  for verification.
                </p>
              </div>

            </div>


            <div className="checkout-fields">

              <div className="checkout-field">

                <label>
                  Payment Reference / UTR
                </label>

                <input
                  type="text"
                  value={paymentReference}
                  onChange={(event) =>
                    setPaymentReference(
                      event.target.value
                    )
                  }
                  placeholder="Enter UTR / transaction reference"
                />

                <small>
                  Enter the transaction reference
                  shown in your UPI app.
                </small>

              </div>


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
                />

                <small>
                  JPG, PNG or WEBP • Maximum 5 MB
                </small>

                {screenshot && (
                  <div className="selected-file">

                    ✓ {screenshot.name}

                  </div>
                )}

              </div>

            </div>


            {error && (
              <div className="checkout-error">
                {error}
              </div>
            )}


            {success && (
              <div className="checkout-success">
                {success}
              </div>
            )}


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


          {/* =================================
              RIGHT SUMMARY
              ================================= */}

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

              {cartItems.map((item) => (

                <div
                  className="checkout-item"
                  key={item.id}
                >

                  <div className="checkout-item-info">

                    <strong>
                      {item.title}
                    </strong>

                    <span>
                      Qty: {item.quantity || 1}
                    </span>

                  </div>

                  <strong>
                    ₹
                    {(
                      Number(item.price) *
                      (item.quantity || 1)
                    ).toFixed(2)}
                  </strong>

                </div>

              ))}

            </div>


            <div className="checkout-total-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹{Number(
                  cartTotal
                ).toFixed(2)}
              </strong>

            </div>


            <div className="checkout-grand-total">

              <span>
                Total
              </span>

              <strong>
                ₹{Number(
                  cartTotal
                ).toFixed(2)}
              </strong>

            </div>


            <div className="checkout-security-note">

              🔒 Your payment screenshot is
              securely submitted for manual
              verification.

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}


export default Checkout;