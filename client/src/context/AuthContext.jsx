import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => sessionStorage.getItem("token")
  );

  const login = async (credentials) => {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    const { token, user } = response.data;

    sessionStorage.setItem("token", token);
    setToken(token);
    setUser(user);

    return user;
  };

  const register = async (userData) => {
    const response = await api.post(
      "/auth/register",
      userData
    );

    return response.data;
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem("token");

      if (!savedToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await api.get("/users/me");
        setUser(response.data.user);
      } catch (error) {
        sessionStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        authLoading,
        isAuthenticated: Boolean(token),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};