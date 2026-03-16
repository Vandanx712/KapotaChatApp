import {Router} from 'express'
import { verifyjwt } from '../middlewares/verifyjwt.js'
import { getSongs } from '../controllers/service.controller.js'

const serviceRoute = Router()

serviceRoute.route('/getall').get(verifyjwt,getSongs)


export default serviceRoute