
import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    // Use the operating system DNS resolver.
    dns.setServers(["8.8.8.8", "8.8.4.4"]);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });

    console.log(
      `MongoDB connected: ${mongoose.connection.host}`
    );

  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
