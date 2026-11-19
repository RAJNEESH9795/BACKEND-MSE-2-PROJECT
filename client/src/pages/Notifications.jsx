
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertCircle,
  Inbox,
  ArrowLeft,
  Handshake,
  Clock,
  XCircle,
  CheckCircle,
  LoaderCircle,
  CarFront,
} from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";

import {
  respondToCabRequest,
} from "../services/cabShareService";

// Notification icons
const notificationIcons = {
  exchange_request: Handshake,
  exchange_accepted: CheckCircle,
  exchange_rejected: XCircle,
  exchange_cancelled: XCircle,
  exchange_completion_pending: Clock,
  exchange_completed: CheckCircle,

  cab_share_request: CarFront,
  cab_share_accepted: CheckCircle,
  cab_share_rejected: XCircle,
  cab_share_withdrawn: XCircle,
  cab_share_cancelled: XCircle,
  cab_share_completed: CheckCircle,
};

// Notification colors
const notificationColors = {
  exchange_request: "bg-blue-100 text-blue-600",
  exchange_accepted: "bg-emerald-100 text-emerald-600",
  exchange_rejected: "bg-red-100 text-red-600",
  exchange_cancelled: "bg-orange-100 text-orange-600",
  exchange_completion_pending: "bg-amber-100 text-amber-600",
  exchange_completed: "bg-emerald-100 text-emerald-600",

  cab_share_request: "bg-cyan-100 text-cyan-700",
  cab_share_accepted: "bg-emerald-100 text-emerald-600",
  cab_share_rejected: "bg-red-100 text-red-600",
  cab_share_withdrawn: "bg-orange-100 text-orange-600",
  cab_share_cancelled: "bg-orange-100 text-orange-600",
  cab_share_completed: "bg-emerald-100 text-emerald-600",
};

// Get cab-share IDs from notification
const getCabRequestDetails = (notification) => {
  const metadata =
    notification.metadata ||
    notification.data ||
    {};

  return {
    cabShareId:
      notification.cabShareId ||
      metadata.cabShareId ||
      notification.relatedCabShare?._id ||
      notification.relatedCabShare ||
      "",

    requestId:
      notification.requestId ||
      metadata.requestId ||
      notification.relatedRequest?._id ||
      notification.relatedRequest ||
      "",
  };
};

// Format date
const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [processingId, setProcessingId] = useState("");
  const [processingAll, setProcessingAll] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getNotifications();

      if (!response.success) {
        throw new Error(
          response.message || "Unable to fetch notifications."
        );
      }

      setNotifications(response.notifications || []);
    } catch (err) {
      console.error("Fetch Notifications Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial loading
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Update Navbar notification count
  const updateNavbarCount = () => {
    window.dispatchEvent(
      new Event("notifications-updated")
    );
  };

  // Mark one notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      setProcessingId(notificationId);
      setError("");

      await markNotificationAsRead(notificationId);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      updateNavbarCount();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setProcessingId("");
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setProcessingAll(true);
      setError("");

      await markAllNotificationsAsRead();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      updateNavbarCount();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setProcessingAll(false);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId) => {
    try {
      setProcessingId(notificationId);
      setError("");

      await deleteNotification(notificationId);

      setNotifications((previous) =>
        previous.filter(
          (notification) =>
            notification._id !== notificationId
        )
      );

      updateNavbarCount();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete notification."
      );
    } finally {
      setProcessingId("");
    }
  };

  // Accept or reject Cab Share request
  const handleCabRequestResponse = async (
    notification,
    action
  ) => {
    const { cabShareId, requestId } =
      getCabRequestDetails(notification);

    if (!cabShareId || !requestId) {
      setError(
        "This notification is missing its Cab Share ID or Request ID. Please create a new joining request after updating the backend."
      );
      return;
    }

    const confirmation =
      action === "approved"
        ? "Are you sure you want to accept this request?"
        : "Are you sure you want to reject this request?";

    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setProcessingId(notification._id);
      setError("");
      setSuccess("");

      const response = await respondToCabRequest(
        cabShareId,
        requestId,
        action
      );

      setSuccess(
        response.message ||
          (action === "approved"
            ? "Cab-sharing request accepted successfully."
            : "Cab-sharing request rejected successfully.")
      );

      // Mark notification as read
      if (!notification.isRead) {
        try {
          await markNotificationAsRead(notification._id);
        } catch (readError) {
          console.error(
            "Unable to mark notification as read:",
            readError
          );
        }
      }

      await fetchNotifications();
      updateNavbarCount();
    } catch (err) {
      console.error(
        "Cab Request Response Error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Unable to process this cab-sharing request."
      );
    } finally {
      setProcessingId("");
    }
  };

  // Unread count
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // Icon helper
  const getIcon = (type) =>
    notificationIcons[type] || Bell;

  // Color helper
  const getIconColor = (type) =>
    notificationColors[type] ||
    "bg-slate-100 text-slate-600";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Bell size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>

                <p className="text-sm text-slate-500">
                  Stay updated on your cab shares and service exchanges.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={processingAll}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {processingAll ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCheck size={16} />
                  )}

                  Mark All as Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div>
              <p className="text-sm text-slate-500">
                Total Notifications
              </p>

              <p className="text-xl font-bold text-slate-900">
                {notifications.length}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Unread
              </p>

              <p className="text-xl font-bold text-emerald-600">
                {unreadCount}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
            <LoaderCircle
              size={36}
              className="animate-spin text-emerald-600"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox size={32} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-800">
              You're all caught up!
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              You don't have any notifications yet.
            </p>

            <Link
              to="/cab-shares"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Explore Shared Cabs
            </Link>
          </div>
        ) : (
          /* Notification list */
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const iconColor = getIconColor(notification.type);

              const isProcessing =
                processingId === notification._id;

              const isCabRequest =
                notification.type === "cab_share_request";

              const { cabShareId, requestId } =
                getCabRequestDetails(notification);

              return (
                <article
                  key={notification._id}
                  className={`rounded-xl border p-4 transition sm:p-5 ${
                    notification.isRead
                      ? "border-slate-200 bg-white"
                      : "border-emerald-200 bg-emerald-50/50 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">

                    {/* Icon */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
                    >
                      <Icon size={21} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {notification.title}
                        </h3>

                        {!notification.isRead && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>

                      {notification.sender?.name && (
                        <p className="mt-2 text-xs text-slate-500">
                          From: {notification.sender.name}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(notification.createdAt)}
                      </p>

                      {/* Accept / Reject */}
                      {isCabRequest && (
                        <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                          <p className="mb-3 text-sm font-semibold text-cyan-900">
                            A student wants to join your cab.
                          </p>

                          {cabShareId && requestId ? (
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCabRequestResponse(
                                    notification,
                                    "approved"
                                  )
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle size={16} />
                                )}

                                Accept Request
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCabRequestResponse(
                                    notification,
                                    "rejected"
                                  )
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <XCircle size={16} />
                                Reject Request
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-red-700">
                                This notification is missing its Cab Share ID or Request ID.
                              </p>

                              <Link
                                to="/my-cab-shares"
                                className="mt-2 inline-block text-sm font-semibold text-cyan-800 underline"
                              >
                                Manage requests in My Cab Shares
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Standard notification actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkAsRead(notification._id)
                            }
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                          >
                            <Check size={15} />
                            Mark as Read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(notification._id)
                          }
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <LoaderCircle
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={15} />
                          )}

                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Read indicator */}
                    {notification.isRead && (
                      <CheckCheck
                        size={18}
                        className="hidden shrink-0 text-slate-400 sm:block"
                        title="Read"
                      />
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

export default Notifications;
