
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createBooking,
  getRideBookings,
  updateBookingStatus,
  getMyBookings,
  cancelBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

router.use(protect);

router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/ride/:rideId", getRideBookings);
router.patch("/:bookingId/status", updateBookingStatus);
router.patch("/:bookingId/cancel", cancelBooking);

export default router;
