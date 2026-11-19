
import mongoose from "mongoose";
import CabShare from "../models/CabShare.js";
import { sendNotificationSafely } from "../utils/notificationHelper.js";

const validId = (id) =>
  mongoose.isValidObjectId(id);

const getUserId = (req) =>
  req.user.userId.toString();

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Notify all approved passengers
const notifyApprovedPassengers = async ({
  cabShare,
  sender,
  type,
  title,
  message,
}) => {
  const passengerIds = [
    ...new Set(
      cabShare.requests
        .filter((request) => request.status === "approved")
        .map((request) => request.user.toString())
    ),
  ];

  await Promise.all(
    passengerIds.map((recipient) =>
      sendNotificationSafely({
        recipient,
        sender,
        type,
        title,
        message,
      })
    )
  );
};

// ==========================================
// 1. CREATE CAB-SHARING POST
// ==========================================

export const createCabShare = async (req, res) => {
  try {
    const {
      source,
      destination,
      departureDate,
      departureTime,
      provider,
      bookingStatus,
      totalSeatsToShare,
      estimatedFare,
      description,
    } = req.body;

    if (
      typeof source !== "string" ||
      !source.trim() ||
      typeof destination !== "string" ||
      !destination.trim() ||
      !departureDate ||
      !departureTime ||
      !provider ||
      !bookingStatus ||
      totalSeatsToShare === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required cab details",
      });
    }

    const date = new Date(departureDate);

    if (
      Number.isNaN(date.getTime()) ||
      date <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Departure date must be in the future",
      });
    }

    const seats = Number(totalSeatsToShare);

    if (
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > 7
    ) {
      return res.status(400).json({
        success: false,
        message: "Seats must be between 1 and 7",
      });
    }

    if (
      !["Uber", "Rapido", "Ola", "Other"].includes(provider) ||
      !["booked", "planning"].includes(bookingStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cab provider or booking status",
      });
    }

    let fare = null;

    if (
      estimatedFare !== undefined &&
      estimatedFare !== null &&
      estimatedFare !== ""
    ) {
      fare = Number(estimatedFare);

      if (!Number.isFinite(fare) || fare < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Estimated fare must be a valid non-negative amount",
        });
      }
    }

    const cabShare = await CabShare.create({
      createdBy: req.user.userId,
      source: source.trim(),
      destination: destination.trim(),
      departureDate: date,
      departureTime,
      provider,
      bookingStatus,
      totalSeatsToShare: seats,
      availableSeats: seats,
      estimatedFare: fare,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Cab-sharing post created successfully",
      cabShare,
    });
  } catch (error) {
    console.error("Create cab share error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to create cab-sharing post",
    });
  }
};

// ==========================================
// 2. GET AVAILABLE CAB-SHARING POSTS
// ==========================================

export const getCabShares = async (req, res) => {
  try {
    const { source, destination, date, provider } =
      req.query;

    const filter = {
      status: "open",
      availableSeats: { $gt: 0 },
    };

    if (source) {
      filter.source = {
        $regex: escapeRegex(source),
        $options: "i",
      };
    }

    if (destination) {
      filter.destination = {
        $regex: escapeRegex(destination),
        $options: "i",
      };
    }

    if (provider) {
      if (
        !["Uber", "Rapido", "Ola", "Other"].includes(provider)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid cab provider filter",
        });
      }

      filter.provider = provider;
    }

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date filter",
        });
      }

      filter.departureDate = {
        $gte: start,
        $lte: end,
      };
    }

    const cabShares = await CabShare.find(filter)
      .populate("createdBy", "name community")
      .sort({ departureDate: 1, departureTime: 1 });

    return res.status(200).json({
      success: true,
      count: cabShares.length,
      cabShares,
    });
  } catch (error) {
    console.error("Get cab shares error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch cab-sharing posts",
    });
  }
};

// ==========================================
// 3. GET MY CAB-SHARING POSTS
// ==========================================

export const getMyCabShares = async (req, res) => {
  try {
    const cabShares = await CabShare.find({
      createdBy: req.user.userId,
    })
      .populate("createdBy", "name community")
      .populate("requests.user", "name community")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cabShares.length,
      cabShares,
    });
  } catch (error) {
    console.error("Get my cab shares error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your cab-sharing posts",
    });
  }
};

// ==========================================
// 4. GET ONE CAB-SHARING POST
// ==========================================

