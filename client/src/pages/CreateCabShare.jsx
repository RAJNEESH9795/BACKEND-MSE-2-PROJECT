
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MapPin,
  CalendarDays,
  Clock,
  CarFront,
  Loader2,
  Search,
  CheckCircle,
  IndianRupee,
} from "lucide-react";

import { createCabShare } from "../services/cabShareService";

// OpenStreetMap Nominatim API
const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

// Minimum interval between requests in this browser tab
let lastSearchTime = 0;

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function searchPlaces(query) {
  const elapsed = Date.now() - lastSearchTime;
  const delay = Math.max(0, 1100 - elapsed);

  if (delay > 0) {
    await wait(delay);
  }

  lastSearchTime = Date.now();

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
    throw new Error(
      response.status === 429
        ? "Too many searches. Please wait before trying again."
        : "Unable to search places. Please try again."
    );
  }

  return response.json();
}

// Reusable location search component
function PlaceSearchInput({
  label,
  value,
  onChange,
  placeholder,
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const searchTerm = query.trim();

    if (searchTerm.length < 3) {
      setError("Please enter at least 3 characters.");
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResults([]);
      setHasSearched(true);

      const places = await searchPlaces(searchTerm);

      setResults(Array.isArray(places) ? places : []);

      if (!places || places.length === 0) {
        setError(
          "No matching places found. Try a different search."
        );
      }
    } catch (err) {
      setError(
        err.message || "Unable to find places."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const newValue = event.target.value;

    setQuery(newValue);
    onChange(newValue);

    setResults([]);
    setError("");
    setHasSearched(false);
  };

  const handleSelect = (place) => {
    const selectedPlace = place.display_name;

    setQuery(selectedPlace);
    onChange(selectedPlace);

    setResults([]);
    setError("");
    setHasSearched(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
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

      {/* Location input and search button */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <MapPin
          size={20}
          className="shrink-0 text-slate-400"
        />

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          required
          className="min-w-0 flex-1 py-4 text-base text-slate-800 outline-none"
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || query.trim().length < 3}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Search size={17} />
          )}

          <span className="hidden sm:inline">
            Search
          </span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <Loader2
            size={15}
            className="animate-spin"
          />
          Searching places...
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Location suggestions */}
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
                size={18}
                className="mt-1 shrink-0 text-emerald-600"
              />

              <span className="text-sm leading-5 text-slate-700">
                {place.display_name}
              </span>
            </button>
          ))}

          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            © OpenStreetMap contributors
          </div>
        </div>
      )}

      {hasSearched &&
        results.length === 0 &&
        !loading &&
        !error && (
          <p className="mt-2 text-sm text-slate-500">
            No locations found.
          </p>
        )}
    </div>
  );
}

