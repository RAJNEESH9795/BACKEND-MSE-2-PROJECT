
import mongoose from "mongoose";

const serviceListingSchema = new mongoose.Schema(
  {
    // Student offering the service.
    offeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Service title.
    title: {
      type: String,
      required: [true, "Service title is required."],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    // Service category.
    category: {
      type: String,
      required: [true, "Service category is required."],
      enum: [
        "academics",
        "technology",
        "creative",
        "photography",
        "languages",
        "career",
        "fitness",
        "music",
        "other",
      ],
    },

    // Service description.
    description: {
      type: String,
      required: [true, "Service description is required."],
      trim: true,
      minlength: 20,
      maxlength: 1000,
    },

    // What the provider wants in return.
    seeking: {
      type: String,
      required: [true, "Please describe what you want in return."],
      trim: true,
      minlength: 3,
      maxlength: 300,
    },

    // Availability information.
    availability: {
      type: String,
      required: [true, "Availability is required."],
      trim: true,
      maxlength: 200,
    },

    // How the service will be delivered.
    mode: {
      type: String,
      required: true,
      enum: ["online", "in-person", "both"],
      default: "both",
    },

    // Optional location for in-person services.
    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    // Listing status.
    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate location for in-person services.
serviceListingSchema.pre("validate", function () {
  if (
    this.mode === "in-person" &&
    !this.location?.trim()
  ) {
    this.invalidate(
      "location",
      "Location is required for in-person services."
    );
  }
});

// Useful marketplace indexes.
serviceListingSchema.index({
  status: 1,
  category: 1,
  createdAt: -1,
});

serviceListingSchema.index({
  offeredBy: 1,
  status: 1,
  createdAt: -1,
});

const ServiceListing = mongoose.model(
  "ServiceListing",
  serviceListingSchema
);

export default ServiceListing;
