
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createService,
  getServices,
  getMyServices,
  getServiceById,
  updateService,
  updateServiceStatus,
} from "../controllers/serviceController.js";

const router = express.Router();

// All service marketplace endpoints require authentication.
router.use(protect);

// Create a service listing.
router.post("/", createService);

// Get the logged-in user's listings.
// Keep this route before /:id.
router.get("/my-services", getMyServices);

// Browse active service listings with optional filters.
router.get("/", getServices);

// Get one service listing.
router.get("/:id", getServiceById);

// Edit a service listing.
router.patch("/:id", updateService);

// Pause, reactivate, or close a service listing.
router.patch("/:id/status", updateServiceStatus);

export default router;
