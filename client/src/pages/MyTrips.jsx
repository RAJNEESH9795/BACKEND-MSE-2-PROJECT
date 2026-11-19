
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  CalendarDays,
  MapPin,
  Check,
  X,
  Ban,
  Flag,
} from "lucide-react";

import {
  getMyTrips,
  getMyTripRequests,
  respondToTripRequest,
  withdrawTripRequest,
  cancelTrip,
  completeTrip,
} from "../services/tripService";

const dateLabel = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function MyTrips() {
  const [owned, setOwned] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(
    useLocation().state?.message || ""
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [a, b] = await Promise.all([
        getMyTrips(),
        getMyTripRequests(),
      ]);

      setOwned(a.trips || []);
      setJoined(b.trips || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your trips."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (key, fn) => {
    setBusy(key);
    setError("");
    setNotice("");

    try {
      const result = await fn();
      setNotice(result.message || "Trip updated.");
      await refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Action failed."
      );
    } finally {
      setBusy("");
    }
  };

  const button =
    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              My trips
            </h1>

            <p className="mt-1 text-slate-600">
              Manage trips you organize and requests you have sent.
            </p>
          </div>

          <Link
            to="/trips/create"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Organize a trip
          </Link>
        </div>

        {notice && (
          <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500">
            Loading your trips...
          </p>
        ) : (
          <>
            <section className="mb-9">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Trips I organize
              </h2>

              {owned.length === 0 ? (
                <p className="rounded-xl bg-white p-6 text-sm text-slate-500">
                  You haven't organized any trips yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {owned.map((trip) => (
                    <article
                      key={trip._id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {trip.title}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {trip.source} → {trip.destination}
                            {" · "}
                            {dateLabel(trip.departureDate)}
                            {" at "}
                            {trip.departureTime}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {trip.status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-slate-600">
                        {trip.availableSlots} slots remaining ·{" "}
                        {trip.maxParticipants} maximum participants
                      </p>

                      <div className="mt-4 space-y-2">
                        {trip.requests?.length ? (
                          trip.requests.map((request) => (
                            <div
                              key={request._id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {request.user?.name || "Participant"}
                                </p>

                                <p className="text-xs capitalize text-slate-500">
                                  {request.status}
                                </p>
                              </div>

                              {request.status === "pending" &&
                                trip.status === "open" && (
                                  <div className="flex gap-2">
                                    <button
                                      disabled={!!busy}
                                      onClick={() =>
                                        act(
                                          `${trip._id}-${request._id}-approve`,
                                          () =>
                                            respondToTripRequest(
                                              trip._id,
                                              request._id,
                                              "approve"
                                            )
                                        )
                                      }
                                      className={`${button} bg-emerald-100 text-emerald-700`}
                                    >
                                      <Check size={14} />
                                      Approve
                                    </button>

                                    <button
                                      disabled={!!busy}
                                      onClick={() =>
                                        act(
                                          `${trip._id}-${request._id}-reject`,
                                          () =>
                                            respondToTripRequest(
                                              trip._id,
                                              request._id,
                                              "reject"
                                            )
                                        )
                                      }
                                      className={`${button} bg-red-100 text-red-700`}
                                    >
                                      <X size={14} />
                                      Reject
                                    </button>
                                  </div>
                                )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">
                            No join requests yet.
                          </p>
                        )}
                      </div>

                      {["open", "full"].includes(trip.status) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            disabled={!!busy}
                            onClick={() =>
                              act(
                                `${trip._id}-complete`,
                                () => completeTrip(trip._id)
                              )
                            }
                            className={`${button} bg-blue-100 text-blue-700`}
                          >
                            <Flag size={14} />
                            Mark completed
                          </button>

                          <button
                            disabled={!!busy}
                            onClick={() => {
                              if (window.confirm("Cancel this trip?")) {
                                act(
                                  `${trip._id}-cancel`,
                                  () => cancelTrip(trip._id)
                                );
                              }
                            }}
                            className={`${button} bg-red-100 text-red-700`}
                          >
                            <Ban size={14} />
                            Cancel trip
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Join requests I sent
              </h2>

              {joined.length === 0 ? (
                <p className="rounded-xl bg-white p-6 text-sm text-slate-500">
                  You haven't requested to join any trips.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {joined.map((trip) => {
                    const ownRequest = trip.requests?.[0];

                    return (
                      <article
                        key={trip._id}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <h3 className="font-bold text-slate-900">
                          {trip.title}
                        </h3>

                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={15} />
                          {trip.source} → {trip.destination}
                        </p>

                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays size={15} />
                          {dateLabel(trip.departureDate)}
                        </p>

                        <p className="mt-3 text-sm text-slate-600">
                          Organizer: {trip.createdBy?.name || "Member"}
                        </p>

                        <p className="mt-2 text-sm">
                          Request status:{" "}
                          <strong className="capitalize">
                            {ownRequest?.status || "unknown"}
                          </strong>
                        </p>

                        {["pending", "approved"].includes(ownRequest?.status) && (
                          <button
                            disabled={!!busy}
                            onClick={() =>
                              act(
                                `${trip._id}-withdraw`,
                                () =>
                                  withdrawTripRequest(
                                    trip._id,
                                    ownRequest._id
                                  )
                              )
                            }
                            className={`${button} mt-3 bg-amber-100 text-amber-800`}
                          >
                            <X size={14} />
                            Withdraw request
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default MyTrips;