// Main Create Cab Share page
function CreateCabShare() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    source: "",
    destination: "",
    departureDate: "",
    departureTime: "",
    provider: "Uber",
    bookingStatus: "planning",
    totalSeatsToShare: "1",
    estimatedFare: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle normal form fields
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Handle pickup and destination
  const handleLocationChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Minimum selectable date: tomorrow
  const getTomorrowDate = () => {
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(
      tomorrow.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      tomorrow.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Submit cab share
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.source.trim() ||
      !form.destination.trim()
    ) {
      setError(
        "Please select both pickup and destination locations."
      );
      return;
    }

    if (
      form.source.trim().toLowerCase() ===
      form.destination.trim().toLowerCase()
    ) {
      setError(
        "Pickup and destination cannot be the same."
      );
      return;
    }

    if (
      !form.departureDate ||
      !form.departureTime
    ) {
      setError(
        "Please select departure date and time."
      );
      return;
    }

    const departure = new Date(
      `${form.departureDate}T${form.departureTime}`
    );

    if (
      Number.isNaN(departure.getTime()) ||
      departure <= new Date()
    ) {
      setError(
        "Departure date and time must be in the future."
      );
      return;
    }

    const seats = Number(form.totalSeatsToShare);

    if (
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > 7
    ) {
      setError(
        "Number of seats must be between 1 and 7."
      );
      return;
    }

    const fare =
      form.estimatedFare === ""
        ? null
        : Number(form.estimatedFare);

    if (
      fare !== null &&
      (!Number.isFinite(fare) || fare < 0)
    ) {
      setError(
        "Please enter a valid estimated fare."
      );
      return;
    }

    const payload = {
      ...form,
      source: form.source.trim(),
      destination: form.destination.trim(),
      totalSeatsToShare: seats,
      estimatedFare: fare,
    };

    try {
      setLoading(true);

      await createCabShare(payload);

      setSuccess(
        "Your cab share has been created successfully!"
      );

      setTimeout(() => {
        navigate("/my-cab-shares");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create cab share. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Page heading */}
        <div className="mb-7">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Share a Cab
          </h1>

          <p className="mt-2 text-slate-600">
            Share your cab journey with other students and split travel costs.
          </p>
        </div>

        {/* Main form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {/* Journey details */}
          <section>
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              Journey details
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">

              <PlaceSearchInput
                label="Pickup location"
                value={form.source}
                placeholder="Enter pickup location"
                onChange={(value) =>
                  handleLocationChange("source", value)
                }
              />

              <PlaceSearchInput
                label="Destination"
                value={form.destination}
                placeholder="Enter destination"
                onChange={(value) =>
                  handleLocationChange("destination", value)
                }
              />

            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Departure schedule */}
          <section>
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              Departure schedule
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Departure date
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-emerald-500">
                  <CalendarDays
                    size={20}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    type="date"
                    name="departureDate"
                    value={form.departureDate}
                    min={getTomorrowDate()}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent py-4 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Departure time
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-emerald-500">
                  <Clock
                    size={20}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    type="time"
                    name="departureTime"
                    value={form.departureTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent py-4 text-slate-800 outline-none"
                  />
                </div>
              </div>

            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Cab information */}
          <section>
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              Cab information
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cab provider
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4">
                  <CarFront
                    size={20}
                    className="text-slate-400"
                  />

                  <select
                    name="provider"
                    value={form.provider}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent py-4 text-slate-800 outline-none"
                  >
                    <option value="Uber">Uber</option>
                    <option value="Rapido">Rapido</option>
                    <option value="Ola">Ola</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking status
                </label>

                <select
                  name="bookingStatus"
                  value={form.bookingStatus}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none focus:border-emerald-500"
                >
                  <option value="planning">
                    Planning - Looking for passengers
                  </option>

                  <option value="booked">
                    Booked - Cab already booked
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Number of seats to share
                </label>

                <select
                  name="totalSeatsToShare"
                  value={form.totalSeatsToShare}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none focus:border-emerald-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(
                    (seat) => (
                      <option key={seat} value={seat}>
                        {seat} {seat === 1 ? "Seat" : "Seats"}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Estimated total cab fare (₹)
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-emerald-500">
                  <IndianRupee
                    size={20}
                    className="text-slate-400"
                  />

                  <input
                    type="number"
                    name="estimatedFare"
                    value={form.estimatedFare}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 600"
                    className="w-full py-4 text-slate-800 outline-none"
                  />
                </div>
              </div>

            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Additional information */}
          <section>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Additional information (optional)
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              placeholder="Add details about luggage, meeting point, or other travel information..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {form.description.length}/500 characters
            </p>
          </section>

          {/* OpenStreetMap attribution */}
          <p className="text-xs text-slate-500">
            Location data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-700 underline"
            >
              OpenStreetMap contributors
            </a>
          </p>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle size={19} />
              {success}
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Creating Cab Share...
                </>
              ) : (
                "Create Cab Share"
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/cab-shares")}
              className="rounded-xl border border-slate-300 px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCabShare;
