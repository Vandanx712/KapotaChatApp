import mongoose from "mongoose";

const connectDb = async () => {
  const dbname = "kapotachat";
  try {
    const connectioninstance = await mongoose.connect(
      `${process.env.DATABASE_URL}/${dbname}`,
    );
    console.log(`mongodb connect on ${connectioninstance.connection.host}`);
  } catch (error) {
    console.error(`connection error is ${error}`);
  }
};

export default connectDb