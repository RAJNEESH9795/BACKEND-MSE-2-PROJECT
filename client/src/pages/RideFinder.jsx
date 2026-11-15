
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  IndianRupee,
  CarFront,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  X,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  source: "",
  destination: "",
  departureDate: "",
  departureTime: "",
  totalSeats: 1,
  costPerSeat: "",
  description: "",
};

const initialFilters = {
  source: "",
  destination: "",
  date: "",
};

function getTodayDate() {
  const today = new Date();
  const offset = today.getTimezoneOffset();

  return new Date(today.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
}

function formatDate(date) {
  if (!date) return "Date not available";

  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "Time not available";

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

function RideFinder() {
  const { user } = useAuth();

  const currentUserId = user?._id || user?.id;

  const [rides, setRides] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const today = getTodayDate();

  // ==========================================
  // FETCH RIDES
  // ==========================================

  const fetchRides = useCallback(async (searchFilters = initialFilters) => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (searchFilters.source.trim()) {
        params.source = searchFilters.source.trim();
      }

      if (searchFilters.destination.trim()) {
        params.destination = searchFilters.destination.trim();
      }

      if (searchFilters.date) {
        params.date = searchFilters.date;
      }

      const response = await api.get("/rides", { params });

      setRides(response.data.rides || []);
    } catch (err) {
      setRides([]);
      setError(
        err.response?.data?.message || "Unable to load rides. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides(initialFilters);
  }, [fetchRides]);

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE RIDE
  // ==========================================

  const handleCreateRide = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");
      setMessage("");

      if (form.departureDate < today) {
        setError("Please select today or a future travel date.");
        return;
      }

      if (
        !Number.isInteger(Number(form.totalSeats)) ||
        Number(form.totalSeats) < 1 ||
        Number(form.totalSeats) > 8
      ) {
        setError("Total seats must be between 1 and 8.");
        return;
      }

      if (Number(form.costPerSeat) < 0 || form.costPerSeat === "") {
        setError("Please enter a valid cost per seat.");
        return;
      }

      const payload = {
        ...form,
        totalSeats: Number(form.totalSeats),
        costPerSeat: Number(form.costPerSeat),
      };

      await api.post("/rides", payload);

      setMessage("Your ride has been published successfully!");
      setForm(initialForm);

      await fetchRides(filters);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create ride. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // SEARCH RIDES
  // ==========================================

  const handleSearch = (e) => {
    e.preventDefault();

    if (filters.date && filters.date < today) {
      setError("Please select today or a future date.");
      return;
    }

    setMessage("");
    fetchRides(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setError("");
    setMessage("");
    fetchRides(initialFilters);
  };

  // ==========================================
  // RIDE CARD
  // ==========================================

  const renderRideCard = (ride) => {
    const creatorId =
      typeof ride.createdBy === "object"
        ? ride.createdBy?._id
        : ride.createdBy;

    const isOwner =
      currentUserId &&
      creatorId &&
      String(currentUserId) === String(creatorId);

    return (
      <article
        key={ride._id}
        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6"
      >
        {/* Route */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MapPin size={21} />
            </div>

            <div className="min-w-0">
              <h3 className="break-words text-lg font-bold text-slate-900">
                {ride.source}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Starting point
              </p>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center px-3 sm:flex">
            <div className="h-px w-full border-t-2 border-dashed border-slate-300" />
            <CarFront className="mx-2 shrink-0 text-emerald-600" size={23} />
            <div className="h-px w-full border-t-2 border-dashed border-slate-300" />
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <MapPin size={21} />
            </div>

            <div className="min-w-0">
              <h3 className="break-words text-lg font-bold text-slate-900">
                {ride.destination}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Destination
              </p>
            </div>
          </div>
        </div>

        <div className="my-5 border-t border-slate-100" />

        {/* Ride information */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-slate-400">
              <CalendarDays size={16} />
              <span className="text-xs font-medium">Travel date</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {formatDate(ride.departureDate)}
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2 text-slate-400">
              <Clock size={16} />
              <span className="text-xs font-medium">Departure</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {formatTime(ride.departureTime)}
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2 text-slate-400">
              <Users size={16} />
              <span className="text-xs font-medium">Available seats</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {ride.availableSeats} / {ride.totalSeats}
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2 text-slate-400">
              <IndianRupee size={16} />
              <span className="text-xs font-medium">Per seat</span>
            </div>
            <p className="text-sm font-bold text-emerald-700">
              ₹{Number(ride.costPerSeat).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Description */}
        {ride.description && (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
            {ride.description}
          </p>
        )}

        {/* Creator and status */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Ride offered by</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              {ride.createdBy?.name || "Community member"}
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            {ride.status === "full" ? "Full" : "Open"}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          {isOwner ? (
            <Link
              to={`/manage-bookings/${ride._id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              Manage Bookings
              <ArrowRight size={17} />
            </Link>
          ) : (
            <Link
              to={`/rides/${ride._id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              View Ride Details
              <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </article>
    );
  };

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page heading */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <CarFront size={15} />
            COMMUNITY MOBILITY
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            MoveMate Ride Finder
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Travel together, share costs and connect with people
            travelling your way.
          </p>
        </div>

        {/* Feedback messages */}
        {message && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <PlusCircle size={19} className="mt-0.5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <X size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">

          {/* ======================================
              CREATE RIDE
          ====================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <PlusCircle size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Offer a Ride
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Share your journey with the community.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRide} className="space-y-5">

              <div>
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Starting location
                </label>

                <input
                  id="source"
                  name="source"
                  value={form.source}
                  onChange={handleFormChange}
                  placeholder="e.g. Agra"
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="destination"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Destination
                </label>

                <input
                  id="destination"
                  name="destination"
                  value={form.destination}
                  onChange={handleFormChange}
                  placeholder="e.g. New Delhi"
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="departureDate"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Travel date
                  </label>

                  <input
                    id="departureDate"
                    type="date"
                    name="departureDate"
                    value={form.departureDate}
                    onChange={handleFormChange}
                    min={today}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="departureTime"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Departure time
                  </label>

                  <input
                    id="departureTime"
                    type="time"
                    name="departureTime"
                    value={form.departureTime}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="totalSeats"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Total seats
                  </label>

                  <input
                    id="totalSeats"
                    type="number"
                    name="totalSeats"
                    value={form.totalSeats}
                    onChange={handleFormChange}
                    min="1"
                    max="8"
                    step="1"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="costPerSeat"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Cost per seat (₹)
                  </label>

                  <input
                    id="costPerSeat"
                    type="number"
                    name="costPerSeat"
                    value={form.costPerSeat}
                    onChange={handleFormChange}
                    min="0"
                    step="1"
                    required
                    placeholder="300"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Additional details
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Mention luggage space, pickup details or other useful information..."
                  maxLength={500}
                  rows={4}
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.description.length}/500
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <LoaderCircle className="animate-spin" size={19} />
                    Publishing ride...
                  </>
                ) : (
                  <>
                    <PlusCircle size={19} />
                    Publish Ride
                  </>
                )}
              </button>
            </form>
          </section>

          {/* ======================================
              SEARCH AND RIDE RESULTS
          ====================================== */}

          <section className="min-w-0">

            {/* Search form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Search size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Find a Ride
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Discover available community rides.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">

                <div>
                  <label
                    htmlFor="filterSource"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    From
                  </label>

                  <input
                    id="filterSource"
                    name="source"
                    value={filters.source}
                    onChange={handleFilterChange}
                    placeholder="Enter starting location"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filterDestination"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    To
                  </label>

                  <input
                    id="filterDestination"
                    name="destination"
                    value={filters.destination}
                    onChange={handleFilterChange}
                    placeholder="Enter destination"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filterDate"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Travel date
                  </label>

                  <input
                    id="filterDate"
                    type="date"
                    name="date"
                    value={filters.date}
                    min={today}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Search size={18} />
                    Search Rides
                  </button>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <RefreshCw size={17} />
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Results heading */}
            <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Available Rides
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Searching for rides..."
                    : `${rides.length} ride${rides.length === 1 ? "" : "s"} found`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchRides(filters)}
                disabled={loading}
                aria-label="Refresh rides"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                <LoaderCircle
                  size={34}
                  className="animate-spin text-emerald-600"
                />
                <p className="mt-4 font-medium text-slate-700">
                  Finding available rides...
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Please wait a moment.
                </p>
              </div>
            )}

            {/* Empty state */}
            {!loading && rides.length === 0 && !error && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <CarFront size={32} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No rides found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  We couldn't find any rides matching your search.
                  Try changing your filters or offer a ride yourself.
                </p>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <X size={16} />
                  Clear filters
                </button>
              </div>
            )}

            {/* Ride cards */}
            {!loading && rides.length > 0 && (
              <div className="space-y-4">
                {rides.map((ride) => renderRideCard(ride))}
              </div>
            )}

          </section>
        </div>
      </div>
    </div>
  );
}

export default RideFinder;
