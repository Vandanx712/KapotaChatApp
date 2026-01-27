import { Router } from "express";
import userRouter from "./user.route.js";
import authRouter from "./auth.route.js";

const indexrouter = Router();

indexrouter.use('/user',userRouter)
indexrouter.use('/auth',authRouter)

export default indexrouter;
