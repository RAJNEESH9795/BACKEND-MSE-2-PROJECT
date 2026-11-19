
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
  RefreshCw,
  LoaderCircle,
  ArrowRight,
  Plus,
} from "lucide-react";

import {
  getCabShares,
  requestToJoinCab,
} from "../services/cabShareService";

// OpenStreetMap Nominatim
const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

// Minimum interval between requests in this browser tab
let lastLocationSearchTime = 0;

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function searchPlaces(query) {
  const elapsed = Date.now() - lastLocationSearchTime;
  const delay = Math.max(0, 1100 - elapsed);

  if (delay > 0) {
    await wait(delay);
  }

  lastLocationSearchTime = Date.now();

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    countrycodes: "in",
    "accept-language": "en",
  });

  const response = await fetch(
    `${NOMINATIM_URL}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Too many searches. Please wait before trying again."
      );
    }

    throw new Error(
      "Unable to search places. Please try again."
    );
  }

  return response.json();
}

// Reusable location search input
function PlaceSearchInput({
  label,
  value,
  onChange,
  placeholder,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const searchTerm = value.trim();

    if (searchTerm.length < 3) {
      setError("Please enter at least 3 characters.");
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResults([]);

      const places = await searchPlaces(searchTerm);

      setResults(Array.isArray(places) ? places : []);

      if (!places || places.length === 0) {
        setError(
          "No matching places found. Try another search."
        );
      }
    } catch (err) {
      setError(
        err.message || "Unable to search locations."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place) => {
    onChange(place.display_name);
    setResults([]);
    setError("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      // Prevent submitting the main cab search form
      event.preventDefault();

      if (!loading) {
        handleSearch();
      }
    }

    if (event.key === "Escape") {
      setResults([]);
      setError("");
    }
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <MapPin
          size={18}
          className="shrink-0 text-slate-400"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setResults([]);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 w-full py-3 text-sm text-slate-800 outline-none"
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || value.trim().length < 3}
          title="Search places"
          aria-label={`Search ${label.toLowerCase()}`}
          className="flex shrink-0 items-center justify-center rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <Search size={18} />
          )}
        </button>
      </div>

      {loading && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <LoaderCircle
            size={14}
            className="animate-spin"
          />
          Searching places...
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <p className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select your location
          </p>

          {results.map((place) => (
            <button
              type="button"
              key={`${place.osm_type}-${place.osm_id}`}
              onClick={() => handleSelect(place)}
              className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-emerald-50"
            >
              <MapPin
                size={17}
                className="mt-1 shrink-0 text-emerald-600"
              />

              <span className="text-sm leading-5 text-slate-700">
                {place.display_name}
              </span>
            </button>
          ))}

          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            © OpenStreetMap contributors
          </p>
        </div>
      )}
    </div>
  );
}

// Format departure date
function formatDate(date) {
  if (!date) return "Date not available";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Get creator name
function getCreatorName(creator) {
  if (!creator) return "MoveMate member";

  if (typeof creator === "object") {
    return creator.name || "MoveMate member";
  }

  return "MoveMate member";
}

function FindCabShares() {
  const [cabShares, setCabShares] = useState([]);

  const [filters, setFilters] = useState({
    source: "",
    destination: "",
    date: "",
    provider: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch cab shares
  const fetchCabShares = useCallback(async (searchFilters) => {
    try {
      setLoading(true);
      setError("");

      const response = await getCabShares(searchFilters);

      setCabShares(
        response?.cabShares ||
        response?.data?.cabShares ||
        []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load available cab-sharing posts."
      );

      setCabShares([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial loading only
  useEffect(() => {
    fetchCabShares({});
  }, [fetchCabShares]);

  // Update filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Search cab shares
  const handleSearch = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setError("");

    await fetchCabShares(filters);
  };

  // Reset filters
  const handleReset = async () => {
    const emptyFilters = {
      source: "",
      destination: "",
      date: "",
      provider: "",
    };

    setFilters(emptyFilters);
    setSuccessMessage("");
    setError("");

    await fetchCabShares(emptyFilters);
  };

  // Request to join a cab
  const handleJoinRequest = async (cabShareId) => {
    try {
      setRequestingId(cabShareId);
      setError("");
      setSuccessMessage("");

      const response = await requestToJoinCab(cabShareId);

      setSuccessMessage(
        response.message ||
          "Your join request was submitted successfully."
      );

      await fetchCabShares(filters);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send your request. Please try again."
      );
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <CarFront size={30} />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900">
              Find Shared Cabs
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Find students travelling in your direction, request
              a seat and share the journey.
            </p>
          </div>

          <Link
            to="/cab-shares/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus size={18} />
            Post a Shared Cab
          </Link>
        </div>

        {/* Success message */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Search filters */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <Search size={20} className="text-emerald-600" />

            <h2 className="text-lg font-bold text-slate-900">
              Search your journey
            </h2>
          </div>

          <form onSubmit={handleSearch}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Pickup location */}
              <PlaceSearchInput
                label="Pickup location"
                value={filters.source}
                onChange={(value) =>
                  setFilters((previous) => ({
                    ...previous,
                    source: value,
                  }))
                }
                placeholder="e.g. KIET Ghaziabad"
              />

              {/* Destination */}
              <PlaceSearchInput
                label="Destination"
                value={filters.destination}
                onChange={(value) =>
                  setFilters((previous) => ({
                    ...previous,
                    destination: value,
                  }))
                }
                placeholder="e.g. New Delhi"
              />

              {/* Departure date */}
              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Departure date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Cab provider */}
              <div>
                <label
                  htmlFor="provider"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Cab provider
                </label>

                <select
                  id="provider"
                  name="provider"
                  value={filters.provider}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All providers</option>
                  <option value="Uber">Uber</option>
                  <option value="Rapido">Rapido</option>
                  <option value="Ola">Ola</option>
                  <option value="Other">Other</option>
                </select>
              </div>

            </div>

            {/* Search and Reset buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <Search size={17} />
                Search Cabs
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={16} />
                Reset
              </button>
            </div>
          </form>

          {/* OpenStreetMap attribution */}
          <p className="mt-4 text-xs text-slate-400">
            Location data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 underline"
            >
              OpenStreetMap contributors
            </a>
          </p>
        </div>

        {/* Results heading */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Available journeys
            </h2>

            {!loading && (
              <p className="mt-1 text-sm text-slate-500">
                {cabShares.length}{" "}
                {cabShares.length === 1 ? "journey" : "journeys"} found
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <LoaderCircle
              size={35}
              className="animate-spin text-emerald-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Finding available shared cabs...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && cabShares.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <CarFront size={32} />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              No shared cabs found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              We couldn't find a journey matching your search.
              Try different locations or dates, or post your own journey.
            </p>

            <Link
              to="/cab-shares/create"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Post a Shared Cab
              <ArrowRight size={17} />
            </Link>
          </div>
        )}

        {/* Cab cards */}
        {!loading && cabShares.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">

            {cabShares.map((cab) => (
              <article
                key={cab._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="p-5 sm:p-6">

                  {/* Provider and status */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                        <CarFront size={23} />
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          {cab.provider}
                        </p>

                        <p className="text-xs text-slate-500">
                          Posted by {getCreatorName(cab.createdBy)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        cab.bookingStatus === "booked"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {cab.bookingStatus === "booked"
                        ? "Already booked"
                        : "Planning to book"}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="mb-5 rounded-xl bg-slate-50 p-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <span className="h-3 w-3 rounded-full border-[3px] border-emerald-500 bg-white" />

                        <span className="my-1 h-9 border-l-2 border-dashed border-slate-300" />

                        <span className="h-3 w-3 rounded-full bg-red-500" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-5">
                          <p className="text-xs text-slate-500">
                            Pickup
                          </p>

                          <p className="break-words font-semibold text-slate-900">
                            {cab.source}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Destination
                          </p>

                          <p className="break-words font-semibold text-slate-900">
                            {cab.destination}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Journey information */}
                  <div className="grid grid-cols-2 gap-4">

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays
                        size={17}
                        className="shrink-0 text-emerald-600"
                      />

                      {formatDate(cab.departureDate)}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock
                        size={17}
                        className="shrink-0 text-emerald-600"
                      />

                      {cab.departureTime}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users
                        size={17}
                        className="shrink-0 text-emerald-600"
                      />

                      {cab.availableSeats} seats available
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <IndianRupee
                        size={17}
                        className="shrink-0 text-emerald-600"
                      />

                      {cab.estimatedFare != null
                        ? `₹${cab.estimatedFare} estimated total`
                        : "Fare not specified"}
                    </div>

                  </div>

                  {/* Description */}
                  {cab.description && (
                    <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                      {cab.description}
                    </p>
                  )}

                  {/* Join request */}
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() => handleJoinRequest(cab._id)}
                      disabled={
                        requestingId === cab._id ||
                        cab.availableSeats <= 0
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestingId === cab._id ? (
                        <>
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />

                          Sending request...
                        </>
                      ) : (
                        <>
                          <Users size={17} />
                          Request to Join
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Your request must be approved by the person who posted this journey.
                  </p>

                </div>
              </article>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default FindCabShares;
