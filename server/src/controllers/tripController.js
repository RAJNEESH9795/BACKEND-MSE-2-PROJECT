
import mongoose from "mongoose";
import Trip from "../models/Trip.js";
import { sendNotificationSafely } from "../utils/notificationHelper.js";

const validId = (id) => mongoose.isValidObjectId(id);

const getUserId = (req) => req.user.userId.toString();

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ==========================================
// 1. CREATE TRIP
// ==========================================

export const createTrip = async (req, res) => {
  try {
    const {
      title,
      source,
      destination,
      departureDate,
      departureTime,
      maxParticipants,
      estimatedCostPerPerson,
      description,
    } = req.body;

    if (
      ![title, source, destination, departureDate, departureTime].every(
        (value) => typeof value === "string" && value.trim()
      ) ||
      maxParticipants === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required trip details.",
      });
    }

    const date = new Date(departureDate);
    const max = Number(maxParticipants);

    const cost =
      estimatedCostPerPerson === "" ||
      estimatedCostPerPerson == null
        ? null
        : Number(estimatedCostPerPerson);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Departure date must be in the future.",
      });
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(departureTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid departure time.",
      });
    }

    if (!Number.isInteger(max) || max < 2 || max > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum participants must be between 2 and 50.",
      });
    }

    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      return res.status(400).json({
        success: false,
        message: "Estimated cost must be non-negative.",
      });
    }

    const trip = await Trip.create({
      createdBy: getUserId(req),
      title: title.trim(),
      source: source.trim(),
      destination: destination.trim(),
      departureDate: date,
      departureTime,
      maxParticipants: max,
      availableSlots: max - 1,
      estimatedCostPerPerson: cost,
      description: description || "",
    });

    await trip.populate("createdBy", "name profilePhoto");

    return res.status(201).json({
      success: true,
      message: "Trip created successfully.",
      trip,
    });
  } catch (error) {
    console.error("Create trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create trip.",
    });
  }
};

// ==========================================
// 2. FIND TRIPS
// ==========================================

export const getTrips = async (req, res) => {
  try {
    const filter = {
      status: "open",
      departureDate: { $gte: new Date() },
      availableSlots: { $gt: 0 },
      createdBy: { $ne: getUserId(req) },
    };

    ["source", "destination"].forEach((field) => {
      const value = req.query[field];

      if (typeof value === "string" && value.trim()) {
        filter[field] = {
          $regex: escapeRegex(value.trim()),
          $options: "i",
        };
      }
    });

    if (req.query.date) {
      const start = new Date(req.query.date);

      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        filter.departureDate = {
          $gte: start,
          $lt: end,
        };
      }
    }

    const trips = await Trip.find(filter)
      .populate("createdBy", "name profilePhoto")
      .sort({ departureDate: 1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error("Get trips error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch trips.",
    });
  }
};

// ==========================================
// 3. MY ORGANIZED TRIPS
// ==========================================

export const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      createdBy: getUserId(req),
    })
      .populate("createdBy", "name profilePhoto")
      .populate("requests.user", "name profilePhoto")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error("Get my trips error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your trips.",
    });
  }
};

// ==========================================
// 4. TRIPS I HAVE REQUESTED TO JOIN
// ==========================================

export const getMyTripRequests = async (req, res) => {
  try {
    const trips = await Trip.find({
      "requests.user": getUserId(req),
    })
      .populate("createdBy", "name profilePhoto")
      .sort({ departureDate: 1 });

    const results = trips.map((trip) => ({
      ...trip.toObject(),
      requests: trip.requests.filter(
        (request) =>
          request.user?._id?.toString() === getUserId(req)
      ),
    }));

    return res.status(200).json({
      success: true,
      count: results.length,
      trips: results,
    });
  } catch (error) {
    console.error("Get trip requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your trip requests.",
    });
  }
};

// ==========================================
// 5. REQUEST TO JOIN TRIP
// ==========================================

export const requestToJoinTrip = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID.",
      });
    }

    const trip = await Trip.findOneAndUpdate(
      {
        _id: id,
        createdBy: { $ne: getUserId(req) },
        status: "open",
        availableSlots: { $gt: 0 },

        requests: {
          $not: {
            $elemMatch: {
              user: getUserId(req),
              status: { $in: ["pending", "approved"] },
            },
          },
        },
      },
      {
        $push: {
          requests: {
            user: getUserId(req),
          },
        },
      },
      { new: true }
    );

    if (!trip) {
      return res.status(409).json({
        success: false,
        message: "Trip unavailable, already requested, or owned by you.",
      });
    }

    const request = trip.requests[trip.requests.length - 1];

    await sendNotificationSafely({
      recipient: trip.createdBy,
      sender: getUserId(req),
      type: "trip_request",
      title: "New trip join request",
      message: "Someone has requested to join your trip.",
      tripId: trip._id,
      requestId: request._id,
    });

    return res.status(201).json({
      success: true,
      message: "Join request sent successfully.",
      trip,
    });
  } catch (error) {
    console.error("Request to join trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit join request.",
    });
  }
};

