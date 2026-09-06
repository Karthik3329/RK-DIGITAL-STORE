import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

const CART_STORAGE_KEY = "digital_store_cart";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [loading, setLoading] = useState(true);

  // ==========================================
  // RESTORE SESSION
  // ==========================================

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken =
        localStorage.getItem("access_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        setUser(response.data);
        setToken(storedToken);

      } catch (error) {
        console.error(
          "Session expired or invalid.",
          error
        );

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        // Clear cart if session is invalid
        localStorage.removeItem(CART_STORAGE_KEY);

        setUser(null);
        setToken(null);

      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const login = (
    accessToken,
    userData
  ) => {
    localStorage.setItem(
      "access_token",
      accessToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setToken(accessToken);
    setUser(userData);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    // Remove authentication data
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user"
    );

    // ========================================
    // CLEAR CART
    // ========================================

    localStorage.removeItem(
      CART_STORAGE_KEY
    );

    // Clear React authentication state
    setToken(null);
    setUser(null);

    // Redirect to login
    window.location.replace("/login");
  };

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = {
    user,
    token,
    loading,

    login,
    logout,

    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// useAuth Hook
// ==========================================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}