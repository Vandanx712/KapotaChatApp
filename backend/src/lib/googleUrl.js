// GOOGLE MAPS API

import dotenv from "dotenv";

// export const getGoogleUrl = (query) => {
//   const url = `https://maps.googleapis.com/maps/api/${query}&key=${process.env.GOOGLE_API_KEY}`;
//   return url;
// };

// GEOAPIFY API 

dotenv.config()

export const getGeoapifyUrl = (endpoint, version = "v1") => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if(!apiKey) throw new Error("Api key is missing")
  const separator = endpoint.includes("?") ? "&" : "?";
  return `https://api.geoapify.com/${version}/${endpoint}${separator}apiKey=${apiKey}`;
};