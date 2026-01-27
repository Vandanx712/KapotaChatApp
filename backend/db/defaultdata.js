import { User } from "../models/user.model.js";
import { asynchandller } from "../util/asynchandler.js";



export const defaultData = asynchandller(async()=>{
    const user = await User.countDocuments({})
    if(!user){
        await User.create({
            name:'Kapota Chat',
            email:'kapota@7gmail.com',
            phoneNo:9998997991,
            password:'kapota77'
        })
        console.log('Create default company user successfully')
    }
})