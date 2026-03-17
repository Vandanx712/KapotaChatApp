import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import {
  getSuggestion,
  searchLocation,
} from "../controllers/service.controller.js";

const serviceRoute = Router();

//location part
serviceRoute.route("/get/places").get(verifyjwt, getSuggestion);
serviceRoute.route("/search").get(verifyjwt, searchLocation);

export default serviceRoute;
