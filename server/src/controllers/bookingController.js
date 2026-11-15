
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";

// ==========================================
// 1. PASSENGER REQUESTS SEATS IN A RIDE
// ==========================================

export const createBooking = async (req, res) => {
  try {
    const { rideId, seats, message } = req.body;

    if (!mongoose.isValidObjectId(rideId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
      return res.status(400).json({
        success: false,
        message: "Seats must be a whole number between 1 and 8",
      });
    }

    if (message !== undefined && typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message must be text",
      });
    }

    if (message && message.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 300 characters",
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const rideCreatorId = ride.createdBy.toString();
    const passengerId = req.user.userId.toString();

    if (rideCreatorId === passengerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own ride",
      });
    }

    if (ride.status !== "open" || ride.availableSeats < seats) {
      return res.status(400).json({
        success: false,
        message: "Not enough available seats for this request",
      });
    }

    const existingBooking = await Booking.findOne({
      ride: rideId,
      user: req.user.userId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "You already have an active booking for this ride",
      });
    }

    const booking = await Booking.create({
      ride: rideId,
      user: req.user.userId,
      seats,
      message: message?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Ride booking request submitted successfully",
      booking,
    });
  } catch (error) {
    // Handles duplicate active requests if two requests arrive together.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already have an active booking for this ride",
      });
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking request",
    });
  }
};

// ==========================================
// 2. RIDE CREATOR VIEWS BOOKING REQUESTS
// ==========================================

export const getRideBookings = async (req, res) => {
  try {
    const { rideId } = req.params;

    if (!mongoose.isValidObjectId(rideId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const rideCreatorId = ride.createdBy.toString();
    const loggedInUserId = req.user.userId.toString();

    if (rideCreatorId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "Only the ride creator can view these requests",
      });
    }

    const bookings = await Booking.find({ ride: rideId })
      .populate("user", "name email community")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get ride bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch booking requests",
    });
  }
};

// ==========================================
// 3. RIDE CREATOR APPROVES OR REJECTS BOOKING
// ==========================================

export const updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(bookingId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID",
    });
  }

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be approved or rejected",
    });
  }

  const session = await mongoose.startSession();

  try {
    let updatedBooking;

    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      const ride = await Ride.findById(booking.ride).session(session);

      if (!ride) {
        throw new Error("RIDE_NOT_FOUND");
      }

      // Verify that the logged-in user created this ride.
      const rideCreatorId = ride.createdBy.toString();
      const loggedInUserId = req.user.userId.toString();

      if (rideCreatorId !== loggedInUserId) {
        throw new Error("NOT_RIDE_CREATOR");
      }

      if (booking.status !== "pending") {
        throw new Error("BOOKING_ALREADY_PROCESSED");
      }

      if (status === "approved") {
        // Atomically reserve seats only if enough remain.
        const updatedRide = await Ride.findOneAndUpdate(
          {
            _id: booking.ride,
            status: "open",
            availableSeats: { $gte: booking.seats },
          },
          {
            $inc: { availableSeats: -booking.seats },
          },
          {
            returnDocument: "after",
            session,
            runValidators: true,
          }
        );

        if (!updatedRide) {
          throw new Error("NOT_ENOUGH_SEATS");
        }

        // Mark ride full if the last available seat was taken.
        if (updatedRide.availableSeats === 0) {
          updatedRide.status = "full";
          await updatedRide.save({ session });
        }
      }

      booking.status = status;
      await booking.save({ session });

      updatedBooking = booking;
    });

    return res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: updatedBooking,
    });
  } catch (error) {
    const errors = {
      BOOKING_NOT_FOUND: [404, "Booking not found"],
      RIDE_NOT_FOUND: [404, "Ride not found"],
      NOT_RIDE_CREATOR: [
        403,
        "Only the ride creator can manage this booking",
      ],
      BOOKING_ALREADY_PROCESSED: [
        400,
        "This booking has already been processed",
      ],
      NOT_ENOUGH_SEATS: [
        400,
        "Not enough seats are available to approve this booking",
      ],
    };

    const knownError = errors[error.message];

    if (knownError) {
      return res.status(knownError[0]).json({
        success: false,
        message: knownError[1],
      });
    }

    console.error("Update booking status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update booking status",
    });
  } finally {
    await session.endSession();
  }
};

// ==========================================
// 4. PASSENGER CANCELS THEIR OWN BOOKING
// ==========================================

export const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  if (!mongoose.isValidObjectId(bookingId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID",
    });
  }

  const session = await mongoose.startSession();

  try {
    let cancelledBooking;

    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      // Only the passenger who created the booking can cancel it.
      const bookingPassengerId = booking.user.toString();
      const loggedInUserId = req.user.userId.toString();

      if (bookingPassengerId !== loggedInUserId) {
        throw new Error("NOT_BOOKING_OWNER");
      }

      if (!["pending", "approved"].includes(booking.status)) {
        throw new Error("BOOKING_NOT_CANCELLABLE");
      }

      const ride = await Ride.findById(booking.ride).session(session);

      if (!ride) {
        throw new Error("RIDE_NOT_FOUND");
      }

      // Approved bookings have already reserved seats.
      // Pending bookings have not reserved seats.
      if (booking.status === "approved") {
        // Restore seats only if the ride is still active.
        if (["open", "full"].includes(ride.status)) {
          const updatedRide = await Ride.findOneAndUpdate(
            {
              _id: ride._id,
              status: { $in: ["open", "full"] },
              availableSeats: {
                $lte: ride.totalSeats - booking.seats,
              },
            },
            {
              $inc: {
                availableSeats: booking.seats,
              },
              $set: {
                status: "open",
              },
            },
            {
              returnDocument: "after",
              session,
              runValidators: true,
            }
          );

          if (!updatedRide) {
            throw new Error("SEAT_RESTORATION_FAILED");
          }
        }
      }

      // Mark the booking as cancelled.
      booking.status = "cancelled";
      await booking.save({ session });

      cancelledBooking = booking;
    });

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: cancelledBooking,
    });
  } catch (error) {
    const errors = {
      BOOKING_NOT_FOUND: [
        404,
        "Booking not found",
      ],
      NOT_BOOKING_OWNER: [
        403,
        "You can only cancel your own bookings",
      ],
      BOOKING_NOT_CANCELLABLE: [
        400,
        "Only pending or approved bookings can be cancelled",
      ],
      RIDE_NOT_FOUND: [
        404,
        "Associated ride not found",
      ],
      SEAT_RESTORATION_FAILED: [
        400,
        "Unable to restore seats. Please try again",
      ],
    };

    const knownError = errors[error.message];

    if (knownError) {
      return res.status(knownError[0]).json({
        success: false,
        message: knownError[1],
      });
    }

    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel booking",
    });
  } finally {
    await session.endSession();
  }
};

// ==========================================
// 5. PASSENGER VIEWS THEIR OWN BOOKING HISTORY
// ==========================================

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.userId,
    })
      .populate({
        path: "ride",
        select:
          "source destination departureDate departureTime costPerSeat status createdBy",
        populate: {
          path: "createdBy",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your bookings",
    });
  }
};
