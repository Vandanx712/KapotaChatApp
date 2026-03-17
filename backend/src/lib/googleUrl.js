export const getGoogleUrl = (query) => {
  const url = `https://maps.googleapis.com/maps/api/place/${query}&key=${process.env.GOOGLE_API_KEY}`;
  return url;
};
