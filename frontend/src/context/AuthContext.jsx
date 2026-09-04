import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken =
        localStorage.getItem("access_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          "/auth/me"
        );

        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        console.error(
          "Session expired or invalid:",
          error
        );

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem("user");

        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (accessToken, userData) => {
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

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}