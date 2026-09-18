import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const rawUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017";
    const dbUrl =
      rawUrl.includes("mongodb+srv") || rawUrl.includes("?")
        ? rawUrl
        : `${rawUrl.replace(/\/+$/, "")}/kapotaChat`;

    const connectionInstance = await mongoose.connect(dbUrl, {
      dbName: "kapotaChat",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log(`MongoDB connected :${connectionInstance.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDb;
