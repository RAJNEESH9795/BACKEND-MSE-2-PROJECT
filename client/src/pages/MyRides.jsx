
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CarFront,
  MapPin,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  RefreshCw,
  Search,
  Plus,
  ClipboardList,
  XCircle,
  AlertCircle,
  CheckCircle,
  Pencil,
} from "lucide-react";

import api from "../services/api";

function MyRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch rides belonging to the logged-in user
  const fetchMyRides = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/rides/my-rides");

      setRides(response.data.rides || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch your rides."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRides();
  }, [fetchMyRides]);

  // Cancel a ride
  const handleCancelRide = async (rideId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ride? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setProcessingId(rideId);
      setActionMessage("");
      setActionError("");

      const response = await api.delete(`/rides/${rideId}`);

      setRides((previousRides) =>
        previousRides.map((ride) =>
          ride._id === rideId
            ? { ...ride, status: response.data.ride.status }
            : ride
        )
      );

      setActionMessage(
        response.data.message || "Ride cancelled successfully."
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to cancel this ride."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Status badge styles
  const getStatusStyle = (status) => {
    const styles = {
      open: "bg-green-100 text-green-700",
      full: "bg-amber-100 text-amber-700",
      cancelled: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  // Ride statistics
  const stats = useMemo(() => ({
    total: rides.length,
    open: rides.filter((ride) => ride.status === "open").length,
    full: rides.filter((ride) => ride.status === "full").length,
    cancelled: rides.filter((ride) => ride.status === "cancelled").length,
    completed: rides.filter((ride) => ride.status === "completed").length,
  }), [rides]);

  // Filter and search rides
  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      const matchesFilter =
        activeFilter === "all" || ride.status === activeFilter;

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        ride.source?.toLowerCase().includes(search) ||
        ride.destination?.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [rides, activeFilter, searchTerm]);

  const filters = [
    { label: "All", value: "all", count: stats.total },
    { label: "Open", value: "open", count: stats.open },
    { label: "Full", value: "full", count: stats.full },
    { label: "Cancelled", value: "cancelled", count: stats.cancelled },
    { label: "Completed", value: "completed", count: stats.completed },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Heading */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              My Rides
            </h1>

            <p className="mt-2 text-slate-500">
              View and manage all the rides you have offered.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchMyRides}
              disabled={loading || processingId !== null}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/rides"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus size={18} />
              Offer a Ride
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {actionMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            <CheckCircle size={19} />
            <p className="text-sm font-medium">{actionMessage}</p>
          </div>
        )}

        {/* Action Error Message */}
        {actionError && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={19} />
            <p className="text-sm font-medium">{actionError}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Total Rides", count: stats.total, color: "text-slate-900" },
            { label: "Open", count: stats.open, color: "text-green-600" },
            { label: "Full", count: stats.full, color: "text-amber-600" },
            { label: "Cancelled", count: stats.cancelled, color: "text-red-600" },
            { label: "Completed", count: stats.completed, color: "text-blue-600" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${item.color}`}>
                {item.count}
              </p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by source or destination..."
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <RefreshCw
              size={32}
              className="mx-auto animate-spin text-emerald-600"
            />
            <p className="mt-3 text-slate-500">
              Loading your rides...
            </p>
          </div>
        )}

        {/* Fetch Error */}
        {!loading && error && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <AlertCircle
              size={35}
              className="mx-auto text-red-500"
            />

            <p className="mt-3 font-semibold text-red-600">
              {error}
            </p>

            <button
              onClick={fetchMyRides}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && rides.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <CarFront
              size={48}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              You haven't offered any rides yet
            </h2>

            <p className="mt-2 text-slate-500">
              Create your first ride and help others travel with you.
            </p>

            <Link
              to="/rides"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              <Plus size={18} />
              Offer Your First Ride
            </Link>
          </div>
        )}

        {/* No Filter Results */}
        {!loading && !error && rides.length > 0 && filteredRides.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <Search
              size={38}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-3 font-bold text-slate-800">
              No matching rides found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or status filter.
            </p>

            <button
              onClick={() => {
                setActiveFilter("all");
                setSearchTerm("");
              }}
              className="mt-4 font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Ride Cards */}
        {!loading && !error && filteredRides.length > 0 && (
          <div className="space-y-5">
            {filteredRides.map((ride) => {
              const isOpen = ride.status === "open";
              const isProcessing = processingId === ride._id;

              return (
                <article
                  key={ride._id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  {/* Ride Heading */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-emerald-600" />

                        <h2 className="text-xl font-bold text-slate-900">
                          {ride.source} → {ride.destination}
                        </h2>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Posted by {ride.createdBy?.name || "You"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${getStatusStyle(
                        ride.status
                      )}`}
                    >
                      {ride.status}
                    </span>
                  </div>

                  {/* Ride Information */}
                  <div className="mt-6 grid gap-5 border-y border-slate-100 py-5 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="flex items-center gap-3">
                      <Calendar size={19} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-slate-400">Departure</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(ride.departureDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock size={19} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-slate-400">Time</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {ride.departureTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users size={19} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-slate-400">Available Seats</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {ride.availableSeats} / {ride.totalSeats}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <IndianRupee size={19} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-slate-400">Cost Per Seat</p>
                        <p className="text-sm font-semibold text-slate-800">
                          ₹{ride.costPerSeat}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {ride.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {ride.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/manage-bookings/${ride._id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <ClipboardList size={17} />
                      Manage Bookings
                    </Link>

                    {/* Edit Ride - Open rides only */}
                    {isOpen && (
                      <Link
                        to={`/rides/${ride._id}/edit`}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Pencil size={17} />
                        Edit Ride
                      </Link>
                    )}

                    {/* Cancel Ride - Open rides only */}
                    {isOpen && (
                      <button
                        onClick={() => handleCancelRide(ride._id)}
                        disabled={processingId !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <XCircle size={17} />
                        )}
                        {isProcessing ? "Cancelling..." : "Cancel Ride"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default MyRides;
