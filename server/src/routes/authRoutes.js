import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  validateRequest
} from "../validators/authValidator.js";

import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
} from "../middleware/authRateLimiter.js";

const router = express.Router();

router.post(
  "/register",
  registerLimiter,
  registerValidator,
  validateRequest,
  registerUser
);

router.post(
  "/login",
  loginValidator,
  loginLimiter,
  validateRequest,
  loginUser
);


router.patch(
  "/change-password",
  protect,
  changePasswordLimiter,
  changePasswordValidator,
  validateRequest,
  changePassword
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPasswordValidator,
  validateRequest,
  forgotPassword
);

router.patch(
  "/reset-password/:token",
  resetPasswordLimiter,
  resetPasswordValidator,
  validateRequest,
  resetPassword
);
export default router;