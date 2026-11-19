
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../config/email.js";

// ==========================================
// HELPER: NORMALIZE EMAIL
// ==========================================

const normalizeEmail = (email) => {
  return email.trim().toLowerCase();
};

// ==========================================
// HELPER: GENERATE JWT
// ==========================================

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

// ==========================================
// 1. REGISTER USER
// ==========================================

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required registration fields",
      });
    }

    if (typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check whether the email already exists.
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // The User model's pre-save hook hashes the password.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        community: user.community,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 2. LOGIN USER
// ==========================================

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input.
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and password",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Find user and explicitly include password and tokenVersion.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +tokenVersion");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status.
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended",
      });
    }

    // Compare entered password with stored hash.
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT.
    const token = generateToken(user);

    // Return token and safe user information.
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        community: user.community,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 3. CHANGE PASSWORD
// ==========================================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide your current and new passwords",
      });
    }

    const user = await User.findById(req.user.userId)
      .select("+password +tokenVersion");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended",
      });
    }

    const isPasswordValid =
      await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword =
      await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Update password and invalidate existing JWTs.
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};

// ==========================================
// 4. FORGOT PASSWORD
// ==========================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const genericMessage =
      "If an account with that email exists, a password reset link has been sent.";

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const user = await User.findOne({
      email: normalizeEmail(email),
      accountStatus: "active",
    });

    // Avoid revealing whether an account exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    // Generate a secure random reset token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only its SHA-256 hash.
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const clientUrl = process.env.CLIENT_URL;

    if (!clientUrl) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      throw new Error("CLIENT_URL is not configured");
    }

    const resetUrl =
      `${clientUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "MoveMate - Password Reset Request",

        text: `You requested a password reset for your MoveMate account.

Click the link below to reset your password:
${resetUrl}

This link expires in 15 minutes.

If you did not request this, you can safely ignore this email.`,

        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; color: #334155;">

            <h2 style="color: #2563eb;">
              MoveMate Password Reset
            </h2>

            <p>Hello ${user.name},</p>

            <p>
              We received a request to reset your MoveMate account password.
            </p>

            <p style="margin: 30px 0;">
              <a
                href="${resetUrl}"
                style="background-color: #2563eb; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;"
              >
                Reset My Password
              </a>
            </p>

            <p>
              This link will expire in <strong>15 minutes</strong>.
            </p>

            <p>
              If you did not request a password reset, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;" />

            <p style="font-size: 12px; color: #64748b;">
              MoveMate - Travel Together. Share Smartly. Help Each Other.
            </p>

          </div>
        `,
      });
    } catch (emailError) {
      // Invalidate reset token if email delivery fails.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      console.error(
        "Password reset email delivery failed:",
        emailError
      );
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your password reset request.",
    });
  }
};

// ==========================================
// 5. RESET PASSWORD
// ==========================================

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required password reset fields.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    // Hash the received token.
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find matching, unexpired reset token.
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      accountStatus: "active",
    }).select(
      "+password +passwordResetToken +passwordResetExpires +tokenVersion"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Prevent password reuse.
    const isSamePassword =
      await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "Your new password must be different from your current password.",
      });
    }

    // Update password.
    // User model pre-save hook hashes the password.
    user.password = newPassword;

    // Invalidate existing JWT sessions.
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    // Make reset token unusable.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password. Please try again.",
    });
  }
};
