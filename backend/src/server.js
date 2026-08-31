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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.RN_URL,
  "http://127.0.0.1:2026",
]
  .filter(Boolean)
  .map((url) => url.trim().replace(/\/+$/, ""));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self)");
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.trim().replace(/\/+$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
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
