import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../config/email.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check whether the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    // Create new user
    // The User model's pre-save hook hashes the password
    const user = await User.create({
      name,
      email,
      phone,
      password
    });

    // Return only safe user information
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
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    // Handle duplicate email race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include password
    const user = await User.findOne({ email })
      .select("+password +tokenVersion");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check account status
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended"
      });
    }

    // Compare entered password with stored hash
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        tokenVersion: user.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

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
        community: user.community
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId)
      .select("+password +tokenVersion");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended"
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Prevent reusing the current password
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // Update password and invalidate existing JWTs
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again."
    });

  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password"
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always return a generic response to prevent email enumeration.
    const genericMessage =
      "If an account with that email exists, a password reset link has been sent.";

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      accountStatus: "active",
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    // Generate a cryptographically secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash in MongoDB.
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Frontend reset page URL.
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

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
            <h2 style="color: #2563eb;">MoveMate Password Reset</h2>

            <p>Hello ${user.name},</p>

            <p>We received a request to reset your MoveMate account password.</p>

            <p style="margin: 30px 0;">
              <a
                href="${resetUrl}"
                style="background-color: #2563eb; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;"
              >
                Reset My Password
              </a>
            </p>

            <p>This link will expire in <strong>15 minutes</strong>.</p>

            <p>If you did not request a password reset, you can safely ignore this email.</p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;" />

            <p style="font-size: 12px; color: #64748b;">
              MoveMate - Travel Together. Share Smartly. Help Each Other.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Invalidate the token if email delivery fails.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.error("Password reset email delivery failed:", emailError);
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


export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Check whether passwords match.
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    // Hash the token received from the reset link.
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with a matching, unexpired reset token.
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
        message: "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Prevent reuse of the current password.
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "Your new password must be different from your current password.",
      });
    }

    // Update password. The User model pre-save hook hashes it.
    user.password = newPassword;

    // Invalidate all existing JWT sessions.
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    // Make the reset token unusable after successful reset.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password. Please try again.",
    });
  }
};
