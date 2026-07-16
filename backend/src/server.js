import express from "express";
import dotenv from "dotenv";
import indexRoute from "./routes/index.route.js";
import connectDb from "./db/db.js";
import cookieparser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import compression from "compression";
import ratelimiter from "express-rate-limit";
import { handleError } from "./util/apierror.js";

dotenv.config();
const port = process.env.PORT;

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.RN_URL],
    credentials: true,
  }),
);
app.use(cookieparser());
app.use(
  ratelimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    statusCode: 429,
    message: "Too many requests, please try again later.",
  }),
); // limit each IP to 100 requests per windowMs)
app.use(compression({ level: 6, threshold: 512 }));
app.use(express.json({ limit: "10mb" }));
app.use("/api", indexRoute);
app.use(handleError);
server.listen(port, "0.0.0.0", () => {
  connectDb();
  console.log(`Kapota chat run on ${port}`);
});
