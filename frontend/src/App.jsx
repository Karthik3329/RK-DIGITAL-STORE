
import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import api from "./services/api";

// Common Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Authentication Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Customer Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Contact from "./pages/Contact";
import Downloads from "./pages/Downloads.jsx";

// Maintenance Page
import Maintenance from "./pages/Maintenance";

// Admin Components
import AdminLayout from "./components/admin/AdminLayout";
import AdminGuard from "./components/admin/AdminGuard";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminDownloads from "./pages/AdminDownloads.jsx";
import AdminOrders from "./pages/AdminOrders";
import AdminCustomers from "./pages/AdminCustomers";
import AdminCoupons from "./pages/AdminCoupons";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminContactMessages from "./pages/AdminContactMessages";

// Maintenance Configuration
import { MAINTENANCE_MODE } from "./config/maintenance";

function AppContent() {
  const location = useLocation();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(
    MAINTENANCE_MODE
  );

  // ==========================================
  // VERIFY ADMIN LOGIN
  // ==========================================

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      if (!MAINTENANCE_MODE) {
        setCheckingAuth(false);
        return;
      }

      const token = localStorage.getItem("access_token");

      if (!token) {
        if (active) {
          setIsAdmin(false);
          setCheckingAuth(false);
        }
        return;
      }

      if (active) {
        setCheckingAuth(true);
      }

      try {
        const response = await api.get("/auth/me");

        if (active) {
          setIsAdmin(
            response.data.role === "admin"
          );
        }
      } catch (error) {
        console.error(
          "Admin verification failed:",
          error
        );

        if (active) {
          setIsAdmin(false);
        }
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    };

    checkAdmin();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  // ==========================================
  // IDENTIFY ROUTES
  // ==========================================

  const pathname = location.pathname;

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isLoginRoute =
    pathname === "/login";

  const isPasswordRecoveryRoute =
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password/");

  // ==========================================
  // MAINTENANCE MODE
  // ==========================================

  if (MAINTENANCE_MODE) {
    // Wait for admin verification
    if (
      checkingAuth &&
      !isLoginRoute &&
      !isPasswordRecoveryRoute
    ) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p>Checking access...</p>
        </div>
      );
    }

    // Customers see maintenance page
    if (
      !isAdmin &&
      !isAdminRoute &&
      !isLoginRoute &&
      !isPasswordRecoveryRoute
    ) {
      return <Maintenance />;
    }
  }

  // ==========================================
  // MAIN APPLICATION
  // ==========================================

  return (
    <>
      <ScrollToTop />

      <Navbar />

      <Routes>
        {/* ==================================
            CUSTOMER ROUTES
        ================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/products/:slug"
          element={<ProductDetails />}
        />

        <Route
          path="/orders"
          element={<Orders />}
        />

        <Route
          path="/downloads"
          element={<Downloads />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/order-success/:orderId"
          element={<OrderSuccess />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* ==================================
            AUTHENTICATION ROUTES
        ================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* ==================================
            ADMIN ROUTES
        ================================== */}

        <Route
          path="/admin"
          element={<AdminGuard />}
        >
          <Route element={<AdminLayout />}>
            <Route
              index
              element={<AdminDashboard />}
            />

            <Route
              path="products"
              element={<AdminProducts />}
            />

            <Route
              path="downloads"
              element={<AdminDownloads />}
            />

            <Route
              path="orders"
              element={<AdminOrders />}
            />

            <Route
              path="customers"
              element={<AdminCustomers />}
            />

            <Route
              path="coupons"
              element={<AdminCoupons />}
            />

            <Route
              path="analytics"
              element={<AdminAnalytics />}
            />

            <Route
              path="messages"
              element={<AdminContactMessages />}
            />
          </Route>
        </Route>
      </Routes>

      <Footer />
    </>
  );
}

// ==========================================
// APP ROOT
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
