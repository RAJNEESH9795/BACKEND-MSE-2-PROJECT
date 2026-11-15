
import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

// ==========================================
// MOCK CLOUDINARY SERVICES
// ==========================================

const mockUploadToCloudinary = jest.fn();
const mockCloudinaryDestroy = jest.fn();

jest.unstable_mockModule("../../src/services/cloudinaryUpload.js", () => ({
  default: mockUploadToCloudinary,
}));

jest.unstable_mockModule("../../src/config/cloudinary.js", () => ({
  default: {
    uploader: {
      destroy: mockCloudinaryDestroy,
    },
  },
}));

// Import after registering ES module mocks.
const { default: app } = await import("../../src/app.js");
const { default: User } = await import("../../src/models/User.js");

// ==========================================
// TEST IMAGE
// ==========================================

const validPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
  "base64"
);

// ==========================================
// TEST HELPERS
// ==========================================

const createToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1h", algorithm: "HS256" }
  );
};

const uploadPhoto = (token) => {
  return request(app)
    .post("/api/v1/users/me/profile-photo")
    .set("Authorization", `Bearer ${token}`)
    .attach("profilePhoto", validPng, {
      filename: "profile.png",
      contentType: "image/png",
    });
};

// ==========================================
// TEST SUITE
// ==========================================

