
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error(
      "Only JPG, PNG and WEBP images are allowed."
    );

    error.statusCode = 400;
    error.code = "INVALID_FILE_TYPE";

    return cb(error);
  }

  cb(null, true);
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
  },
});

// ==========================================
// IMAGE SIGNATURE VALIDATION
// ==========================================

export const validateImageSignature = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (
      !detectedType ||
      !allowedMimeTypes.includes(detectedType.mime) ||
      detectedType.mime !== req.file.mimetype
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image file. Please upload a genuine JPG, PNG or WEBP image.",
      });
    }

    next();
  } catch (error) {
    console.error("Image validation error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to validate the uploaded image.",
    });
  }
};

export { upload };
export default upload;
