
import mongoose from "mongoose";

const exchangeRequestSchema = new mongoose.Schema(
  {
    // Student requesting the service.
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Student providing the requested service.
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Service the requester wants.
    requestedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceListing",
      required: true,
    },

    // Service the requester offers in return.
    offeredListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceListing",
      required: true,
    },

    // Optional message from requester.
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Exchange status.
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
      ],
      default: "pending",
      index: true,
    },

    // Completion confirmation from both students.
    requesterCompleted: {
      type: Boolean,
      default: false,
    },

    providerCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Find requests received by a service provider.
exchangeRequestSchema.index({
  provider: 1,
  status: 1,
  createdAt: -1,
});

// Find requests sent by a student.
exchangeRequestSchema.index({
  requester: 1,
  status: 1,
  createdAt: -1,
});

// Find requests associated with a service listing.
exchangeRequestSchema.index({
  requestedListing: 1,
  status: 1,
});

const ExchangeRequest = mongoose.model(
  "ExchangeRequest",
  exchangeRequestSchema
);

export default ExchangeRequest;
