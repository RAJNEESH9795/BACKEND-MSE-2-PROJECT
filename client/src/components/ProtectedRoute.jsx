
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  // Wait until authentication status is determined
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-slate-600">
          Loading...
        </p>
      </div>
    );
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the supplied layout or nested routes
  return children || <Outlet />;
}

export default ProtectedRoute;
