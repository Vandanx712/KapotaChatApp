import express from "express";
import dotenv from "dotenv";
import indexRoute from "./routes/index.route.js";
import connectDb from "./db/db.js";
import cookieparser from 'cookie-parser'


dotenv.config();

const port = process.env.port;
const app = express();

app.use(express.json());
app.use(cookieparser())
app.use("/api", indexRoute);
app.listen(port, () => {
  connectDb();
  console.log(`Kapota chat run on ${port}`);
});
