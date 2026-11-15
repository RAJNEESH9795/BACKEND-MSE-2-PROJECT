
import { jest } from "@jest/globals";
import { Writable } from "stream";

// Mock Cloudinary before importing the upload service.
const mockUploadStream = jest.fn();

jest.unstable_mockModule("../../src/config/cloudinary.js", () => ({
  default: {
    uploader: {
      upload_stream: mockUploadStream,
    },
  },
}));

const { default: uploadToCloudinary } = await import(
  "../../src/services/cloudinaryUpload.js"
);

// Creates a valid Writable stream for Readable.pipe().
const createMockWritableStream = () => {
  return new Writable({
    write(chunk, encoding, callback) {
      callback();
    },
  });
};

describe("Cloudinary Upload Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects non-buffer input", async () => {
    await expect(
      uploadToCloudinary("not-a-buffer")
    ).rejects.toThrow("Invalid image buffer.");

    expect(mockUploadStream).not.toHaveBeenCalled();
  });

  test("rejects an empty buffer", async () => {
    await expect(
      uploadToCloudinary(Buffer.alloc(0))
    ).rejects.toThrow("Invalid image buffer.");

    expect(mockUploadStream).not.toHaveBeenCalled();
  });

  test("uploads a valid buffer and returns Cloudinary details", async () => {
    mockUploadStream.mockImplementation((options, callback) => {
      process.nextTick(() => {
        callback(null, {
          secure_url:
            "https://res.cloudinary.com/demo/image/upload/photo.jpg",
          public_id: "movemate/profile-photos/photo",
        });
      });

      return createMockWritableStream();
    });

    await expect(
      uploadToCloudinary(Buffer.from("test-image"))
    ).resolves.toEqual({
      secure_url:
        "https://res.cloudinary.com/demo/image/upload/photo.jpg",
      public_id: "movemate/profile-photos/photo",
    });

    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: "movemate/profile-photos",
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      }),
      expect.any(Function)
    );
  });

  test("propagates Cloudinary upload errors", async () => {
    mockUploadStream.mockImplementation((options, callback) => {
      process.nextTick(() => {
        callback(new Error("Cloudinary upload failed"), null);
      });

      return createMockWritableStream();
    });

    await expect(
      uploadToCloudinary(Buffer.from("test-image"))
    ).rejects.toThrow("Cloudinary upload failed");
  });

  test("rejects an invalid Cloudinary response", async () => {
    mockUploadStream.mockImplementation((options, callback) => {
      process.nextTick(() => {
        callback(null, {
          public_id: "movemate/profile-photos/photo",
        });
      });

      return createMockWritableStream();
    });

    await expect(
      uploadToCloudinary(Buffer.from("test-image"))
    ).rejects.toThrow(
      "Cloudinary returned an invalid upload result."
    );
  });

  test("rejects an insecure Cloudinary URL", async () => {
    mockUploadStream.mockImplementation((options, callback) => {
      process.nextTick(() => {
        callback(null, {
          secure_url: "http://example.com/photo.jpg",
          public_id: "movemate/profile-photos/photo",
        });
      });

      return createMockWritableStream();
    });

    await expect(
      uploadToCloudinary(Buffer.from("test-image"))
    ).rejects.toThrow(
      "Cloudinary returned an invalid upload result."
    );
  });
});
