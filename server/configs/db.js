import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is not defined in environment variables");
    }

    console.log("🔵 Attempting to connect to MongoDB...");
    
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "quickgpt1",
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected successfully!");
    console.log("📊 Database:", mongoose.connection.db.databaseName);

    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("❌ Mongoose disconnected from MongoDB");
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("💡 Check your MONGODB_URI in .env file");
    process.exit(1);
  }
};

export default connectDB;