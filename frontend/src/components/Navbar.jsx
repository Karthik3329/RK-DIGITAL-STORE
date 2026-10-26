
import { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, logout, loading } = useAuth();
  const { cartCount } = useCart();

  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const goToProtectedPage = (path) => {
    closeMenu();

    if (loading) return;

    if (!user) {
      navigate("/login", {
        state: { from: path },
      });
      return;
    }

    navigate(path);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* LOGO */}
        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          <span className="logo-icon">RK</span>
          <span className="logo-text">
            RK <span>DIGITAL STORE</span>
          </span>
        </Link>

        {/* NAVIGATION */}
        <nav
          id="mobile-navigation"
          className={`nav-links ${menuOpen ? "mobile-open" : ""}`}
        >
          <NavLink
            to="/"
            end
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <button
            type="button"
            className="nav-link-button"
            onClick={() => goToProtectedPage("/products")}
          >
            Browse Products
          </button>

          <button
            type="button"
            className="nav-link-button"
            onClick={() => goToProtectedPage("/downloads")}
          >
            My Downloads
          </button>

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              onClick={closeMenu}
            >
              Admin Panel
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/profile"
              onClick={closeMenu}
            >
              My Profile
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/cart"
              className="mobile-cart-link"
              onClick={closeMenu}
            >
              Cart ({cartCount})
            </NavLink>
          )}

          {/* MOBILE AUTH */}
          {!loading && (
            user ? (
              <button
                type="button"
                className="mobile-auth-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="mobile-auth-button"
                onClick={closeMenu}
              >
                Login
              </Link>
            )
          )}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="nav-actions">

          {user && (
            <Link
              to="/cart"
              className="cart-button"
              aria-label={`Cart with ${cartCount} items`}
            >
              <span className="cart-symbol">🛒</span>
              <span className="cart-count">{cartCount}</span>
            </Link>
          )}

          {!loading && (
            user ? (
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="login-button"
              >
                Login
              </Link>
            )
          )}
        </div>

        {/* MOBILE MENU */}
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>
    </header>
  );
}

export default Navbar;
