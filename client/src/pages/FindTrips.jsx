
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  MapPin,
  CalendarDays,
  Clock3,
  Users,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  getTrips,
  requestToJoinTrip,
} from "../services/tripService";

const dateLabel = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function FindTrips() {
  const [filters, setFilters] = useState({
    source: "",
    destination: "",
    date: "",
  });

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [joining, setJoining] = useState("");

  const loadTrips = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");

    try {
      const result = await getTrips(params);
      setTrips(result.trips || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load trips."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const submit = (event) => {
    event.preventDefault();

    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value.trim())
    );

    loadTrips(params);
  };

  const reset = () => {
    const empty = {
      source: "",
      destination: "",
      date: "",
    };

    setFilters(empty);
    loadTrips();
  };

  const join = async (id) => {
    setJoining(id);
    setNotice("");
    setError("");

    try {
      const result = await requestToJoinTrip(id);

      setNotice(result.message || "Join request sent.");

      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value.trim())
      );

      await loadTrips(params);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to send request."
      );
    } finally {
      setJoining("");
    }
  };

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Community travel
            </p>

            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
              Discover trips
            </h1>

            <p className="mt-2 text-slate-600">
              Find people heading in the same direction and plan together.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/my-trips"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              My trips
            </Link>

            <Link
              to="/trips/create"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus size={17} />
              Organize a trip
            </Link>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            className={input}
            placeholder="From location"
            value={filters.source}
            onChange={(e) =>
              setFilters({ ...filters, source: e.target.value })
            }
          />

          <input
            className={input}
            placeholder="Destination"
            value={filters.destination}
            onChange={(e) =>
              setFilters({ ...filters, destination: e.target.value })
            }
          />

          <input
            className={input}
            type="date"
            value={filters.date}
            onChange={(e) =>
              setFilters({ ...filters, date: e.target.value })
            }
          />

          <div className="flex gap-2">
            <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
              <Search size={16} />
              Search
            </button>

            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-300 px-3 text-slate-600"
              aria-label="Reset filters"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </form>

        {notice && (
          <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-slate-500">
            Loading trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <MapPin className="mx-auto text-slate-400" size={36} />

            <h2 className="mt-3 text-lg font-bold text-slate-900">
              No trips found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or organize a new trip.
            </p>

            <Link
              to="/trips/create"
              className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create a trip
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <article
                key={trip._id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {trip.availableSlots} slots available
                  </span>

                  <span className="text-xs text-slate-500">
                    Organized by {trip.createdBy?.name || "Member"}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  {trip.title}
                </h2>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <MapPin size={16} />
                    {trip.source} → {trip.destination}
                  </p>

                  <p className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    {dateLabel(trip.departureDate)}
                  </p>

                  <p className="flex items-center gap-2">
                    <Clock3 size={16} />
                    {trip.departureTime}
                  </p>

                  <p className="flex items-center gap-2">
                    <Users size={16} />
                    {trip.maxParticipants} participants maximum
                  </p>
                </div>

                {trip.estimatedCostPerPerson != null && (
                  <p className="mt-3 font-semibold text-slate-800">
                    Estimated ₹{trip.estimatedCostPerPerson} / person
                  </p>
                )}

                {trip.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                    {trip.description}
                  </p>
                )}

                <button
                  disabled={joining === trip._id}
                  onClick={() => join(trip._id)}
                  className="mt-auto pt-5"
                >
                  <span className="block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                    {joining === trip._id
                      ? "Sending request..."
                      : "Request to join"}
                  </span>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FindTrips;
