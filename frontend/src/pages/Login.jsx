import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      const {
        access_token,
        user,
      } = response.data;

      // Save authentication
      login(access_token, user);

      // Redirect according to role
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Invalid email or password.";

      setError(message);

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
            D
          </div>

          <h1>
            Welcome <span>Back</span>
          </h1>

          <p>
            Sign in to continue to DigitalStore.
          </p>

        </div>


        {/* LOGIN FORM */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}


          {/* EMAIL */}

          <div className="form-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />

          </div>


          {/* PASSWORD */}

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>


        {/* REGISTER */}

        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
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