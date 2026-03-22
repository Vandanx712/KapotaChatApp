export const getGoogleUrl = (query) => {
  const url = `https://maps.googleapis.com/maps/api/${query}&key=${process.env.GOOGLE_API_KEY}`;
  return url;
};
