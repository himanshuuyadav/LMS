// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

function App() {
  const { user } = useContext(AuthContext);

  const RequireAuth = ({ children, roles }) => {
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Landing page first */}
        <Route path="/" element={<LandingPage />} />

        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* HR Dashboard */}
        <Route
          path="/hr"
          element={
            <RequireAuth roles={["HR"]}>
              <HRDashboard />
            </RequireAuth>
          }
        />

        {/* Employee Dashboard */}
        <Route
          path="/employee"
          element={
            <RequireAuth roles={["Employee"]}>
              <EmployeeDashboard />
            </RequireAuth>
          }
        />

        {/* Redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to={user ? (user.role==="HR"?"/hr":"/employee"):"/"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