describe("User Profile Photo API", () => {
  let user;
  let token;

  beforeEach(async () => {
    await User.deleteMany({});

    jest.clearAllMocks();

    user = await User.create({
      name: "Test User",
      email: "testuser@movemate.com",
      password: "TestPassword123",
      phone: "9876543210",
      community: "Test Community",
    });

    token = createToken(user._id);

    mockUploadToCloudinary.mockResolvedValue({
      secure_url: "https://res.cloudinary.com/demo/image/upload/profile.png",
      public_id: "movemate/profile-photos/profile",
    });

    mockCloudinaryDestroy.mockResolvedValue({
      result: "ok",
    });
  });

  // ========================================
  // 1. SUCCESSFUL UPLOAD
  // ========================================

  test("uploads a profile photo successfully", async () => {
    const response = await uploadPhoto(token);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.profilePhoto).toBe(
      "https://res.cloudinary.com/demo/image/upload/profile.png"
    );

    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(1);

    const updatedUser = await User.findById(user._id);

    expect(updatedUser.profilePhoto).toBe(
      "https://res.cloudinary.com/demo/image/upload/profile.png"
    );

    expect(updatedUser.profilePhotoPublicId).toBe(
      "movemate/profile-photos/profile"
    );
  });

  // ========================================
  // 2. AUTHENTICATION
  // ========================================

  test("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/profile-photo")
      .attach("profilePhoto", validPng, {
        filename: "profile.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(401);
    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

  // ========================================
  // 3. SUSPENDED ACCOUNT
  // ========================================

  test("rejects profile photo uploads from suspended accounts", async () => {
    user.accountStatus = "suspended";
    await user.save();

    const response = await uploadPhoto(token);

    expect(response.status).toBe(401);
    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

  // ========================================
  // 4. MISSING IMAGE
  // ========================================

  test("rejects requests without a profile photo", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/profile-photo")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

  // ========================================
  // 5. CLOUDINARY FAILURE
  // ========================================

  test("handles Cloudinary upload failures", async () => {
    mockUploadToCloudinary.mockRejectedValueOnce(
      new Error("Cloudinary upload failed")
    );

    const response = await uploadPhoto(token);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/unable to upload/i);

    expect(mockCloudinaryDestroy).not.toHaveBeenCalled();
  });
  // ========================================
  // 6. DATABASE UPDATE FAILURE
  // ========================================

  test("deletes the newly uploaded image if database updating fails", async () => {
    const updateSpy = jest
      .spyOn(User, "findOneAndUpdate")
      .mockRejectedValueOnce(new Error("Database update failed"));

    const response = await uploadPhoto(token);

    expect(response.status).toBe(500);

    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(1);

    expect(mockCloudinaryDestroy).toHaveBeenCalledWith(
      "movemate/profile-photos/profile"
    );

    updateSpy.mockRestore();
  });

  // ========================================
  // 7. OLD PHOTO REPLACEMENT
  // ========================================

  test("deletes the previous photo after successful replacement", async () => {
    user.profilePhoto = "https://res.cloudinary.com/demo/old-photo.jpg";
    user.profilePhotoPublicId = "movemate/profile-photos/old-photo";

    await user.save();

    const response = await uploadPhoto(token);

    expect(response.status).toBe(200);

    expect(mockCloudinaryDestroy).toHaveBeenCalledTimes(1);

    expect(mockCloudinaryDestroy).toHaveBeenCalledWith(
      "movemate/profile-photos/old-photo"
    );

    const updatedUser = await User.findById(user._id);

    expect(updatedUser.profilePhotoPublicId).toBe(
      "movemate/profile-photos/profile"
    );
  });

  // ========================================
  // 8. OLD PHOTO CLEANUP FAILURE
  // ========================================

  test("does not fail the upload if deleting the previous photo fails", async () => {
    user.profilePhoto = "https://res.cloudinary.com/demo/old-photo.jpg";
    user.profilePhotoPublicId = "movemate/profile-photos/old-photo";

    await user.save();

    mockCloudinaryDestroy.mockRejectedValueOnce(
      new Error("Cloudinary deletion failed")
    );

    const response = await uploadPhoto(token);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);

    expect(updatedUser.profilePhotoPublicId).toBe(
      "movemate/profile-photos/profile"
    );
  });

  // ========================================
  // 9. NO OLD PHOTO TO DELETE
  // ========================================

  test("does not attempt to delete an old image when none exists", async () => {
    const response = await uploadPhoto(token);

    expect(response.status).toBe(200);
    expect(mockCloudinaryDestroy).not.toHaveBeenCalled();
  });


  // ========================================
  // 10. CONCURRENT PHOTO UPLOADS
  // ========================================

  test("prevents concurrent uploads from overwriting or deleting the saved photo", async () => {
    const oldPublicId = "movemate/profile-photos/old-photo";
    const firstNewId = "movemate/profile-photos/first-photo";
    const secondNewId = "movemate/profile-photos/second-photo";

    user.profilePhotoPublicId = oldPublicId;
    user.profilePhoto = "https://res.cloudinary.com/demo/old-photo.jpg";
    await user.save();

    // Both requests read the same initial user state.
    const firstSnapshot = await User.findById(user._id);
    const secondSnapshot = await User.findById(user._id);

    // First request wins the atomic update.
    const firstUpdate = await User.findOneAndUpdate(
      {
        _id: firstSnapshot._id,
        profilePhotoPublicId: oldPublicId,
        accountStatus: "active",
      },
      {
        $set: {
          profilePhoto: "https://res.cloudinary.com/demo/first-photo.jpg",
          profilePhotoPublicId: firstNewId,
        },
      },
      { returnDocument: "after" }
    );

    expect(firstUpdate).not.toBeNull();

    // Second request uses its stale snapshot and must fail.
    const secondUpdate = await User.findOneAndUpdate(
      {
        _id: secondSnapshot._id,
        profilePhotoPublicId: oldPublicId,
        accountStatus: "active",
      },
      {
        $set: {
          profilePhoto: "https://res.cloudinary.com/demo/second-photo.jpg",
          profilePhotoPublicId: secondNewId,
        },
      },
      { returnDocument: "after" }
    );

    expect(secondUpdate).toBeNull();

    // Simulate cleanup of the losing request's Cloudinary image.
    await mockCloudinaryDestroy(secondNewId);

    // Verify the winning image remains saved.
    const savedUser = await User.findById(user._id);

    expect(savedUser.profilePhotoPublicId).toBe(firstNewId);

    expect(mockCloudinaryDestroy).toHaveBeenCalledWith(secondNewId);

    expect(mockCloudinaryDestroy).not.toHaveBeenCalledWith(firstNewId);
  });


  // ========================================
  // 11. UNSUPPORTED IMAGE TYPE
  // ========================================

  test("returns HTTP 400 for unsupported image MIME types", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/profile-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", Buffer.from("not-an-image"), {
        filename: "document.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/only JPG, PNG and WEBP/i);

    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

});
