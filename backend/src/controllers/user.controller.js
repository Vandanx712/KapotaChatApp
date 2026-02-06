import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { getAvatars, uploadChatPic } from "../lib/cloudinary.js";
import { User } from "../models/user.model.js";



//getall predefind avatars
export const getPreAvatars = asynchandller(async (req, res) => {
  const {gender} = req.body
  if(!gender) throw new ApiError(401,'Missing field')

  const path = StoragePath(gender,{
    includeMainFolder: true,
    includeAvatarFolder: true,
    includeUserProfilePic: false,
    includeMessageFolder: false,
  });

  const avatars = await getAvatars(path)

  return res.status(200).json({
    success: true,
    message: 'Fetch all preavatars successfully',
    avatars
  })
})

export const updateProfilePic = asynchandller(async (req, res) => {
  const { profilePic, picUrl } = req.body;
  const { _id } = req.user;

  let pic;
  if (profilePic) {
    const path = StoragePath('',{
      includeMainFolder: true,
      includeAvatarFolder: false,
      includeUserProfilePic: true,
      includeMessageFolder: false,
    });
    pic = await uploadChatPic(path, profilePic);
  } else if (picUrl) {
    pic = picUrl;
  }

  const user = await User.findByIdAndUpdate(
    _id,
    { profilePic: pic },
    { new: true },
  ).select("-password");    

  return res.status(200).json({
    success: true,
    message: "ProfilePic update successfully",
    user,
  });
});
