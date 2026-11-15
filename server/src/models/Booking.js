
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seats: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    message: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active requests by the same user for the same ride.
bookingSchema.index(
  { ride: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "approved"] },
    },
  }
);

// Helpful indexes for retrieving bookings
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ ride: 1, status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
