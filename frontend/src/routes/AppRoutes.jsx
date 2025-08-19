import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import HRDashboard from "../pages/HRDashboard";
import EmployeeDashboard from "../pages/EmployeeDashboard";

const PrivateRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
};

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/hr" element={<PrivateRoute role="HR"><HRDashboard /></PrivateRoute>} />
        <Route path="/employee" element={<PrivateRoute role="Employee"><EmployeeDashboard /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}
