
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../services/cloudinaryUpload.js";

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

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

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        community: user.community,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE MY PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

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

    // Profile photo can only be changed through the upload endpoint.
    const allowedFields = ["name", "phone", "community"];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    Object.assign(user, updates);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        community: user.community,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// UPLOAD MY PROFILE PHOTO
export const uploadProfilePhoto = async (req, res) => {
  let newPublicId = null;
  let isSaved = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended.",
      });
    }

    // Upload the new image to Cloudinary.
    const uploadResult = await uploadToCloudinary(req.file.buffer);

    newPublicId = uploadResult.public_id;

    // Remember the previous image ID.
    const oldPublicId = user.profilePhotoPublicId || "";

    // Build an atomic filter so another concurrent upload
    // cannot overwrite this request's assumptions.
    const updateFilter = {
      _id: user._id,
      accountStatus: "active",
    };

    if (oldPublicId) {
      updateFilter.profilePhotoPublicId = oldPublicId;
    } else {
      updateFilter.$or = [
        { profilePhotoPublicId: "" },
        { profilePhotoPublicId: { $exists: false } },
        { profilePhotoPublicId: null },
      ];
    }

    // Update only if the previous photo ID is still unchanged.
    const updatedUser = await User.findOneAndUpdate(
      updateFilter,
      {
        $set: {
          profilePhoto: uploadResult.secure_url,
          profilePhotoPublicId: newPublicId,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    // Another upload or account change may have happened first.
    if (!updatedUser) {
      const currentUser = await User.findById(user._id);

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (currentUser.accountStatus !== "active") {
        return res.status(403).json({
          success: false,
          message: "Your account is suspended.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Your profile photo was changed by another request. Please try again.",
      });
    }

    // MongoDB now references the new Cloudinary image.
    isSaved = true;

    // Delete the previous image only after the database update.
    if (oldPublicId && oldPublicId !== newPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (cleanupError) {
        console.error(
          "Previous profile photo cleanup failed:",
          cleanupError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      profilePhoto: updatedUser.profilePhoto,
    });
  } catch (error) {
    console.error("Profile photo upload error:", error);

    // Never delete the new image if MongoDB already saved it.
    if (newPublicId && !isSaved) {
      try {
        await cloudinary.uploader.destroy(newPublicId);
      } catch (cleanupError) {
        console.error(
          "New profile photo cleanup failed:",
          cleanupError
        );
      }
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to upload profile photo.",
    });
  }
};
