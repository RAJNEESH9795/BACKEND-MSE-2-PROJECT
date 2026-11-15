import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  getMyProfile,
  updateMyProfile
} from "../controllers/userController.js";

import {
  updateProfileValidator
} from "../validators/userValidator.js";

import {
  validateRequest
} from "../validators/authValidator.js";

import { uploadProfilePhoto } from "../controllers/userController.js";
import {
  upload,
  validateImageSignature
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);

router.patch(
  "/me",
  protect,
  updateProfileValidator,
  validateRequest,
  updateMyProfile
);

router.post(
  "/me/profile-photo",
  protect,
  upload.single("profilePhoto"),
  validateImageSignature,
  uploadProfilePhoto
);

export default router;