// ==========================================
// 6. APPROVE OR REJECT REQUEST
// ==========================================

export const respondToTripRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { action } = req.body;

    if (!validId(id) || !validId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip or request ID.",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approve or reject.",
      });
    }

    const trip = await Trip.findOne({
      _id: id,
      createdBy: getUserId(req),
      status: "open",
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or not manageable.",
      });
    }

    const request = trip.requests.id(requestId);

    if (!request || request.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Pending request not found.",
      });
    }

    if (action === "approve" && trip.availableSlots < 1) {
      return res.status(409).json({
        success: false,
        message: "No participant slots available.",
      });
    }

    request.status =
      action === "approve" ? "approved" : "rejected";

    request.respondedAt = new Date();

    if (action === "approve") {
      trip.availableSlots -= 1;

      if (trip.availableSlots === 0) {
        trip.status = "full";
      }
    }

    await trip.save();

    await sendNotificationSafely({
      recipient: request.user,
      sender: getUserId(req),
      type:
        action === "approve"
          ? "trip_accepted"
          : "trip_rejected",
      title:
        action === "approve"
          ? "Trip request accepted"
          : "Trip request declined",
      message:
        action === "approve"
          ? "Your request to join the trip was accepted."
          : "Your request to join the trip was declined.",
      tripId: trip._id,
      requestId: request._id,
    });

    return res.status(200).json({
      success: true,
      message: `Trip request ${action}d successfully.`,
      trip,
    });
  } catch (error) {
    console.error("Respond to trip request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to respond to request.",
    });
  }
};

// ==========================================
// 7. WITHDRAW JOIN REQUEST
// ==========================================

export const withdrawTripRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;

    if (!validId(id) || !validId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip or request ID.",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found.",
      });
    }

    const request = trip.requests.id(requestId);

    if (
      !request ||
      request.user.toString() !== getUserId(req) ||
      !["pending", "approved"].includes(request.status)
    ) {
      return res.status(404).json({
        success: false,
        message: "Active request not found.",
      });
    }

    const wasApproved = request.status === "approved";

    request.status = "cancelled";
    request.respondedAt = new Date();

    if (wasApproved) {
      trip.availableSlots += 1;

      if (trip.status === "full") {
        trip.status = "open";
      }
    }

    await trip.save();

    await sendNotificationSafely({
      recipient: trip.createdBy,
      sender: getUserId(req),
      type: "trip_withdrawn",
      title: "Trip request withdrawn",
      message: "A participant withdrew their trip request.",
      tripId: trip._id,
      requestId: request._id,
    });

    return res.status(200).json({
      success: true,
      message: "Trip request withdrawn.",
      trip,
    });
  } catch (error) {
    console.error("Withdraw trip request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to withdraw request.",
    });
  }
};

// ==========================================
// 8. CANCEL TRIP
// ==========================================

export const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID.",
      });
    }

    const trip = await Trip.findOne({
      _id: id,
      createdBy: getUserId(req),
      status: { $in: ["open", "full"] },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Active trip not found or not owned by you.",
      });
    }

    const recipients = [
      ...new Set(
        trip.requests
          .filter((request) => request.status === "approved")
          .map((request) => request.user.toString())
      ),
    ];

    trip.status = "cancelled";
    await trip.save();

    await Promise.all(
      recipients.map((recipient) =>
        sendNotificationSafely({
          recipient,
          sender: getUserId(req),
          type: "trip_cancelled",
          title: "Trip cancelled",
          message: `The trip ${trip.title} has been cancelled.`,
          tripId: trip._id,
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: "Trip cancelled successfully.",
      trip,
    });
  } catch (error) {
    console.error("Cancel trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel trip.",
    });
  }
};

// ==========================================
// 9. COMPLETE TRIP
// ==========================================

export const completeTrip = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID.",
      });
    }

    const trip = await Trip.findOne({
      _id: id,
      createdBy: getUserId(req),
      status: { $in: ["open", "full"] },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Active trip not found or not owned by you.",
      });
    }

    const recipients = [
      ...new Set(
        trip.requests
          .filter((request) => request.status === "approved")
          .map((request) => request.user.toString())
      ),
    ];

    trip.status = "completed";
    await trip.save();

    await Promise.all(
      recipients.map((recipient) =>
        sendNotificationSafely({
          recipient,
          sender: getUserId(req),
          type: "trip_completed",
          title: "Trip completed",
          message: `The trip ${trip.title} has been completed.`,
          tripId: trip._id,
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: "Trip marked as completed.",
      trip,
    });
  } catch (error) {
    console.error("Complete trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete trip.",
    });
  }
};
