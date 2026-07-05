import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Dashboard from "./pages/dashboard/Dashboard";
import Assets from "./pages/assets/Assets";
import Maintenance from "./pages/maintenance/Maintenance";
import Complaints from "./pages/complaints/Complaints";
import Buildings from "./pages/buildings/Buildings";
import Visitors from "./pages/visitors/Visitors";
import Security from "./pages/security/Security";
import Simulator from "./pages/simulator/Simulator";
import Parking from "./pages/parking/Parking";
import Bookings from "./pages/bookings/Bookings";
import Energy from "./pages/energy/Energy";
import Notifications from "./pages/notifications/Notifications";
import Users from "./pages/users/Users";
import Profile from "./pages/profile/Profile";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? <>{children}</> : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"   element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                element={<Dashboard />} />
          <Route path="buildings"     element={<Buildings />} />
          <Route path="assets"        element={<Assets />} />
          <Route path="maintenance"   element={<Maintenance />} />
          <Route path="complaints"    element={<Complaints />} />
          <Route path="visitors"      element={<Visitors />} />
          <Route path="security"      element={<Security />} />
          <Route path="simulator"     element={<Simulator />} />
          <Route path="parking"       element={<Parking />} />
          <Route path="bookings"      element={<Bookings />} />
          <Route path="energy"        element={<Energy />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="users"         element={<Users />} />
          <Route path="profile"       element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
