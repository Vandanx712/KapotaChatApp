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

    const images = result.resources.map((img) => ({
      url: img.secure_url
    }))
    return images
  } catch (error) {
    console.log(`Error in getPics:${error}`);
  }
};

export const uploadChatPic = async (path, pic) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(pic, { folder: path });
    return {
      key: uploadResponse.public_id,
      url: uploadResponse.secure_url
    }
  } catch (error) {
    console.log(`Error in uploadPic: ${error}`)
  }
}

export const deleteImage = async (oldkey) => {
  try {
    await cloudinary.uploader.destroy(oldkey)
  } catch (error) {
    console.log(`Error in deletePic: ${error}`)
  }
}

export const deleteCloudinaryAsset = async ({
  publicId,
  resourceType,
  deliveryType,
}) => {
  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: deliveryType,
    invalidate: true,
  });
};

export const createUploadSignature = (params) => {
  return {
    signature: cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET,
    ),
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUD_NAME,
  };
};

export const getCloudinaryAsset = async ({
  publicId,
  resourceType,
  deliveryType,
}) => {
  try {
    return await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
      type: deliveryType,
    });
  } catch (error) {
    const statusCode = error?.http_code || error?.error?.http_code;

    if (statusCode === 404) {
      return null;
    }

    throw error;
  }
};

export const createPrivateMediaUrl = ({
  publicId,
  format,
  resourceType,
  deliveryType,
  expiresAt,
  attachment = false,
}) => {
  return cloudinary.utils.private_download_url(
    publicId,
    resourceType === "raw" ? null : format,
    {
      resource_type: resourceType,
      type: deliveryType,
      expires_at: expiresAt,
      attachment,
    },
  );
};
