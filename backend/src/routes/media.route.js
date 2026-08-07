import { Router } from "express"
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { completeMediaUpload, getMediaAccess, prepareMediaUpload } from "../controllers/media.controller.js";



const mediaRoute = Router()

mediaRoute.route("/prepare").post(verifyjwt, prepareMediaUpload)
mediaRoute.route("/complete").post(verifyjwt, completeMediaUpload)
mediaRoute.route("/:id/access").get(verifyjwt, getMediaAccess)

export default mediaRoute