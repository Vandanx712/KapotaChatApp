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
    });
    console.log(`MongoDB connected on ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
  }
};

export default connectDb;
