
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createCabShare,
  getCabShares,
  getMyCabShares,
  getCabShareById,
  requestToJoinCab,
  respondToCabRequest,
  withdrawCabRequest,
  cancelCabShare,
  completeCabShare,
} from "../controllers/cabShareController.js";

const router = express.Router();

// All cab-sharing endpoints require authentication.
router.use(protect);

// Create a cab-sharing post.
router.post("/", createCabShare);

// Get the logged-in user's posts.
// Keep this before /:id.
router.get("/my-cab-shares", getMyCabShares);

// Browse available cab-sharing posts.
router.get("/", getCabShares);

// View one cab-sharing post.
router.get("/:id", getCabShareById);

// Request to join a cab.
router.post("/:id/requests", requestToJoinCab);

// Approve or reject a joining request.
router.patch("/:id/requests/:requestId", respondToCabRequest);

// Passenger withdraws their request.
router.patch(
  "/:id/requests/:requestId/withdraw",
  withdrawCabRequest
);

// Cancel a cab-sharing post.
router.patch("/:id/cancel", cancelCabShare);

// Mark a journey as completed.
router.patch("/:id/complete", completeCabShare);

export default router;
