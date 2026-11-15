
import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: String,
      required: [true, "Source is required"],
      trim: true,
      maxlength: 100,
    },

    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: 100,
    },

    departureDate: {
      type: Date,
      required: [true, "Departure date is required"],
    },

    departureTime: {
      type: String,
      required: [true, "Departure time is required"],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Use 24-hour time format (HH:MM)",
      ],
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    costPerSeat: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "full", "cancelled", "completed"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Helpful indexes for finding rides
rideSchema.index({ source: 1, destination: 1, departureDate: 1 });
rideSchema.index({ createdBy: 1 });

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
