
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import api from "../services/api";

function EditRide() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    source: "",
    destination: "",
    departureDate: "",
    departureTime: "",
    totalSeats: 1,
    costPerSeat: 0,
    description: "",
  });

  const [occupiedSeats, setOccupiedSeats] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const response = await api.get(`/rides/${id}`);
        const ride = response.data.ride;

        if (ride.status !== "open") {
          setError("Only open rides can be edited.");
          return;
        }

        const occupied = ride.totalSeats - ride.availableSeats;
        setOccupiedSeats(occupied);

        setFormData({
          source: ride.source || "",
          destination: ride.destination || "",
          departureDate: ride.departureDate
            ? new Date(ride.departureDate).toISOString().slice(0, 10)
            : "",
          departureTime: ride.departureTime || "",
          totalSeats: ride.totalSeats,
          costPerSeat: ride.costPerSeat,
          description: ride.description || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load ride details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [id]);

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

    const totalSeats = Number(formData.totalSeats);
    const costPerSeat = Number(formData.costPerSeat);

    if (!formData.source.trim() || !formData.destination.trim()) {
      setError("Please enter both source and destination.");
      return;
    }

    if (formData.source.trim().toLowerCase() ===
        formData.destination.trim().toLowerCase()) {
      setError("Source and destination cannot be the same.");
      return;
    }

    if (!formData.departureDate || !formData.departureTime) {
      setError("Please select a departure date and time.");
      return;
    }

    if (!Number.isInteger(totalSeats) ||
        totalSeats < Math.max(1, occupiedSeats) ||
        totalSeats > 8) {
      setError(
        `Total seats must be between ${Math.max(1, occupiedSeats)} and 8.`
      );
      return;
    }

    if (!Number.isFinite(costPerSeat) || costPerSeat < 0) {
      setError("Cost per seat must be zero or greater.");
      return;
    }

    const payload = {
      ...formData,
      source: formData.source.trim(),
      destination: formData.destination.trim(),
      totalSeats,
      costPerSeat,
      description: formData.description.trim(),
    };

    try {
      setSaving(true);
      await api.patch(`/rides/${id}`, payload);
      setSuccess("Ride updated successfully!");

      setTimeout(() => {
        navigate("/my-rides");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update ride.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2">
        <Loader2 className="animate-spin" />
        <span>Loading ride details...</span>
      </div>
    );
  }

  if (error && !formData.source) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        <Link
          to="/my-rides"
          className="mt-4 inline-flex items-center gap-2 text-blue-600"
        >
          <ArrowLeft size={18} /> Back to My Rides
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/my-rides"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} /> Back to My Rides
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit Ride</h1>
          <p className="mt-2 text-sm text-slate-500">
            Update your ride details. Existing approved bookings will be
            preserved.
          </p>

          <div className="mt-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            {occupiedSeats} seat(s) are already occupied. You cannot reduce
            total seats below this number.
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Source
                </label>
                <input
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Destination
                </label>
                <input
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Departure Date
                </label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Departure Time
                </label>
                <input
                  type="time"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Total Seats
                </label>
                <input
                  type="number"
                  name="totalSeats"
                  min={Math.max(1, occupiedSeats)}
                  max={8}
                  value={formData.totalSeats}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cost Per Seat (₹)
                </label>
                <input
                  type="number"
                  name="costPerSeat"
                  min="0"
                  step="0.01"
                  value={formData.costPerSeat}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={500}
                rows={4}
                placeholder="Add any additional details about your ride..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                to="/my-rides"
                className="rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditRide;
