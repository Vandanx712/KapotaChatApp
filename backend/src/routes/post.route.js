import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createPost, deletePost, postFeed, updatePostSetting, userAllPost } from "../controllers/post.controller.js";

const postRoute = Router();

postRoute.route("/").post(verifyjwt, createPost);
postRoute.route('/').put(verifyjwt,updatePostSetting)
postRoute.route('/:id').delete(verifyjwt,deletePost)
postRoute.route('/feed').get(verifyjwt,postFeed)
postRoute.route('/myposts').get(verifyjwt,userAllPost)

export default postRoute;
