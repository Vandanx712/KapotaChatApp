import { Router } from "express";
import { checkAuth, forgetPassword, login, logout, signup } from "../controllers/auth.controller.js";
import {verifyjwt} from '../middlewares/verifyjwt.js'

const authRouter = Router()

authRouter.route('/signup').post(signup)
authRouter.route('/login').post(login)
authRouter.route('/logout').post(logout)
authRouter.route('/check').get(verifyjwt,checkAuth)
authRouter.route('/forget-password').post(forgetPassword)   

export default authRouter