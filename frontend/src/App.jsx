import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Customer pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminGuard from "./components/admin/AdminGuard";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminCustomers from "./pages/AdminCustomers";
import AdminCoupons from "./pages/AdminCoupons";
import AdminAnalytics from "./pages/AdminAnalytics";

import ScrollToTop from "./components/ScrollToTop";

// DigitalStore AI
import DigitalStoreAI from "./components/ai/DigitalStoreAI";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      {/* =========================
          CUSTOMER NAVBAR
      ========================= */}
      <Navbar />

      <Routes>

        {/* =========================
            CUSTOMER ROUTES
        ========================= */}

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
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* =========================
            ADMIN ROUTES
        ========================= */}

        <Route
          path="/admin"
          element={<AdminGuard />}
        >
          <Route
            element={<AdminLayout />}
          >
            <Route
              index
              element={<AdminDashboard />}
            />

            <Route
              path="products"
              element={<AdminProducts />}
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
          </Route>
        </Route>

      </Routes>

      {/* =========================
          DIGITALSTORE AI
          Available throughout
          the customer website
      ========================= */}
      <DigitalStoreAI />

      {/* =========================
          CUSTOMER FOOTER
      ========================= */}

      <Footer />

    </BrowserRouter>
  );
}

export default App;