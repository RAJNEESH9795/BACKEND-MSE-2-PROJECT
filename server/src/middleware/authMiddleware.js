
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // ==========================================
    // 1. CHECK AUTHORIZATION HEADER
    // ==========================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    // ==========================================
    // 2. VERIFY JWT
    // ==========================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // ==========================================
    // 3. VALIDATE TOKEN PAYLOAD
    // ==========================================

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !mongoose.isValidObjectId(decoded.userId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ==========================================
    // 4. FETCH USER
    // ==========================================

    const user = await User.findById(decoded.userId)
      .select("+tokenVersion");

    if (!user || user.accountStatus !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account not found or inactive. Please log in again.",
      });
    }

    // ==========================================
    // 5. CHECK TOKEN VERSION
    // ==========================================

    const tokenVersion = decoded.tokenVersion ?? 0;
    const currentTokenVersion = user.tokenVersion ?? 0;

    if (
      !Number.isInteger(tokenVersion) ||
      tokenVersion !== currentTokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    // ==========================================
    // 6. ATTACH AUTHENTICATED USER
    // ==========================================

    req.user = {
      userId: user._id,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication service temporarily unavailable.",
    });
  }
};
