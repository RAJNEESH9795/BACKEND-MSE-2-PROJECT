
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createExchangeRequest,
  getMyExchangeRequests,
  getReceivedExchangeRequests,
  updateExchangeRequestStatus,
  cancelExchangeRequest,
  confirmExchangeCompletion,
} from "../controllers/exchangeController.js";

const router = express.Router();

router.use(protect);

// Create an exchange request.
router.post("/", createExchangeRequest);

// View requests sent by the logged-in user.
router.get("/my-requests", getMyExchangeRequests);

// View requests received by the logged-in user.
router.get("/received", getReceivedExchangeRequests);

// Accept or reject a request.
router.patch("/:id/status", updateExchangeRequestStatus);

// Cancel a pending request.
router.patch("/:id/cancel", cancelExchangeRequest);

// Confirm service completion.
router.patch("/:id/complete", confirmExchangeCompletion);

export default router;
