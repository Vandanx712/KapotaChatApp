import { Router } from "express";
import authRouter from "./auth.route.js";
import conversationRoute from "./conversation.route.js";
import messageRoute from "./message.route.js";
import userRoute from "./user.route.js";
import serviceRoute from "./service.route.js";
import postRoute from "./post.route.js";

const indexRoute = Router();

indexRoute.use('/auth',authRouter)
indexRoute.use('/user',userRoute)
indexRoute.use('/conversation',conversationRoute)
indexRoute.use('/message',messageRoute)
indexRoute.use('/service',serviceRoute)
indexRoute.use('/post',postRoute)

export default indexRoute;
