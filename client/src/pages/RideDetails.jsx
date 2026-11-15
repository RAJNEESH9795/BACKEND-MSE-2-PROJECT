
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  IndianRupee,
  UserRound,
  CarFront,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import { createBooking } from "../services/bookingService";
import { useAuth } from "../context/AuthContext";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

// ==========================================
// RIDE DETAILS COMPONENT
// ==========================================

function RideDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const currentUserId = user?._id || user?.id;

  const [ride, setRide] = useState(null);

  const [seats, setSeats] = useState("1");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH RIDE DETAILS
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const fetchRide = async () => {
      try {
        setLoading(true);
        setError("");
        setRide(null);
        setSuccess("");

        const response = await api.get(`/rides/${id}`);

        if (isMounted) {
          setRide(response.data.ride);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load ride details. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRide();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ==========================================
  // RIDE OWNERSHIP
  // ==========================================

  const creatorId =
    typeof ride?.createdBy === "object"
      ? ride?.createdBy?._id
      : ride?.createdBy;

  const isOwner =
    currentUserId &&
    creatorId &&
    String(currentUserId) === String(creatorId);

  // ==========================================
  // BOOKING VALIDATION
  // ==========================================

  const maxSeats = Math.min(
    8,
    Number(ride?.availableSeats || 0)
  );

  const selectedSeats = Number(seats);

  const validSeats =
    Number.isInteger(selectedSeats) &&
    selectedSeats >= 1 &&
    selectedSeats <= maxSeats;

  const totalCost = validSeats
    ? selectedSeats * Number(ride?.costPerSeat || 0)
    : 0;

  const canBook =
    ride?.status === "open" &&
    Number(ride?.availableSeats) > 0 &&
    !isOwner;

  // ==========================================
  // HANDLE SEAT SELECTION
  // ==========================================

  const handleSeatsChange = (e) => {
    setSeats(e.target.value);
    setError("");
  };

  // ==========================================
  // HANDLE MESSAGE CHANGE
  // ==========================================

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setError("");
  };

  // ==========================================
  // CREATE BOOKING
  // ==========================================

  const handleBooking = async (e) => {
    e.preventDefault();

    setError("");

    if (!validSeats) {
      setError(
        `Please select between 1 and ${maxSeats} available seats.`
      );
      return;
    }

    if (message.length > 300) {
      setError("Your message cannot exceed 300 characters.");
      return;
    }

    try {
      setBookingLoading(true);

      const response = await createBooking({
        rideId: id,
        seats: selectedSeats,
        message: message.trim(),
      });

      setSuccess(
        response?.message ||
          "Your booking request has been sent successfully to the ride owner."
      );

      setSeats("1");
      setMessage("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit booking request. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <LoaderCircle
          size={40}
          className="animate-spin text-emerald-600"
        />

        <p className="mt-4 font-semibold text-slate-700">
          Loading ride details...
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Please wait a moment.
        </p>
      </div>
    );
  }

  // ==========================================
  // RIDE NOT FOUND
  // ==========================================

  if (!ride) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <AlertCircle size={32} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          Unable to find this ride
        </h2>

        <p className="mt-2 max-w-md text-sm text-slate-500">
          {error ||
            "This ride may have been removed or is no longer available."}
        </p>

        <Link
          to="/rides"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
          Back to Ride Finder
        </Link>
      </div>
    );
  }

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
          Back to Ride Finder
        </Link>

        {/* PAGE HEADING */}

        <div className="mb-8 mt-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <CarFront size={15} />
            COMMUNITY RIDE
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Ride Details
          </h1>

          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Review your journey details and request a seat.
          </p>
        </div>

        {/* MAIN CONTENT */}

        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">

          {/* RIDE INFORMATION */}

          <section className="space-y-6">

            {/* ROUTE CARD */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Journey Overview
                </h2>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    ride.status === "open"
                      ? "bg-emerald-100 text-emerald-700"
                      : ride.status === "full"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {ride.status === "open"
                    ? "Open"
                    : ride.status === "full"
                    ? "Full"
                    : ride.status}
                </span>
              </div>

              <div className="mt-8 space-y-7">

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <MapPin size={24} />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Starting point
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {ride.source}
                    </h3>
                  </div>
                </div>

                <div className="ml-6 h-8 border-l-2 border-dashed border-slate-300" />

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <MapPin size={24} />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Destination
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {ride.destination}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={21}
                      className="mt-0.5 text-emerald-600"
                    />

                    <div>
                      <p className="text-xs text-slate-400">
                        Departure date
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(ride.departureDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock
                      size={21}
                      className="mt-0.5 text-emerald-600"
                    />

                    <div>
                      <p className="text-xs text-slate-400">
                        Departure time
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatTime(ride.departureTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users
                      size={21}
                      className="mt-0.5 text-emerald-600"
                    />

                    <div>
                      <p className="text-xs text-slate-400">
                        Available seats
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {ride.availableSeats} of {ride.totalSeats}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IndianRupee
                      size={21}
                      className="mt-0.5 text-emerald-600"
                    />

                    <div>
                      <p className="text-xs text-slate-400">
                        Cost per seat
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        ₹{Number(ride.costPerSeat).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* RIDE OWNER */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <UserRound size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Ride Owner
                  </h2>

                  <p className="text-sm text-slate-500">
                    Journey offered by
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserRound size={27} />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    {ride.createdBy?.name || "Community member"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    MoveMate community
                  </p>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <MessageSquare size={21} />
                </div>

                <h2 className="font-bold text-slate-900">
                  About This Ride
                </h2>
              </div>

              <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {ride.description ||
                  "The ride owner has not provided any additional details."}
              </p>
            </div>
          </section>

          {/* BOOKING PANEL */}

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Request a Booking
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Choose your seats and send a request to the ride owner.
                </p>
              </div>

              {/* OWNER VIEW */}

              {isOwner ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <ShieldCheck
                    size={27}
                    className="text-blue-700"
                  />

                  <h3 className="mt-3 font-bold text-blue-900">
                    This is your ride
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-blue-800">
                    You cannot book your own ride. You can manage incoming passenger requests instead.
                  </p>

                  <Link
                    to={`/manage-bookings/${ride._id}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Manage Bookings
                    <ArrowRight size={17} />
                  </Link>
                </div>

              ) : success ? (

                /* ==================================
                   BOOKING SUCCESS CONFIRMATION
                ================================== */

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2
                      size={32}
                      className="text-emerald-600"
                    />
                  </div>

                  <h3 className="mt-4 text-xl font-extrabold text-emerald-900">
                    Request Submitted!
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                    Your booking request has been sent successfully to the ride owner.
                  </p>

                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2">
                      <Clock
                        size={19}
                        className="text-amber-700"
                      />

                      <span className="text-sm font-bold text-amber-900">
                        Pending Approval
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-amber-800">
                      Your request is waiting for the ride owner to approve or reject it.
                    </p>
                  </div>

                  <div className="mt-5">
                    <Link
                      to="/my-bookings"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      View My Bookings
                      <ArrowRight size={18} />
                    </Link>
                  </div>

                  <p className="mt-4 text-center text-xs text-emerald-700">
                    Thank you for choosing MoveMate!
                  </p>
                </div>

              ) : ride.status !== "open" || ride.availableSeats < 1 ? (

                /* RIDE UNAVAILABLE */

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <AlertCircle
                    size={27}
                    className="text-amber-700"
                  />

                  <h3 className="mt-3 font-bold text-amber-900">
                    Bookings unavailable
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-amber-800">
                    {ride.status === "full" || ride.availableSeats < 1
                      ? "This ride is currently full and is not accepting additional booking requests."
                      : "This ride is not currently accepting bookings."}
                  </p>
                </div>

              ) : (

                /* ==================================
                   BOOKING FORM
                ================================== */

                <form
                  onSubmit={handleBooking}
                  className="space-y-5"
                >

                  {/* LOCAL BOOKING ERROR */}

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <p>{error}</p>
                    </div>
                  )}

                  {/* SEAT SELECTION */}

                  <div>
                    <label
                      htmlFor="seats"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Number of seats
                    </label>

                    <input
                      id="seats"
                      type="number"
                      min="1"
                      max={maxSeats}
                      step="1"
                      value={seats}
                      onChange={handleSeatsChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Maximum {maxSeats} seat{maxSeats === 1 ? "" : "s"} available.
                    </p>
                  </div>

                  {/* MESSAGE */}

                  <div>
                    <label
                      htmlFor="bookingMessage"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Message to ride owner
                      <span className="ml-1 font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      id="bookingMessage"
                      value={message}
                      onChange={handleMessageChange}
                      maxLength={300}
                      rows={4}
                      placeholder="Introduce yourself or share any travel requirements..."
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {message.length}/300
                    </p>
                  </div>

                  {/* COST SUMMARY */}

                  <div className="rounded-xl bg-slate-50 p-4">
                    <h3 className="mb-4 text-sm font-bold text-slate-800">
                      Booking Summary
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-3 text-slate-600">
                        <span>Price per seat</span>

                        <span>
                          ₹{Number(ride.costPerSeat).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-slate-600">
                        <span>Number of seats</span>

                        <span>{validSeats ? selectedSeats : "—"}</span>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-slate-900">
                            Estimated total
                          </span>

                          <span className="text-xl font-extrabold text-emerald-700">
                            ₹{totalCost.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}

                  <button
                    type="submit"
                    disabled={
                      bookingLoading ||
                      !validSeats ||
                      !canBook
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <>
                        <LoaderCircle
                          size={19}
                          className="animate-spin"
                        />
                        Submitting request...
                      </>
                    ) : (
                      <>
                        Request Booking
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-relaxed text-slate-400">
                    Your booking will be submitted as a request.
                    The ride owner must approve it.
                  </p>
                </form>
              )}
            </div>

            {/* BOOKING GUIDANCE */}

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Community booking
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Booking requests remain pending until the ride owner approves or rejects them. Check your booking history for updates.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default RideDetails;
