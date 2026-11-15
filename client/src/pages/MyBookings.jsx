
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Clock,
  Users,
  IndianRupee,
  RefreshCw,
  CarFront,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Clock3,
  ArrowRight,
  Ticket,
  Search,
  MessageSquare,
  Ban,
} from "lucide-react";

import api from "../services/api";

// ==========================================
// CONSTANTS
// ==========================================

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "Time unavailable";

  const [hours, minutes] = time.split(":");

  if (hours === undefined || minutes === undefined) {
    return time;
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN");
}

function getStatusStyle(status) {
  const styles = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return styles[status] || "bg-slate-100 text-slate-700 border-slate-200";
}

function getStatusIcon(status) {
  const icons = {
    pending: Clock3,
    approved: CheckCircle2,
    rejected: XCircle,
    cancelled: Ban,
  };

  return icons[status] || AlertCircle;
}

// ==========================================
// MY BOOKINGS COMPONENT
// ==========================================

function MyBookings() {
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");

  const [cancellingId, setCancellingId] = useState(null);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");

  // ==========================================
  // FETCH BOOKINGS
  // ==========================================

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/bookings/my-bookings");

      setBookings(response.data.bookings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // LOAD BOOKINGS ON PAGE OPEN
  // ==========================================

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ==========================================
  // BOOKING COUNTS
  // ==========================================

  const getBookingCount = (status) => {
    if (status === "all") {
      return bookings.length;
    }

    return bookings.filter(
      (booking) => booking.status === status
    ).length;
  };

  const filteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter(
          (booking) => booking.status === activeFilter
        );

  // ==========================================
  // CANCEL BOOKING
  // ==========================================

  const handleCancelBooking = async (booking) => {
    const ride = booking.ride;

    const confirmed = window.confirm(
      `Are you sure you want to cancel your booking from ${
        ride?.source || "this ride"
      } to ${ride?.destination || "the destination"}?`
    );

    if (!confirmed) return;

    try {
      setCancellingId(booking._id);
      setCancelMessage("");
      setCancelError("");

      const response = await api.patch(
        `/bookings/${booking._id}/cancel`
      );

      setCancelMessage(
        response.data.message || "Booking cancelled successfully."
      );

      // Update the booking immediately.
      setBookings((previousBookings) =>
        previousBookings.map((item) =>
          item._id === booking._id
            ? { ...item, status: "cancelled" }
            : item
        )
      );
    } catch (err) {
      setCancelError(
        err.response?.data?.message ||
          "Unable to cancel booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  // ==========================================
  // BOOKING SUMMARY CARD
  // ==========================================

  const summaryCards = [
    {
      label: "Total Bookings",
      value: getBookingCount("all"),
      icon: Ticket,
      style: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending",
      value: getBookingCount("pending"),
      icon: Clock3,
      style: "bg-amber-50 text-amber-700",
    },
    {
      label: "Approved",
      value: getBookingCount("approved"),
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Rejected",
      value: getBookingCount("rejected"),
      icon: XCircle,
      style: "bg-red-50 text-red-700",
    },
    {
      label: "Cancelled",
      value: getBookingCount("cancelled"),
      icon: Ban,
      style: "bg-slate-100 text-slate-700",
    },
  ];

  // ==========================================
  // RENDER BOOKING CARD
  // ==========================================

  const renderBookingCard = (booking) => {
    const ride = booking.ride;

    // Ride may have been deleted.
    if (!ride) {
      return (
        <article
          key={booking._id}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 text-slate-500">
            <AlertCircle size={22} />

            <div>
              <p className="font-semibold text-slate-800">
                Ride information unavailable
              </p>

              <p className="mt-1 text-sm">
                Booking ID: {booking._id.slice(-8)}
              </p>
            </div>
          </div>
        </article>
      );
    }

    const totalCost =
      Number(ride.costPerSeat || 0) * Number(booking.seats || 0);

    const canCancel = ["pending", "approved"].includes(
      booking.status
    );

    const isCancelling = cancellingId === booking._id;

    const StatusIcon = getStatusIcon(booking.status);

    return (
      <article
        key={booking._id}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
      >
        <div className="p-5 sm:p-6">

          {/* BOOKING HEADER */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Booking reference
              </p>

              <p className="mt-1 font-bold text-slate-800">
                #{booking._id.slice(-8).toUpperCase()}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyle(
                booking.status
              )}`}
            >
              <StatusIcon size={15} />
              {booking.status}
            </span>
          </div>

          {/* ROUTE */}

          <div className="mt-6 rounded-xl bg-slate-50 p-4 sm:p-5">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <MapPin size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  Starting point
                </p>

                <p className="break-words font-bold text-slate-900">
                  {ride.source}
                </p>
              </div>

            </div>

            <div className="ml-5 my-2 h-6 border-l-2 border-dashed border-slate-300" />

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <MapPin size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  Destination
                </p>

                <p className="break-words font-bold text-slate-900">
                  {ride.destination}
                </p>
              </div>

            </div>
          </div>

          {/* TRAVEL DETAILS */}

          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <CalendarDays size={17} />
                <span className="text-xs font-medium">
                  Departure
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-800">
                {formatDate(ride.departureDate)}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Clock size={17} />
                <span className="text-xs font-medium">
                  Time
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-800">
                {formatTime(ride.departureTime)}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Users size={17} />
                <span className="text-xs font-medium">
                  Seats booked
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-800">
                {booking.seats}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <IndianRupee size={17} />
                <span className="text-xs font-medium">
                  Estimated cost
                </span>
              </div>

              <p className="text-sm font-bold text-emerald-700">
                ₹{formatCurrency(totalCost)}
              </p>
            </div>

          </div>

          {/* RIDE OWNER */}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">

            <div>
              <p className="text-xs text-slate-400">
                Ride offered by
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {ride.createdBy?.name || "Community member"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">
                Price per seat
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                ₹{formatCurrency(ride.costPerSeat)}
              </p>
            </div>

          </div>

          {/* PASSENGER MESSAGE */}

          {booking.message && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <MessageSquare size={16} />

                <p className="text-xs font-semibold">
                  Your message to the ride owner
                </p>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {booking.message}
              </p>
            </div>
          )}

          {/* STATUS EXPLANATION */}

          {booking.status === "pending" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Clock3
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-bold text-amber-900">
                  Waiting for approval
                </p>

                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  Your booking request has been sent. The ride owner
                  needs to approve it before your seats are confirmed.
                </p>
              </div>
            </div>
          )}

          {booking.status === "approved" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Booking approved!
                </p>

                <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                  The ride owner has approved your booking.
                </p>
              </div>
            </div>
          )}

          {booking.status === "rejected" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div>
                <p className="text-sm font-bold text-red-900">
                  Booking not approved
                </p>

                <p className="mt-1 text-xs leading-relaxed text-red-800">
                  The ride owner rejected this booking request.
                  You can explore other available rides.
                </p>
              </div>
            </div>
          )}

          {booking.status === "cancelled" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Ban
                size={19}
                className="mt-0.5 shrink-0 text-slate-600"
              />

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Booking cancelled
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  This booking is no longer active.
                </p>
              </div>
            </div>
          )}

          {/* ACTIONS */}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">

            <Link
              to={`/rides/${ride._id}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Ride Details
              <ArrowRight size={16} />
            </Link>

            {canCancel && (
              <button
                type="button"
                onClick={() => handleCancelBooking(booking)}
                disabled={cancellingId !== null}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle size={17} />
                    Cancel Booking
                  </>
                )}
              </button>
            )}

          </div>
        </div>
      </article>
    );
  };

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800">
              <Ticket size={15} />
              PASSENGER DASHBOARD
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              My Bookings
            </h1>

            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Track your ride requests and manage your journeys.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCancelMessage("");
              setCancelError("");
              fetchBookings();
            }}
            disabled={loading || cancellingId !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* CANCELLATION SUCCESS */}

        {cancelMessage && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
          >
            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Booking cancelled successfully
              </p>

              <p className="mt-1 text-sm">
                {cancelMessage}
              </p>
            </div>
          </div>
        )}

        {/* CANCELLATION ERROR */}

        {cancelError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0"
            />

            <p className="text-sm font-medium">
              {cancelError}
            </p>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <RefreshCw
              className="mx-auto animate-spin text-emerald-600"
              size={36}
            />

            <p className="mt-4 font-semibold text-slate-800">
              Loading your bookings...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Please wait while we retrieve your booking history.
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle size={24} />

              <h2 className="font-bold">
                Unable to load bookings
              </h2>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchBookings}
              className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* SUCCESSFUL DATA LOAD */}

        {!loading && !error && (
          <>

            {/* EMPTY BOOKINGS */}

            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <CarFront size={34} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  No bookings yet
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  You haven't requested any rides yet. Find a ride
                  and send your first booking request.
                </p>

                <Link
                  to="/rides"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Search size={18} />
                  Find a Ride
                </Link>
              </div>
            ) : (
              <>

                {/* SUMMARY CARDS */}

                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <div
                        key={card.label}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.style}`}
                        >
                          <Icon size={21} />
                        </div>

                        <p className="mt-4 text-2xl font-extrabold text-slate-900">
                          {card.value}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {card.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* FILTERS */}

                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900">
                      Booking History
                    </h2>

                    <p className="text-xs text-slate-500">
                      {filteredBookings.length} result
                      {filteredBookings.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {filterOptions.map((filter) => (
                      <button
                        type="button"
                        key={filter.value}
                        onClick={() => setActiveFilter(filter.value)}
                        className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                          activeFilter === filter.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
                        }`}
                      >
                        {filter.label} ({getBookingCount(filter.value)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* EMPTY FILTER RESULT */}

                {filteredBookings.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                    <Ticket
                      size={38}
                      className="mx-auto text-slate-400"
                    />

                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      No {activeFilter} bookings
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      You don't have any bookings with this status.
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      View All Bookings
                    </button>
                  </div>
                ) : (

                  /* BOOKING CARDS */

                  <div className="space-y-5">
                    {filteredBookings.map((booking) =>
                      renderBookingCard(booking)
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* BACK TO DASHBOARD */}

        <div className="mt-8 border-t border-slate-200 pt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
          >
            <ArrowRight
              size={16}
              className="rotate-180"
            />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}

export default MyBookings;
