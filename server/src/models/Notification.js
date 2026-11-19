
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      required: true,
      enum: [
        // Exchange notifications
        "exchange_request",
        "exchange_accepted",
        "exchange_rejected",
        "exchange_cancelled",
        "exchange_completion_pending",
        "exchange_completed",

        // Cab Share notifications
        "cab_share_request",
        "cab_share_accepted",
        "cab_share_rejected",
        "cab_share_withdrawn",
        "cab_share_cancelled",
        "cab_share_completed",

        // Plan a Trip notifications
        "trip_request",
        "trip_accepted",
        "trip_rejected",
        "trip_withdrawn",
        "trip_cancelled",
        "trip_completed",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    relatedExchange: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExchangeRequest",
      default: null,
    },

    cabShareId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CabShare",
      default: null,
    },

    // Used by Cab Share and Trip request notifications
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;
