import axios from "axios";
import { getGoogleUrl } from "../lib/googleUrl.js";
import { asynchandller } from "../util/asynchandller.js";

//location part
export const getSuggestion = asynchandller(async (req, res) => {
  const { location } = req.user;
  const radius = process.env.RADIUS;

  const url = getGoogleUrl(
    `place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}`,
  );
  const response = await axios.get(url);
  const resdata = response.data.results
    .filter((p) => p.rating >= 4.2)
    .slice(0, 10);

  const places = resdata.map((place) => ({
    name: place.name,
    address: place.vicinity,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    types: place.types,
  }));

  return res.status(200).json({
    success: true,
    message: "Fetch surrounding places successfully",
    places,
  });
});

export const searchLocation = asynchandller(async (req, res) => {
  const { query } = req.query;

  const url = getGoogleUrl(`place/autocomplete/json?input=${query}`);
  const response = await axios.get(url);

  const results = response.data.predictions.map((item) => ({
    name: item.description,
    placeId: item.place_id,
  }));

  return res.status(200).json({
    success: true,
    message: "Fetch search location successfully",
    results,
  });
});

export const getPlaceDetail = asynchandller(async (req, res) => {
  const { placeId } = req.params;

  const url = getGoogleUrl(`place/details/json?place_id=${placeId}`);

  const response = await axios.get(url);
  const place = response.data.result;
  return res.status(200).json({
    success: true,
    message: "Fetch place detail",
    detail: {
      name: place.name,
      address: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
  });
});

export const reverseGeocoding = async (location) => {
  try {
    const url = getGoogleUrl(
      `geocode/json?latlng=${location.lat},${location.lng}`,
    );

    const response = await axios.get(url);
    const resdata = response.data?.results[0];
    let area = "";
    let city = "";

    if (!resdata) {
      console.log("No address components found");
      return null;
    }

    resdata?.address_components.forEach((c) => {
      if (c.types.includes("sublocality")) {
        area = c.long_name;
      }
      if (c.types.includes("locality")) {
        city = c.long_name;
      }
    });

    return `${area}, ${city}`;
  } catch (error) {
    console.log("Reverse Geocoding Error:", error);
  }
};
