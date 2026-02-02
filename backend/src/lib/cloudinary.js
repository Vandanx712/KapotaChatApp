import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getAvatars = async (path) => {
  try {
    const result = await cloudinary.search
      .expression(`folder:${path}`)
      .sort_by("created_at", "desc")
      .execute();

    const images = result.resources.map((img)=>({
        url:img.secure_url
    }))
    return images
  } catch (error) {
    console.log(`Error in getPics:${error}`);
  }
};


export const uploadChatPic = async(path,pic)=>{
  try {
     const uploadResponse = await cloudinary.uploader.upload(pic,{folder:path});
     return uploadResponse
  } catch (error) {
    console.log(`Error in uploadPic: ${error}`)
  }
}