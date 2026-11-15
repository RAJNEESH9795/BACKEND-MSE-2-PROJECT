
import mongoose from "mongoose";
import ServiceListing from "../models/ServiceListing.js";

// Escape special regex characters in user search input.
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ==========================================
// 1. CREATE A SERVICE LISTING
// ==========================================

export const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      seeking,
      availability,
      mode,
      location,
    } = req.body;

    const service = await ServiceListing.create({
      offeredBy: req.user.userId,
      title,
      category,
      description,
      seeking,
      availability,
      mode,
      location,
    });

    return res.status(201).json({
      success: true,
      message: "Service listing created successfully",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create service listing",
    });
  }
};

// ==========================================
// 2. GET ALL ACTIVE SERVICE LISTINGS
// ==========================================

export const getServices = async (req, res) => {
  try {
    const { search, category, mode } = req.query;

    const filter = {
      status: "active",
    };

    if (category) {
      filter.category = category;
    }

    if (mode) {
      filter.mode = mode;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { seeking: searchRegex },
        { location: searchRegex },
      ];
    }

    const services = await ServiceListing.find(filter)
      .populate("offeredBy", "name community profilePhoto")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch service listings",
    });
  }
};

// ==========================================
// 3. GET MY SERVICE LISTINGS
// ==========================================

export const getMyServices = async (req, res) => {
  try {
    const services = await ServiceListing.find({
      offeredBy: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get my services error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your service listings",
    });
  }
};

// ==========================================
// 4. GET SERVICE LISTING BY ID
// ==========================================

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service listing ID",
      });
    }

    const service = await ServiceListing.findById(id)
      .populate("offeredBy", "name community profilePhoto");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service listing not found",
      });
    }

    const isOwner =
      service.offeredBy._id.toString() ===
      req.user.userId.toString();

    if (service.status !== "active" && !isOwner) {
      return res.status(404).json({
        success: false,
        message: "Service listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get service error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch service listing",
    });
  }
};

// ==========================================
// 5. UPDATE SERVICE LISTING (OWNER ONLY)
// ==========================================

export const updateService = async (req, res) => {
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
        message: "Invalid service listing ID",
      });
    }

    const service = await ServiceListing.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service listing not found",
      });
    }

    if (
      service.offeredBy.toString() !==
      req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own service listings",
      });
    }

    if (service.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Closed service listings cannot be updated",
      });
    }

    const allowedFields = [
      "title",
      "category",
      "description",
      "seeking",
      "availability",
      "mode",
      "location",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service listing updated successfully",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update service listing",
    });
  }
};

// ==========================================
// 6. UPDATE LISTING STATUS (OWNER ONLY)
// ==========================================

export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service listing ID",
      });
    }

    const allowedStatuses = ["active", "paused", "closed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active, paused, or closed",
      });
    }

    const service = await ServiceListing.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service listing not found",
      });
    }

    if (
      service.offeredBy.toString() !==
      req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own service listings",
      });
    }

    if (service.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "A closed service listing cannot be reopened",
      });
    }

    service.status = status;

    await service.save();

    return res.status(200).json({
      success: true,
      message: `Service listing ${status} successfully`,
      service,
    });
  } catch (error) {
    console.error("Update service status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update service listing status",
    });
  }
};
