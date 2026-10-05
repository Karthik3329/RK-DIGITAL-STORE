import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus({
      type: "",
      message: "",
    });

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setStatus({
        type: "error",
        message: "Please enter your email address.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/forgot-password",
        {
          email: cleanEmail,
        }
      );

      setStatus({
        type: "success",
        message:
          response.data?.message ||
          "If an account exists, a reset link has been sent.",
      });

    } catch (error) {

      console.error(
        "Forgot password error:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setStatus({
        type: "error",
        message:
          typeof detail === "string"
            ? detail
            : "Unable to process your request. Please try again.",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">

      <div className="auth-card">

        <div className="auth-header">

          <Link
            to="/"
            className="auth-logo"
          >
            <img
              src="/rk-digital-logo.png"
              alt="RK Digital Store"
            />
          </Link>

          <h1>
            Forgot <span>Password?</span>
          </h1>

          <p>
            Enter your email address and we'll
            send you a secure password reset link.
          </p>

        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              disabled={loading}
              required
            />

          </div>

          {status.message && (
            <div
              className={`auth-status ${status.type}`}
            >
              {status.message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link →"}
          </button>

        </form>

        <div className="auth-footer">

          <Link to="/login">
            ← Back to Login
          </Link>

        </div>

      </div>

    </main>
  );
}

export default ForgotPassword;