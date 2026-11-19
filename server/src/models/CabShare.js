
import mongoose from "mongoose";

const cabShareRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const cabShareSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: String,
      required: [true, "Pickup location is required"],
      trim: true,
      maxlength: 150,
    },

    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: 150,
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

    provider: {
      type: String,
      enum: ["Uber", "Rapido", "Ola", "Other"],
      required: true,
    },

    bookingStatus: {
      type: String,
      enum: ["booked", "planning"],
      required: true,
    },

    totalSeatsToShare: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedFare: {
      type: Number,
      min: 0,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    requests: {
      type: [cabShareRequestSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["open", "full", "cancelled", "completed"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Search and filtering indexes.
cabShareSchema.index({
  source: 1,
  destination: 1,
  departureDate: 1,
});

cabShareSchema.index({ createdBy: 1 });

cabShareSchema.index({
  status: 1,
  bookingStatus: 1,
});

cabShareSchema.index({
  "requests.user": 1,
  "requests.status": 1,
});

const CabShare = mongoose.model("CabShare", cabShareSchema);

export default CabShare;
