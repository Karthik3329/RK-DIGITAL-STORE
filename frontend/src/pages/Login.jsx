
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Remember the page the customer wanted to visit.
  const requestedPath = location.state?.from;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      const { access_token, user } = response.data;

      if (!access_token || !user) {
        throw new Error("Invalid login response from server.");
      }

      // Save authentication
      login(access_token, user);

      // Admin always goes to the admin dashboard.
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      // Customers return to the page they requested.
      // Only allow safe internal paths.
      const safeRedirect =
        typeof requestedPath === "string" &&
        requestedPath.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !requestedPath.startsWith("/\\") &&
        !requestedPath.startsWith("/admin")
          ? requestedPath
          : "/products";

      navigate(safeRedirect, { replace: true });

    } catch (err) {
      console.error("Login error:", err);

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : err.message || "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">

        {/* LOGO */}
        <div className="auth-brand">
          <div className="auth-logo">
            RK
          </div>

          <h1>
            Welcome <span>Back</span>
          </h1>

          <p>
            Sign in to continue to RK DIGITAL STORE.
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div className="form-group">
            <label htmlFor="login-email">
              Email Address
            </label>

            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          {/* FORGOT PASSWORD */}
          <div className="forgot-password-row">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        {/* REGISTER */}
        <div className="auth-footer">
          <span>
            Don't have an account?
          </span>

          <Link
            to="/register"
            state={{ from: requestedPath }}
          >
            Create Account
          </Link>
        </div>

        {/* INFO */}
        <div className="login-info">

          <div>
            <span>👤</span>

            <div>
              <strong>Customer</strong>
              <small>
                Access products, orders and downloads
              </small>
            </div>
          </div>

          <div>
            <span>🛡️</span>

            <div>
              <strong>Administrator</strong>
              <small>
                Access the store management dashboard
              </small>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

export default Login;