export const getCabShareById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cab-sharing ID",
      });
    }

    const cabShare = await CabShare.findById(id)
      .populate("createdBy", "name community");

    if (!cabShare) {
      return res.status(404).json({
        success: false,
        message: "Cab-sharing post not found",
      });
    }

    const isOwner =
      cabShare.createdBy._id.toString() === getUserId(req);

    if (isOwner) {
      await cabShare.populate(
        "requests.user",
        "name community"
      );
    } else {
      // Do not expose other passengers' request details
      cabShare.requests = [];
    }

    return res.status(200).json({
      success: true,
      cabShare,
    });
  } catch (error) {
    console.error("Get cab share error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch cab-sharing post",
    });
  }
};

// ==========================================
// 5. REQUEST TO JOIN A CAB
// ==========================================

export const requestToJoinCab = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cab-sharing ID",
      });
    }

    const cabShare = await CabShare.findOneAndUpdate(
      {
        _id: id,
        status: "open",
        availableSeats: { $gt: 0 },
        createdBy: { $ne: userId },
        requests: {
          $not: {
            $elemMatch: {
              user: userId,
              status: { $in: ["pending", "approved"] },
            },
          },
        },
      },
      {
        $push: {
          requests: {
            user: userId,
            status: "pending",
            requestedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!cabShare) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to request this cab. It may be full, unavailable, your own post, or you may already have an active request.",
      });
    }

    // Find the newly created request subdocument
    const newRequest =
      cabShare.requests[cabShare.requests.length - 1];

    if (!newRequest) {
      return res.status(500).json({
        success: false,
        message: "Cab request was created but could not be identified",
      });
    }

    // IMPORTANT: Save cabShareId and requestId
    // so the notification can approve/reject this exact request.
    await sendNotificationSafely({
      recipient: cabShare.createdBy,
      sender: userId,
      type: "cab_share_request",
      title: "New Cab Sharing Request",
      message: "Someone has requested to join your cab.",
      cabShareId: cabShare._id,
      requestId: newRequest._id,
    });

    return res.status(201).json({
      success: true,
      message: "Request to join sent successfully",
      cabShare,
      requestId: newRequest._id,
    });
  } catch (error) {
    console.error("Request to join cab error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send join request",
    });
  }
};

// ==========================================
// 6. APPROVE OR REJECT JOIN REQUEST
// ==========================================

export const respondToCabRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { action } = req.body;

    if (!validId(id) || !validId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cab-sharing or request ID",
      });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approved or rejected",
      });
    }

    const ownerId = getUserId(req);
    const respondedAt = new Date();

    const currentCabShare = await CabShare.findOne({
      _id: id,
      createdBy: ownerId,
      "requests._id": requestId,
      "requests.status": "pending",
    });

    if (!currentCabShare) {
      return res.status(400).json({
        success: false,
        message:
          "Pending request not found or you are not authorized",
      });
    }

    const request = currentCabShare.requests.id(requestId);
    const passengerId = request.user.toString();

    if (action === "approved") {
      const cabShare = await CabShare.findOneAndUpdate(
        {
          _id: id,
          createdBy: ownerId,
          status: "open",
          availableSeats: { $gt: 0 },
          requests: {
            $elemMatch: {
              _id: requestId,
              status: "pending",
            },
          },
        },
        {
          $set: {
            "requests.$.status": "approved",
            "requests.$.respondedAt": respondedAt,
          },
          $inc: {
            availableSeats: -1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!cabShare) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to approve. The request may no longer be pending or no seats are available.",
        });
      }

      if (cabShare.availableSeats === 0) {
        await CabShare.updateOne(
          {
            _id: id,
            status: "open",
            availableSeats: 0,
          },
          {
            $set: { status: "full" },
          }
        );

        cabShare.status = "full";
      }

      await sendNotificationSafely({
        recipient: passengerId,
        sender: ownerId,
        type: "cab_share_accepted",
        title: "Cab Sharing Request Accepted",
        message:
          "Your request to join the cab has been approved.",
        cabShareId: cabShare._id,
        requestId,
      });

      return res.status(200).json({
        success: true,
        message: "Cab-sharing request approved",
        cabShare,
      });
    }

    const cabShare = await CabShare.findOneAndUpdate(
      {
        _id: id,
        createdBy: ownerId,
        requests: {
          $elemMatch: {
            _id: requestId,
            status: "pending",
          },
        },
      },
      {
        $set: {
          "requests.$.status": "rejected",
          "requests.$.respondedAt": respondedAt,
        },
      },
      { new: true }
    );

    if (!cabShare) {
      return res.status(400).json({
        success: false,
        message: "Request is no longer pending",
      });
    }

    await sendNotificationSafely({
      recipient: passengerId,
      sender: ownerId,
      type: "cab_share_rejected",
      title: "Cab Sharing Request Rejected",
      message:
        "Your request to join the cab was not accepted.",
      cabShareId: cabShare._id,
      requestId,
    });

    return res.status(200).json({
      success: true,
      message: "Cab-sharing request rejected",
      cabShare,
    });
  } catch (error) {
    console.error("Respond to cab request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process cab-sharing request",
    });
  }
};

