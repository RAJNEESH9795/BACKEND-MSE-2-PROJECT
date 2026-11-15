
import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Clock,
  Users,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CarFront,
  ArrowLeft,
  UserRound,
  MessageSquare,
  Clock3,
  Ban,
  Ticket,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";

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
    pending: "border-amber-200 bg-amber-100 text-amber-800",
    approved: "border-emerald-200 bg-emerald-100 text-emerald-800",
    rejected: "border-red-200 bg-red-100 text-red-800",
    cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return styles[status] || "border-slate-200 bg-slate-100 text-slate-700";
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
// MANAGE BOOKINGS COMPONENT
// ==========================================

function ManageBookings() {
  const { rideId } = useParams();

  const [ride, setRide] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [processingId, setProcessingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // ==========================================
  // FETCH RIDE AND BOOKING REQUESTS
  // ==========================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [bookingResponse, rideResponse] = await Promise.all([
        api.get(`/bookings/ride/${rideId}`),
        api.get(`/rides/${rideId}`),
      ]);

      setBookings(bookingResponse.data.bookings || []);
      setRide(rideResponse.data.ride || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load booking requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  // ==========================================
  // LOAD DATA WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const pendingCount = getBookingCount("pending");
  const approvedCount = getBookingCount("approved");
  const rejectedCount = getBookingCount("rejected");
  const cancelledCount = getBookingCount("cancelled");

  const filterOptions = [
    { label: "All Requests", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const filteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter(
          (booking) => booking.status === activeFilter
        );

  // ==========================================
  // APPROVE OR REJECT BOOKING
  // ==========================================

  const handleBookingAction = async (bookingId, status) => {
    const action = status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this booking request?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(bookingId);
      setActionError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/bookings/${bookingId}/status`,
        { status }
      );

      // Update the selected booking immediately.
      setBookings((previousBookings) =>
        previousBookings.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                status:
                  response.data.booking?.status || status,
              }
            : booking
        )
      );

      // Refresh ride details to get accurate seat availability.
      const rideResponse = await api.get(`/rides/${rideId}`);

      setRide(rideResponse.data.ride || null);

      setSuccessMessage(
        response.data.message ||
          `Booking ${status} successfully.`
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          `Unable to ${action} this booking. Please try again.`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ==========================================
  // SUMMARY CARDS
  // ==========================================

  const summaryCards = [
    {
      label: "Total Requests",
      value: bookings.length,
      icon: Ticket,
      style: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock3,
      style: "bg-amber-50 text-amber-700",
    },
    {
      label: "Approved",
      value: approvedCount,
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      icon: XCircle,
      style: "bg-red-50 text-red-700",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      icon: Ban,
      style: "bg-slate-100 text-slate-700",
    },
  ];

  // ==========================================
  // BOOKING CARD
  // ==========================================

  const renderBookingCard = (booking) => {
    const passenger = booking.user;

    const isPending = booking.status === "pending";
    const isProcessing = processingId === booking._id;

    const totalAmount =
      Number(ride?.costPerSeat || 0) *
      Number(booking.seats || 0);

    const StatusIcon = getStatusIcon(booking.status);

    return (
      <article
        key={booking._id}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
      >
        <div className="p-5 sm:p-6">

          {/* PASSENGER HEADER */}

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserRound size={24} />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-slate-900">
                  {passenger?.name || "Unknown Passenger"}
                </h3>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {passenger?.email || "Email unavailable"}
                </p>
              </div>
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

          {/* BOOKING REFERENCE */}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Booking reference
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              #{booking._id.slice(-8).toUpperCase()}
            </p>
          </div>

          {/* PASSENGER BOOKING DETAILS */}

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Users size={17} />
                <span className="text-xs font-medium">
                  Seats requested
                </span>
              </div>

              <p className="mt-2 text-xl font-extrabold text-slate-900">
                {booking.seats}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <IndianRupee size={17} />
                <span className="text-xs font-medium">
                  Price per seat
                </span>
              </div>

              <p className="mt-2 text-xl font-extrabold text-slate-900">
                ₹{formatCurrency(ride?.costPerSeat)}
              </p>
            </div>

            <div className="col-span-2 rounded-xl bg-emerald-50 p-4 sm:col-span-1">
              <div className="flex items-center gap-2 text-emerald-700">
                <IndianRupee size={17} />
                <span className="text-xs font-semibold">
                  Estimated total
                </span>
              </div>

              <p className="mt-2 text-xl font-extrabold text-emerald-800">
                ₹{formatCurrency(totalAmount)}
              </p>
            </div>

          </div>

          {/* PASSENGER MESSAGE */}

          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <MessageSquare size={17} />

              <p className="text-xs font-bold uppercase tracking-wider">
                Passenger message
              </p>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {booking.message ||
                "The passenger did not add a message."}
            </p>
          </div>

          {/* PENDING REQUEST NOTICE */}

          {isPending && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Clock3
                size={20}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-bold text-amber-900">
                  Action required
                </p>

                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  This passenger is waiting for your response.
                  Review the request and approve or reject it.
                </p>
              </div>
            </div>
          )}

          {/* APPROVED NOTICE */}

          {booking.status === "approved" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Booking approved
                </p>

                <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                  You approved this passenger's request.
                </p>
              </div>
            </div>
          )}

          {/* REJECTED NOTICE */}

          {booking.status === "rejected" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div>
                <p className="text-sm font-bold text-red-900">
                  Booking rejected
                </p>

                <p className="mt-1 text-xs leading-relaxed text-red-800">
                  You rejected this passenger's booking request.
                </p>
              </div>
            </div>
          )}

          {/* CANCELLED NOTICE */}

          {booking.status === "cancelled" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Ban
                size={20}
                className="mt-0.5 shrink-0 text-slate-600"
              />

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Booking cancelled
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  The passenger cancelled this booking.
                </p>
              </div>
            </div>
          )}

          {/* APPROVE / REJECT ACTIONS */}

          {isPending && (
            <div className="mt-6 border-t border-slate-100 pt-5">

              <p className="mb-3 text-sm font-semibold text-slate-700">
                Respond to this request
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={() =>
                    handleBookingAction(booking._id, "approved")
                  }
                  disabled={processingId !== null}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}

                  {isProcessing ? "Processing..." : "Approve Request"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleBookingAction(booking._id, "rejected")
                  }
                  disabled={processingId !== null}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={18} />
                  Reject Request
                </button>

              </div>
            </div>
          )}
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

        {/* BACK NAVIGATION */}

        <Link
          to="/rides"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          <ArrowLeft size={18} />
          Back to Rides
        </Link>

        {/* PAGE HEADING */}

        <div className="mb-8 mt-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800">
            <CarFront size={15} />
            RIDE OWNER DASHBOARD
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Manage Bookings
              </h1>

              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Review passenger requests and manage your ride.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSuccessMessage("");
                setActionError("");
                fetchData();
              }}
              disabled={loading || processingId !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
          >
            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-bold">
                Action completed successfully
              </p>

              <p className="mt-1 text-sm">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* ACTION ERROR */}

        {actionError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0"
            />

            <p className="text-sm font-medium">
              {actionError}
            </p>
          </div>
        )}

        {/* LOADING STATE */}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <RefreshCw
              size={36}
              className="mx-auto animate-spin text-emerald-600"
            />

            <p className="mt-4 font-semibold text-slate-800">
              Loading booking requests...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Please wait while we retrieve your ride information.
            </p>
          </div>
        )}

        {/* ERROR STATE */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <AlertCircle
              size={38}
              className="mx-auto text-red-500"
            />

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Unable to load booking requests
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchData}
              className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* SUCCESSFULLY LOADED DATA */}

        {!loading && !error && (
          <>
            {/* RIDE OVERVIEW */}

            {ride && (
              <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CarFront size={23} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Your published ride
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {ride.source} → {ride.destination}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-4 sm:p-6">

                  <div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <CalendarDays size={18} />
                      <span className="text-xs font-medium">
                        Departure date
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDate(ride.departureDate)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={18} />
                      <span className="text-xs font-medium">
                        Departure time
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatTime(ride.departureTime)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users size={18} />
                      <span className="text-xs font-medium">
                        Available seats
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {ride.availableSeats} / {ride.totalSeats}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <IndianRupee size={18} />
                      <span className="text-xs font-medium">
                        Cost per seat
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      ₹{formatCurrency(ride.costPerSeat)}
                    </p>
                  </div>

                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">

                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        ride.status === "open"
                          ? "bg-emerald-500"
                          : ride.status === "full"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />

                    <span className="text-sm font-semibold capitalize text-slate-700">
                      Ride {ride.status}
                    </span>
                  </div>

                  <Link
                    to={`/rides/${ride._id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                  >
                    View Ride Details
                    <ArrowRight size={16} />
                  </Link>

                </div>
              </section>
            )}

            {/* SUMMARY CARDS */}

            <section className="mb-8">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Booking Overview
              </h2>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
            </section>

            {/* PENDING REQUEST REMINDER */}

            {pendingCount > 0 && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Clock3
                  size={21}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="font-bold text-amber-900">
                    You have {pendingCount} pending request
                    {pendingCount === 1 ? "" : "s"}
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    Review the passenger details and respond to their requests.
                  </p>
                </div>
              </div>
            )}

            {/* REQUEST FILTERS */}

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Passenger Requests
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review and manage all requests for this ride.
                </p>
              </div>

              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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

              {/* NO REQUESTS AT ALL */}

              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Users size={34} />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    No booking requests yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                    Passenger requests will appear here when someone
                    requests a seat on your ride.
                  </p>

                  <Link
                    to="/rides"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Back to Rides
                    <ArrowRight size={17} />
                  </Link>
                </div>
              ) : filteredBookings.length === 0 ? (

                /* NO RESULTS FOR SELECTED FILTER */

                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                  <Ticket
                    size={38}
                    className="mx-auto text-slate-400"
                  />

                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    No {activeFilter} requests
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    There are no booking requests with this status.
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View All Requests
                  </button>
                </div>
              ) : (

                /* BOOKING REQUEST CARDS */

                <div className="space-y-5">
                  {filteredBookings.map((booking) =>
                    renderBookingCard(booking)
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* FOOTER NAVIGATION */}

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>
        </div>

        {/* SECURITY NOTE */}

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-100 p-4">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <p className="text-xs leading-relaxed text-slate-500">
            Booking approvals are processed securely through the
            MoveMate backend. Available seats are updated by the
            server when a booking is approved.
          </p>
        </div>

      </div>
    </div>
  );
}

export default ManageBookings;