import express from "express";
import dotenv from "dotenv";
import indexRoute from "./routes/index.route.js";
import connectDb from "./db/db.js";
import cookieparser from "cookie-parser";
import cors from "cors";
import { app,server } from "./lib/socket.js";

dotenv.config();
const port = process.env.PORT;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieparser());
app.use(express.json({limit:'10mb'}));
app.use("/api", indexRoute);
server.listen(port, () => {
  connectDb();
  console.log(`Kapota chat run on ${port}`);
});
