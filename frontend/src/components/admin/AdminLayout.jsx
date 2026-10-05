import {
  NavLink,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function AdminLayout() {
  const { user, logout } = useAuth();

  const links = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: "📊",
      end: true,
    },
    {
      to: "/admin/products",
      label: "Products",
      icon: "📦",
    },
    {
      to: "/admin/orders",
      label: "Orders",
      icon: "💳",
    },
    {
      to: "/admin/customers",
      label: "Customers",
      icon: "👥",
    },
    {
      to: "/admin/coupons",
      label: "Coupons",
      icon: "🎟️",
    },
    {
      to: "/admin/analytics",
      label: "Analytics",
      icon: "📈",
    },
    {
      to: "/admin/messages",
      label: "Messages",
      icon: "✉️",
    },
  ];

  return (
    <div className="admin-shell">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        {/* BRAND */}
        <div className="admin-brand">

          <div className="admin-brand-icon">
            RK
          </div>

          <div>
            <strong>
              RK <span>Digital</span> Store
            </strong>

            <small>
              ADMIN PANEL
            </small>
          </div>

        </div>

        {/* NAVIGATION */}
        <nav className="admin-navigation">

          <div className="admin-nav-label">
            MANAGEMENT
          </div>

          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `admin-nav-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="admin-nav-icon">
                {link.icon}
              </span>

              <span>
                {link.label}
              </span>
            </NavLink>
          ))}

        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="admin-sidebar-bottom">

          <NavLink
            to="/"
            className="admin-nav-link"
          >
            <span className="admin-nav-icon">
              🌐
            </span>

            <span>
              View Store
            </span>
          </NavLink>

          <button
            type="button"
            className="admin-nav-link admin-logout"
            onClick={logout}
          >
            <span className="admin-nav-icon">
              🚪
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">

          <div>
            <span className="admin-topbar-label">
              ADMINISTRATION
            </span>

            <h1>
              Store Management
            </h1>
          </div>

          {/* ADMIN PROFILE */}
          <div className="admin-profile">

            <div className="admin-profile-avatar">
              🛡️
            </div>

            <div>

              <strong>
                {user?.name || "Store Admin"}
              </strong>

              <span>
                {user?.email || "admin@digitalstore.com"}
              </span>

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <div className="admin-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

export default AdminLayout;