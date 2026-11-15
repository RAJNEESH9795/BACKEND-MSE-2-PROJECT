
import express from "express";
import request from "supertest";
import upload, {
  validateImageSignature,
} from "../../src/middleware/uploadMiddleware.js";

const app = express();

app.post(
  "/upload",
  upload.single("profilePhoto"),
  validateImageSignature,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Image accepted",
    });
  }
);

// Handle Multer and fileFilter errors.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.name === "MulterError") {
    const statusCode =
      err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    return res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message,
  });
});

// Genuine minimal image fixtures.
const validPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
  "base64"
);

const validJpeg = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
  "base64"
);

const validWebp = Buffer.from(
  "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==",
  "base64"
);

describe("Profile photo upload middleware", () => {
  // ========================================
  // VALID IMAGE TESTS
  // ========================================

  test("accepts a genuine PNG image", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("profilePhoto", validPng, {
        filename: "profile.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("accepts a genuine JPEG image", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("profilePhoto", validJpeg, {
        filename: "profile.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("accepts a genuine WebP image", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("profilePhoto", validWebp, {
        filename: "profile.webp",
        contentType: "image/webp",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // ========================================
  // INVALID IMAGE TESTS
  // ========================================

  test("rejects unsupported MIME types", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("profilePhoto", Buffer.from("plain text"), {
        filename: "document.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects files with invalid image signatures", async () => {
    const fakeImage = Buffer.from(
      "This is not a genuine image file"
    );

    const response = await request(app)
      .post("/upload")
      .attach("profilePhoto", fakeImage, {
        filename: "fake.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Invalid image file/i);
  });

  test("rejects uploads without an image", async () => {
    const response = await request(app).post("/upload");

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/select an image/i);
  });

  test("rejects files larger than 2 MB", async () => {
    const oversizedFile = Buffer.alloc(
      2 * 1024 * 1024 + 1,
      1
    );

    const response = await request(app)
      .post("/upload")
      .attach("profilePhoto", oversizedFile, {
        filename: "large.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(413);
  });

  test("rejects unexpected file field names", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("unexpectedField", Buffer.from("test"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
  });

  // ========================================
  // MIME AND SIGNATURE MISMATCH
  // ========================================

  test("rejects a PNG file declared as JPEG", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("profilePhoto", validPng, {
        filename: "profile.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Invalid image file/i);
  });
});
