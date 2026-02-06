import { asynchandller } from "../util/asynchandller.js";
import { Conversation } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../util/apierror.js";

export const getConversation = asynchandller(async (req, res) => {
  const { _id } = req.user;

  const conversations = await Conversation.find({
    "participants.userId": { $eq: _id },
  })
    .select("participants.userId groupname groupIcon lastMessage")
    .lean();

  const filtered = conversations.map(async (con) => {
    const otheruser = con.participants.find((par) => par.userId !== _id);
    const [user, message] = await Promise.all([
      User.findById(otheruser.userId).select("name profilePic").lean(),
      con.lastMessage
        ? Message.findById(con.lastMessage).select("content").lean()
        : "",
    ]);

    return {
      conversationId: con._id,
      oruserId:user._id,
      name: user.fullname,
      profilePic: user.profilePic,
      groupname : con.groupname,
      groupIcon : con.groupIcon,
      lasmessage: con.lastMessage ? message.content:'',
    };
  });

  return res.status(200).json({
    success: true,
    message: "Fetch conversations successfully",
    filtered,
  });
});

export const createConversation = asynchandller(async(req,res)=>{
  const {oruserId} = req.params
  const {_id} = req.user

  if(!oruserId) throw new ApiError(401,'Please select user to start new conversation')

  const existed = await Conversation.findOne({"participants.userId":{$all:[oruserId,_id]}}).select('_id').lean()
  if(existed) return res.status(400).json({
    success:false,
    message:'Conversation with this user is allready exist'
  })

  await Conversation.create({
    participants:[{userId:_id},{userId:oruserId}]
  })

  return res.status(200).json({
    success:true,
    message:'New conversation create successfully'
  })
})
