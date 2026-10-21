
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { user, logout, loading } = useAuth();
  const { cartCount } = useCart();

  const isAdmin = user?.role === "admin";
  const isLoggedIn = Boolean(user);

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* LOGO */}
        <Link to="/" className="logo">
          <img
            src="/rk-digital-logo.png"
            alt="RK Digital Store"
            className="logo-image"
          />

          <span className="logo-text">
            RK <span>Digital</span> Store
          </span>
        </Link>

        {/* NAVIGATION */}
        <nav className="nav-links">

          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/products">
            Products
          </NavLink>

          <NavLink to="/contact">
            Contact
          </NavLink>

          {/* CUSTOMER DOWNLOADS */}
          {isLoggedIn && (
            <NavLink to="/downloads">
              My Downloads
            </NavLink>
          )}

          {/* ADMIN DASHBOARD */}
          {isAdmin && (
            <NavLink to="/admin">
              Admin
            </NavLink>
          )}

          {/* ADMIN FILE MANAGEMENT */}
          {isAdmin && (
            <NavLink to="/admin/downloads">
              Manage Downloads
            </NavLink>
          )}

        </nav>

        {/* ACTIONS */}
        <div className="nav-actions">

          {/* SHOPPING CART */}
          <Link
            to="/cart"
            className="cart-button"
            title="Shopping Cart"
            aria-label="Shopping Cart"
          >
            🛒

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount}
              </span>
            )}
          </Link>

          {/* USER MENU */}
          {!loading && isLoggedIn ? (
            <div className="user-menu">

              <Link
                to={isAdmin ? "/admin" : "/profile"}
                className="user-name"
              >
                {isAdmin
                  ? "🛡️ Admin"
                  : `Hi, ${user.name || "Customer"}`}
              </Link>

              <button
                type="button"
                className="logout-button"
                onClick={logout}
              >
                Logout
              </button>

            </div>
          ) : !loading ? (
            <Link
              to="/login"
              className="login-button"
            >
              Login
            </Link>
          ) : null}

        </div>

      </div>
    </header>
  );
}

export default Navbar;
