import express from "express";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { handleError } from "./util/apierror.js";
import indexrouter from "./routes/index.route.js";
import connectDb from "./db/db.js";
import { defaultData } from "./db/defaultdata.js";
import { initsocket } from "./sockets/chat.socket.js";

dotenv.config();

const port = process.env.PORT;

await connectDb()
await defaultData()
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL },
});

initsocket(io)

app.use(cors({ origin:process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api", indexrouter);
app.use(handleError);

server.listen(port, () => {
  console.log(`Chatapp running on ${port}`);
});
