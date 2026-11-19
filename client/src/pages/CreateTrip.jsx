
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  IndianRupee,
  MapPin,
  Send,
  Loader2,
} from "lucide-react";

import LocationAutocomplete from "../components/LocationAutocomplete";
import { createTrip } from "../services/tripService";

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CreateTrip() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    source: "",
    destination: "",
    departureDate: "",
    departureTime: "",
    maxParticipants: 4,
    estimatedCostPerPerson: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validate required fields
    if (
      !formData.title.trim() ||
      !formData.source.trim() ||
      !formData.destination.trim() ||
      !formData.departureDate ||
      !formData.departureTime
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate source and destination
    if (
      formData.source.trim().toLowerCase() ===
      formData.destination.trim().toLowerCase()
    ) {
      setError("Starting location and destination cannot be the same.");
      return;
    }

    // Validate departure date
    const selectedDate = new Date(
      `${formData.departureDate}T${formData.departureTime}:00`
    );

    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      setError("Please select a future departure date and time.");
      return;
    }

    // Validate participants
    const participants = Number(formData.maxParticipants);

    if (
      !Number.isInteger(participants) ||
      participants < 2 ||
      participants > 50
    ) {
      setError("Maximum participants must be between 2 and 50.");
      return;
    }

    // Validate estimated cost
    const cost =
      formData.estimatedCostPerPerson === ""
        ? null
        : Number(formData.estimatedCostPerPerson);

    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      setError("Please enter a valid estimated cost.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      source: formData.source.trim(),
      destination: formData.destination.trim(),
      departureDate: formData.departureDate,
      departureTime: formData.departureTime,
      maxParticipants: participants,
      estimatedCostPerPerson: cost,
      description: formData.description.trim(),
    };

    try {
      setLoading(true);

      const response = await createTrip(payload);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to create trip.");
      }

      setSuccess("Your trip has been organized successfully!");

      navigate("/my-trips", {
        state: {
          message: "Your trip has been created successfully!",
        },
      });
    } catch (err) {
      console.error("Create trip error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong while creating your trip."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Back navigation */}
        <Link
          to="/trips"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-600"
        >
          <ArrowLeft size={18} />
          Back to Discover Trips
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
            <MapPin size={17} />
            Community Travel
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Organize a Trip
          </h1>

          <p className="mt-2 text-slate-600">
            Share your travel plans and find people heading in the same direction.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Trip title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Trip Title <span className="text-red-500">*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: Delhi to Agra Weekend Trip"
                maxLength={100}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Starting location */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Starting Location <span className="text-red-500">*</span>
              </label>

              <LocationAutocomplete
                value={formData.source}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    source: value,
                  }))
                }
                placeholder="Search starting location..."
                required
              />
            </div>

            {/* Destination */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Destination <span className="text-red-500">*</span>
              </label>

              <LocationAutocomplete
                value={formData.destination}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    destination: value,
                  }))
                }
                placeholder="Search destination..."
                required
              />
            </div>

            {/* Departure date and time */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="departureDate"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <CalendarDays size={17} />
                  Departure Date <span className="text-red-500">*</span>
                </label>

                <input
                  id="departureDate"
                  name="departureDate"
                  type="date"
                  min={getTomorrowDate()}
                  value={formData.departureDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="departureTime"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <Clock size={17} />
                  Departure Time <span className="text-red-500">*</span>
                </label>

                <input
                  id="departureTime"
                  name="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

            </div>

            {/* Maximum participants */}
            <div>
              <label
                htmlFor="maxParticipants"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <Users size={17} />
                Maximum Participants
              </label>

              <input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min="2"
                max="50"
                value={formData.maxParticipants}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Includes you as the trip organizer. Choose between 2 and 50 participants.
              </p>
            </div>

            {/* Estimated cost */}
            <div>
              <label
                htmlFor="estimatedCostPerPerson"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <IndianRupee size={17} />
                Estimated Cost Per Person (Optional)
              </label>

              <input
                id="estimatedCostPerPerson"
                name="estimatedCostPerPerson"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedCostPerPerson}
                onChange={handleChange}
                placeholder="Enter estimated amount in INR"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Trip Description (Optional)
              </label>

              <textarea
                id="description"
                name="description"
                rows="4"
                maxLength={1000}
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell other travelers about your plans, travel preferences, meeting point, and other details..."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Information */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm leading-relaxed text-emerald-800">
                <strong>Remember:</strong> You are organizing a shared trip.
                Other community members can send requests to join. You can
                review and approve or reject those requests from My Trips.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Trip...
                </>
              ) : (
                <>
                  <Send size={19} />
                  Organize Trip
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer navigation */}
        <div className="mt-6 text-center">
          <Link
            to="/my-trips"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View My Trips →
          </Link>
        </div>

      </div>
    </div>
  );
}

export default CreateTrip;
