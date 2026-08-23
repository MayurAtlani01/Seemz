import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontSize: "12px",
        }}
      >
        Verifying Administrative Privileges...
      </div>
    );
  }

  // If not logged in or not admin, redirect to login
  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
