
import mongoose from "mongoose";

const tripRequestSchema = new mongoose.Schema(
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

const tripSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
      max: 50,
    },
    availableSlots: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedCostPerPerson: {
      type: Number,
      min: 0,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    requests: {
      type: [tripRequestSchema],
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

tripSchema.index({
  status: 1,
  departureDate: 1,
  source: 1,
  destination: 1,
});

tripSchema.index({
  "requests.user": 1,
  "requests.status": 1,
});

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
