
import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    () => sessionStorage.getItem("token")
  );

  const [authLoading, setAuthLoading] = useState(true);

  // ==========================================
  // 1. LOGIN
  // ==========================================

  const login = async (credentials) => {
    try {
      const response = await api.post(
        "/auth/login",
        {
          email: credentials.email.trim(),
          password: credentials.password,
        }
      );

      const receivedToken = response.data?.token;
      const loggedInUser = response.data?.user;

      // Validate backend response.
      if (!receivedToken || !loggedInUser) {
        throw new Error(
          "Invalid login response. Token or user information is missing."
        );
      }

      // Save authentication token.
      sessionStorage.setItem("token", receivedToken);

      // Update authentication state.
      setToken(receivedToken);
      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data || error.message
      );

      throw error;
    }
  };

  // ==========================================
  // 2. REGISTER
  // ==========================================

  const register = async (userData) => {
    try {
      const response = await api.post(
        "/auth/register",
        userData
      );

      return response.data;
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );

      throw error;
    }
  };

  // ==========================================
  // 3. LOGOUT
  // ==========================================

  const logout = () => {
    sessionStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  // ==========================================
  // 4. RESTORE EXISTING SESSION
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem("token");

      if (!savedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setAuthLoading(false);
        }

        return;
      }

      try {
        const response = await api.get("/users/me");

        if (isMounted) {
          setToken(savedToken);
          setUser(response.data.user);
        }
      } catch (error) {
        console.error(
          "Session restoration failed:",
          error.response?.data || error.message
        );

        sessionStorage.removeItem("token");

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // 5. AUTHENTICATION CONTEXT
  // ==========================================

  const contextValue = {
    user,
    setUser,
    token,
    authLoading,

    isAuthenticated: Boolean(token && user),

    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// 6. CUSTOM AUTH HOOK
// ==========================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
