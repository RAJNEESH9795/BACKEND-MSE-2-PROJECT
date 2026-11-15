
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createRide,
  getRides,
  getMyRides,
  getRideById,
  updateRide,
  cancelRide,
} from "../controllers/rideController.js";

const router = express.Router();

// All ride endpoints require authentication
router.use(protect);

// Create a new ride
router.post("/", createRide);

// Get rides created by the logged-in user
// IMPORTANT: Keep this route before /:id
router.get("/my-rides", getMyRides);

// Get all available rides with optional filters
router.get("/", getRides);

// Get one ride by ID
router.get("/:id", getRideById);

// Update a ride
router.patch("/:id", updateRide);

// Cancel a ride
router.delete("/:id", cancelRide);

export default router;
