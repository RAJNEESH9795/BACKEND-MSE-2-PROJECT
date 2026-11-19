import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createTrip,
  getTrips,
  getMyTrips,
  getMyTripRequests,
  requestToJoinTrip,
  respondToTripRequest,
  withdrawTripRequest,
  cancelTrip,
  completeTrip,
} from "../controllers/tripController.js";

const router = express.Router();

router.use(protect);

router.post("/", createTrip);
router.get("/my-trips", getMyTrips);
router.get("/my-requests", getMyTripRequests);
router.get("/", getTrips);

router.post("/:id/requests", requestToJoinTrip);
router.patch("/:id/requests/:requestId", respondToTripRequest);
router.patch("/:id/requests/:requestId/withdraw", withdrawTripRequest);
router.patch("/:id/cancel", cancelTrip);
router.patch("/:id/complete", completeTrip);

export default router;