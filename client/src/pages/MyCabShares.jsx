
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Plus,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  IndianRupee,
  CarFront,
  LoaderCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

import {
  getMyCabShares,
  respondToCabRequest,
  cancelCabShare,
  completeCabShare,
} from "../services/cabShareService";

// Extract cab shares from supported response structures
function extractCabShares(response) {
  const possibleResults = [
    response?.cabShares,
    response?.data?.cabShares,
    response?.data,
  ];

  return possibleResults.find(Array.isArray) || [];
}

// Format date
function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MyCabShares() {
  const [cabShares, setCabShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // Fetch user's cab shares
  const fetchMyCabShares = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyCabShares();

      const shares = extractCabShares(response);

      setCabShares(shares);
    } catch (err) {
      console.error(
        "Fetch My Cab Shares Error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load your cab shares. Please try again."
      );

      setCabShares([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial loading
  useEffect(() => {
    fetchMyCabShares();
  }, [fetchMyCabShares]);

  // Approve or reject joining request
  const handleRequest = async (
    cabShareId,
    requestId,
    action
  ) => {
    try {
      setActionLoading(requestId);
      setError("");
      setSuccess("");

      const response = await respondToCabRequest(
        cabShareId,
        requestId,
        action
      );

      setSuccess(
        response?.message ||
          `Joining request ${action} successfully.`
      );

      await fetchMyCabShares();
    } catch (err) {
      console.error(
        "Cab Request Action Error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Unable to process the joining request."
      );
    } finally {
      setActionLoading("");
    }
  };

  // Cancel or complete cab share
  const handleCabAction = async (
    cabShareId,
    action
  ) => {
    const confirmation =
      action === "cancel"
        ? "Are you sure you want to cancel this cab share?"
        : "Are you sure you want to mark this cab share as completed?";

    if (!window.confirm(confirmation)) return;

    try {
      setActionLoading(cabShareId);
      setError("");
      setSuccess("");

      let response;

      if (action === "cancel") {
        response = await cancelCabShare(cabShareId);
      } else {
        response = await completeCabShare(cabShareId);
      }

      setSuccess(
        response?.message ||
          (action === "cancel"
            ? "Cab share cancelled successfully."
            : "Cab share marked as completed successfully.")
      );

      await fetchMyCabShares();
    } catch (err) {
      console.error(
        "Cab Share Action Error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Unable to complete this action."
      );
    } finally {
      setActionLoading("");
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-100">
        <LoaderCircle
          size={38}
          className="animate-spin text-emerald-600"
        />

        <p className="mt-4 text-sm font-medium text-slate-600">
          Loading your cab shares...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              My Cab Shares
            </h1>

            <p className="mt-2 text-slate-600">
              Manage your shared cab posts and joining requests.
            </p>
          </div>

          <Link
            to="/cab-shares/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus size={18} />
            Create Cab Share
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={fetchMyCabShares}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
          >
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {/* Empty state */}
        {!error && cabShares.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
              <CarFront size={32} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No cab shares yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You haven't created any shared cab posts yet.
              Create one so other students can request to join your journey.
            </p>

            <Link
              to="/cab-shares/create"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={17} />
              Create Your First Cab Share
            </Link>
          </div>
        )}

        {/* Cab share list */}
        <div className="space-y-6">
          {cabShares.map((cab) => (
            <article
              key={cab._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              {/* Journey information */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row">

                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={21}
                      className="mt-1 shrink-0 text-emerald-600"
                    />

                    <h2 className="break-words text-xl font-bold text-slate-900">
                      {cab.source} → {cab.destination}
                    </h2>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      {formatDate(cab.departureDate)}
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock size={16} />
                      {cab.departureTime || "Time unavailable"}
                    </p>

                    <p className="flex items-center gap-2">
                      <CarFront size={16} />
                      Provider: {cab.provider}
                    </p>

                    <p>
                      Booking status:{" "}
                      <span className="font-semibold capitalize">
                        {cab.bookingStatus}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Status and seats */}
                <div className="sm:text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      cab.status === "open"
                        ? "bg-emerald-100 text-emerald-700"
                        : cab.status === "full"
                        ? "bg-amber-100 text-amber-700"
                        : cab.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cab.status}
                  </span>

                  <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-800 sm:justify-end">
                    <Users size={17} />

                    {cab.availableSeats} / {cab.totalSeatsToShare} seats available
                  </p>

                  {cab.estimatedFare != null && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-slate-600 sm:justify-end">
                      <IndianRupee size={15} />
                      Estimated fare: ₹{cab.estimatedFare}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {cab.description && (
                <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {cab.description}
                </p>
              )}

              {/* Joining requests */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="mb-4 font-bold text-slate-900">
                  Joining Requests ({cab.requests?.length || 0})
                </h3>

                {!cab.requests || cab.requests.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No requests received yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cab.requests.map((request) => {
                      const student =
                        request.user &&
                        typeof request.user === "object"
                          ? request.user
                          : null;

                      return (
                        <div
                          key={request._id}
                          className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"
                        >
                          {/* Student information */}
                          <div>
                            <p className="font-semibold text-slate-900">
                              {student?.name || "Student"}
                            </p>

                            {student?.community && (
                              <p className="mt-1 text-xs text-slate-500">
                                {student.community}
                              </p>
                            )}

                            <p className="mt-1 text-sm capitalize text-slate-600">
                              Status: {request.status}
                            </p>

                            {request.requestedAt && (
                              <p className="mt-1 text-xs text-slate-400">
                                Requested:{" "}
                                {new Date(
                                  request.requestedAt
                                ).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>

                          {/* Approve and reject */}
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRequest(
                                    cab._id,
                                    request._id,
                                    "approved"
                                  )
                                }
                                disabled={
                                  actionLoading === request._id
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {actionLoading === request._id ? (
                                  <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRequest(
                                    cab._id,
                                    request._id,
                                    "rejected"
                                  )
                                }
                                disabled={
                                  actionLoading === request._id
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                              >
                                <XCircle size={16} />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cab management actions */}
              {(cab.status === "open" ||
                cab.status === "full") && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      handleCabAction(cab._id, "complete")
                    }
                    disabled={actionLoading === cab._id}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading === cab._id ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle size={16} />
                    )}

                    Mark Completed
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCabAction(cab._id, "cancel")
                    }
                    disabled={actionLoading === cab._id}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Cancel Cab Share
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Refresh */}
        {cabShares.length > 0 && (
          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={fetchMyCabShares}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh Cab Shares
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default MyCabShares;
