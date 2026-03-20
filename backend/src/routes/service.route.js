import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import {
  getPlaceDetail,
  getSuggestion,
  searchLocation,
} from "../controllers/service.controller.js";

const serviceRoute = Router();

//location part
serviceRoute.route("/get/places").get(verifyjwt, getSuggestion);
serviceRoute.route("/search").get(verifyjwt, searchLocation);
serviceRoute.route('/detail/:placeId').get(verifyjwt,getPlaceDetail)

export default serviceRoute;
