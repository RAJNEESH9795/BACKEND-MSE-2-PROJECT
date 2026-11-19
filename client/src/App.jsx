
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

// Authentication pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Main pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";

// Ride sharing pages
import RideFinder from "./pages/RideFinder";
import RideDetails from "./pages/RideDetails";
import MyBookings from "./pages/MyBookings";
import ManageBookings from "./pages/ManageBookings";
import MyRides from "./pages/MyRides";
import EditRide from "./pages/EditRide";

// Marketplace pages
import Marketplace from "./pages/Marketplace";
import CreateService from "./pages/CreateService";
import ServiceDetails from "./pages/ServiceDetails";
import MyServices from "./pages/MyServices";
import EditService from "./pages/EditService";

// Exchange pages
import MyExchangeRequests from "./pages/MyExchangeRequests";
import ReceivedExchangeRequests from "./pages/ReceivedExchangeRequests";

// Notifications
import Notifications from "./pages/Notifications";

// Cab Share pages
import CreateCabShare from "./pages/CreateCabShare";
import FindCabShares from "./pages/FindCabShares";
import MyCabShares from "./pages/MyCabShares";

// Plan a Trip pages
import CreateTrip from "./pages/CreateTrip";
import FindTrips from "./pages/FindTrips";
import MyTrips from "./pages/MyTrips";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Public authentication routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      {/* Protected application routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard and profile */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/change-password"
          element={<ChangePassword />}
        />

        {/* Ride sharing */}

        {/* Find a Ride - only search and available rides */}
        <Route
          path="/rides"
          element={<RideFinder />}
        />

        {/* Offer a Ride - only ride creation form */}
        <Route
          path="/rides/create"
          element={<RideFinder />}
        />

        {/* Ride details */}
        <Route
          path="/rides/:id"
          element={<RideDetails />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/manage-bookings/:id"
          element={<ManageBookings />}
        />

        <Route
          path="/my-rides"
          element={<MyRides />}
        />

        <Route
          path="/edit-ride/:id"
          element={<EditRide />}
        />

        {/* Marketplace */}
        <Route
          path="/marketplace"
          element={<Marketplace />}
        />

        <Route
          path="/services/create"
          element={<CreateService />}
        />

        <Route
          path="/services/:id"
          element={<ServiceDetails />}
        />

        <Route
          path="/my-services"
          element={<MyServices />}
        />

        <Route
          path="/edit-service/:id"
          element={<EditService />}
        />

        {/* Exchange requests */}
        <Route
          path="/my-exchange-requests"
          element={<MyExchangeRequests />}
        />

        <Route
          path="/received-exchange-requests"
          element={<ReceivedExchangeRequests />}
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={<Notifications />}
        />

        {/* Cab Share */}
        <Route
          path="/cab-shares"
          element={<FindCabShares />}
        />

        <Route
          path="/cab-shares/create"
          element={<CreateCabShare />}
        />

        <Route
          path="/my-cab-shares"
          element={<MyCabShares />}
        />

        {/* Plan a Trip */}
        <Route
          path="/trips"
          element={<FindTrips />}
        />

        <Route
          path="/trips/create"
          element={<CreateTrip />}
        />

        <Route
          path="/my-trips"
          element={<MyTrips />}
        />
      </Route>

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <div className="text-center">
              <h1 className="text-6xl font-extrabold text-emerald-600">
                404
              </h1>

              <p className="mt-3 text-lg font-semibold text-slate-800">
                Page not found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                The page you are looking for does not exist.
              </p>

              <a
                href="/dashboard"
                className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