// ==========================================
// 7. PASSENGER WITHDRAWS THEIR REQUEST
// ==========================================

export const withdrawCabRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const userId = getUserId(req);

    if (!validId(id) || !validId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cab-sharing or request ID",
      });
    }

    const pendingResult = await CabShare.findOneAndUpdate(
      {
        _id: id,
        requests: {
          $elemMatch: {
            _id: requestId,
            user: userId,
            status: "pending",
          },
        },
      },
      {
        $set: {
          "requests.$.status": "cancelled",
          "requests.$.respondedAt": new Date(),
        },
      },
      { new: true }
    );

    if (pendingResult) {
      await sendNotificationSafely({
        recipient: pendingResult.createdBy,
        sender: userId,
        type: "cab_share_withdrawn",
        title: "Cab Sharing Request Withdrawn",
        message: "A passenger has withdrawn their request.",
        cabShareId: pendingResult._id,
        requestId,
      });

      return res.status(200).json({
        success: true,
        message: "Join request withdrawn successfully",
        cabShare: pendingResult,
      });
    }

    const approvedResult = await CabShare.findOneAndUpdate(
      {
        _id: id,
        status: { $in: ["open", "full"] },
        $expr: {
          $lt: ["$availableSeats", "$totalSeatsToShare"],
        },
        requests: {
          $elemMatch: {
            _id: requestId,
            user: userId,
            status: "approved",
          },
        },
      },
      {
        $set: {
          "requests.$.status": "cancelled",
          "requests.$.respondedAt": new Date(),
          status: "open",
        },
        $inc: {
          availableSeats: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (approvedResult) {
      await sendNotificationSafely({
        recipient: approvedResult.createdBy,
        sender: userId,
        type: "cab_share_withdrawn",
        title: "Passenger Withdrew from Cab",
        message:
          "An approved passenger has withdrawn from your cab.",
        cabShareId: approvedResult._id,
        requestId,
      });

      return res.status(200).json({
        success: true,
        message:
          "You withdrew from the cab. Your seat is available again.",
        cabShare: approvedResult,
      });
    }

    return res.status(400).json({
      success: false,
      message:
        "Request cannot be withdrawn. It may already be rejected, cancelled, completed, or unavailable.",
    });
  } catch (error) {
    console.error("Withdraw cab request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to withdraw cab request",
    });
  }
};

// ==========================================
// 8. CANCEL CAB-SHARING POST
// ==========================================

export const cancelCabShare = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = getUserId(req);

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cab-sharing ID",
      });
    }

    const cabShare = await CabShare.findOneAndUpdate(
      {
        _id: id,
        createdBy: ownerId,
        status: { $in: ["open", "full"] },
      },
      {
        $set: {
          status: "cancelled",
        },
      },
      { new: true }
    );

    if (!cabShare) {
      return res.status(404).json({
        success: false,
        message:
          "Cab-sharing post not found or cannot be cancelled",
      });
    }

    await notifyApprovedPassengers({
      cabShare,
      sender: ownerId,
      type: "cab_share_cancelled",
      title: "Cab Sharing Cancelled",
      message:
        "The cab-sharing poster has cancelled the journey.",
    });

    return res.status(200).json({
      success: true,
      message: "Cab-sharing post cancelled successfully",
      cabShare,
    });
  } catch (error) {
    console.error("Cancel cab share error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel cab-sharing post",
    });
  }
};

// ==========================================
// 9. COMPLETE CAB-SHARING POST
// ==========================================

export const completeCabShare = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = getUserId(req);

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cab-sharing ID",
      });
    }

    const cabShare = await CabShare.findOneAndUpdate(
      {
        _id: id,
        createdBy: ownerId,
        status: { $in: ["open", "full"] },
      },
      {
        $set: {
          status: "completed",
        },
      },
      { new: true }
    );

    if (!cabShare) {
      return res.status(404).json({
        success: false,
        message:
          "Cab-sharing journey cannot be completed",
      });
    }

    await notifyApprovedPassengers({
      cabShare,
      sender: ownerId,
      type: "cab_share_completed",
      title: "Cab Journey Completed",
      message:
        "The cab-sharing poster has marked the journey completed.",
    });

    return res.status(200).json({
      success: true,
      message:
        "Cab-sharing journey marked as completed",
      cabShare,
    });
  } catch (error) {
    console.error("Complete cab share error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete cab-sharing journey",
    });
  }
};
