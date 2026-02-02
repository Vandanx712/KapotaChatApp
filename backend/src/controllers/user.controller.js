import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { uploadChatPic } from "../lib/cloudinary.js";
import { User } from "../models/user.model.js";

export const updateProfilePic = asynchandller(async (req, res) => {
  const { profilePic, url } = req.body;
  const { _id } = req.user;

  if (!profilePic || url) throw new ApiError(400, "Image is required");

  let pic;
  if (profilePic) {
    const path = StoragePath({
      includeMainFolder: true,
      includeAvatarFolder: false,
      includeUserProfilePic: true,
      includeMessageFolder: false,
    });
    pic = await uploadChatPic(path, profilePic);
  } else if (url) {
    pic = url;
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
