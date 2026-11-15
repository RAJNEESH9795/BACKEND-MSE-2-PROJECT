
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return reject(new Error("Invalid image buffer."));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "movemate/profile-photos",
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (
          !result ||
          !result.secure_url ||
          !result.public_id ||
          !result.secure_url.startsWith("https://")
        ) {
          return reject(
            new Error("Cloudinary returned an invalid upload result.")
          );
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    Readable.from([buffer]).pipe(uploadStream);
  });
};

export default uploadToCloudinary;
