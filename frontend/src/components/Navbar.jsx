import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const {
    user,
    logout,
    loading,
  } = useAuth();

  const {
    cartCount,
  } = useCart();

  return (
    <header className="navbar">

      <div className="navbar-inner">

        {/* LOGO */}
        <Link
          to="/"
          className="logo"
        >
          <span className="logo-icon">
            D
          </span>

          <span>
            Digital<span>Store</span>
          </span>
        </Link>


        {/* NAVIGATION */}
        <nav className="nav-links">

          <NavLink to="/">
            Home
          </NavLink>

          <NavLink to="/products">
            Products
          </NavLink>

          {user?.role === "admin" && (
            <NavLink to="/admin">
              Admin
            </NavLink>
          )}

        </nav>


        {/* ACTIONS */}
        <div className="nav-actions">

          {/* CART */}
          <Link
            to="/cart"
            className="cart-button"
            title="Cart"
          >
            🛒

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount}
              </span>
            )}
          </Link>


          {/* USER */}
          {!loading && user ? (

            <div className="user-menu">

              <Link
                to={
                  user.role === "admin"
                    ? "/admin"
                    : "/profile"
                }
                className="user-name"
              >
                {user.role === "admin"
                  ? "🛡️ Admin"
                  : `Hi, ${user.name}`}
              </Link>

              <button
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