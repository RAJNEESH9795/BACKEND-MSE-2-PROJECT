
import mongoose from "mongoose";
import Ride from "../models/Ride.js";

// ==========================================
// 1. CREATE A RIDE
// ==========================================

export const createRide = async (req, res) => {
  try {
    const {
      source,
      destination,
      departureDate,
      departureTime,
      totalSeats,
      costPerSeat,
      description,
    } = req.body;

    const ride = await Ride.create({
      createdBy: req.user.userId,
      source,
      destination,
      departureDate,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      costPerSeat,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    console.error("Create ride error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create ride",
    });
  }
};

// ==========================================
// 2. GET ALL OPEN RIDES
// ==========================================

export const getRides = async (req, res) => {
  try {
    const { source, destination, date } = req.query;

    const filter = {
      status: "open",
      availableSeats: { $gt: 0 },
    };

    if (source) {
      filter.source = {
        $regex: source,
        $options: "i",
      };
    }

    if (destination) {
      filter.destination = {
        $regex: destination,
        $options: "i",
      };
    }

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);

      if (Number.isNaN(start.getTime())) {
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

    const rides = await Ride.find(filter)
      .populate("createdBy", "name community")
      .sort({ departureDate: 1, departureTime: 1 });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Get rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch rides",
    });
  }
};

// ==========================================
// 3. GET MY RIDES
// ==========================================

export const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      createdBy: req.user.userId,
    })
      .populate("createdBy", "name community")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Get my rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your rides",
    });
  }
};

// ==========================================
// 4. GET RIDE BY ID
// ==========================================

export const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    const ride = await Ride.findById(id)
      .populate("createdBy", "name community");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    return res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error("Get ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch ride",
    });
  }
};

// ==========================================
// 5. UPDATE RIDE (CREATOR ONLY)
// ==========================================

export const updateRide = async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid JSON request body is required",
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Verify ride ownership.
    const rideCreatorId = ride.createdBy.toString();
    const loggedInUserId = req.user.userId.toString();

    if (rideCreatorId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own rides",
      });
    }

    if (ride.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open rides can be updated",
      });
    }

    const allowedFields = [
      "source",
      "destination",
      "departureDate",
      "departureTime",
      "totalSeats",
      "costPerSeat",
      "description",
    ];

    // Calculate occupied seats before applying updates.
    const occupiedSeats =
      ride.totalSeats - ride.availableSeats;

    // Update only permitted fields.
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        ride[field] = req.body[field];
      }
    });

    // Prevent reducing seats below occupied seats.
    if (ride.totalSeats < occupiedSeats) {
      return res.status(400).json({
        success: false,
        message: "Total seats cannot be less than occupied seats",
      });
    }

    // Recalculate available seats.
    ride.availableSeats =
      ride.totalSeats - occupiedSeats;

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride updated successfully",
      ride,
    });
  } catch (error) {
    console.error("Update ride error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update ride",
    });
  }
};

// ==========================================
// 6. CANCEL RIDE (CREATOR ONLY)
// ==========================================

export const cancelRide = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Verify ride ownership.
    const rideCreatorId = ride.createdBy.toString();
    const loggedInUserId = req.user.userId.toString();

    if (rideCreatorId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own rides",
      });
    }

    if (ride.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ride is already cancelled",
      });
    }

    // Soft cancellation.
    ride.status = "cancelled";

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      ride,
    });
  } catch (error) {
    console.error("Cancel ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel ride",
    });
  }
};
