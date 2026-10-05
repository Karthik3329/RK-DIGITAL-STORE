import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";

function ResetPassword() {
  const { token } = useParams();

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

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

    if (!token) {
      setStatus({
        type: "error",
        message: "Invalid password reset link.",
      });
      return;
    }

    if (password.length < 6) {
      setStatus({
        type: "error",
        message:
          "Password must contain at least 6 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message:
          "Passwords do not match.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
  "/auth/reset-password",
  {
    token,
    password,
  }
);

      setStatus({
        type: "success",
        message:
          response.data?.message ||
          "Password reset successfully.",
      });

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1800);

    } catch (error) {

      console.error(
        "Reset password error:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setStatus({
        type: "error",
        message:
          typeof detail === "string"
            ? detail
            : "Unable to reset your password.",
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
            Reset <span>Password</span>
          </h1>

          <p>
            Create a new password for your
            RK Digital Store account.
          </p>

        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label htmlFor="password">
              New Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="new-password"
              disabled={loading}
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="confirmPassword">
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
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
              ? "Updating..."
              : "Update Password →"}
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

export default ResetPassword;