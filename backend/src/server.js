import express from "express";
import dotenv from "dotenv";
import indexRoute from "./routes/index.route.js";
import connectDb from "./db/db.js";
import cookieparser from "cookie-parser";
import cors from "cors";

dotenv.config();

const port = process.env.port;
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieparser());
app.use("/api", indexRoute);
app.listen(port, () => {
  connectDb();
  console.log(`Kapota chat run on ${port}`);
});
