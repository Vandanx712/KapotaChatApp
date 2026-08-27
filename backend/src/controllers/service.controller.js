import axios from "axios";
// import { getGoogleUrl } from "../lib/googleUrl.js";
import { getGeoapifyUrl } from "../lib/googleUrl.js";
import { asynchandller } from "../util/asynchandller.js";

// 1. Nearby Surrounding Places 

export const getSuggestion = asynchandller(async (req, res) => {
  const location = req.user?.location;
  const radius = process.env.RADIUS || 5000;

  // If user has not set coordinates or location is null, return empty places gracefully
  if (!location || location.lat == null || location.lng == null) {
    return res.status(200).json({
      success: true,
      message: "No user location available for surrounding places",
      places: [],
    });
  }

  if (!process.env.GEOAPIFY_API_KEY) {
    console.error("❌ GEOAPIFY_API_KEY is missing in backend .env file!");
    return res.status(500).json({
      success: false,
      message: "GEOAPIFY_API_KEY is missing in backend .env file. Please add it and restart the server.",
      places: [],
    });
  }

  // GOOGLE PLACES API:

  // const url = getGoogleUrl(
  //   `place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}`,
  // );
  // const response = await axios.get(url);
  // const resdata = response.data.results
  //   .filter((p) => p.rating >= 4.2)
  //   .slice(0, 10);
  //
  // const places = resdata.map((place) => ({
  //   name: place.name,
  //   address: place.vicinity,
  //   lat: place.geometry.location.lat,
  //   lng: place.geometry.location.lng,
  //   types: place.types,
  // }));

  // GEOAPIFY PLACES API (v2):

  const categories = [
    "commercial",
    "catering.restaurant",
    "catering.cafe",
    "catering",
    "tourism",
    "tourism.attraction",
    "tourism.sights",
    "entertainment",
    "leisure",
    "leisure.park",
  ].join(",");

  const params = new URLSearchParams({
    categories,
    filter: `circle:${location.lng},${location.lat},${radius}`,
    bias: `proximity:${location.lng},${location.lat}`,
    limit: "10",
  });

  const url = getGeoapifyUrl(
    `places?${params.toString()}`,
    "v2",
  );

  try {
    const response = await axios.get(url);
    const features = response.data?.features || [];

    const places = features.map((place) => ({
      name:
        place.properties.name ||
        place.properties.address_line1 ||
        place.properties.formatted ||
        "Unknown Place",
      address:
        place.properties.address_line2 ||
        place.properties.formatted ||
        "",
      lat: place.properties.lat,
      lng: place.properties.lon,
      types: place.properties.categories || [],
      placeId: place.properties.place_id,
    }));

    return res.status(200).json({
      success: true,
      message: "Fetch surrounding places successfully",
      places,
    });
  } catch (error) {
    console.error("❌ Geoapify Places Error:", error?.response?.data || error.message);
    return res.status(200).json({
      success: true,
      message: "Unable to fetch surrounding places from Geoapify",
      places: [],
    });
  }
});

// 2. Search Location (Autocomplete)

export const searchLocation = asynchandller(async (req, res) => {
  const { query } = req.query;

  if (!query || !query.trim() || query.trim().length < 3) {
    return res.status(200).json({
      success: true,
      message: "Query must be at least 3 characters",
      results: [],
    });
  }

  if (!process.env.GEOAPIFY_API_KEY) {
    console.error("❌ GEOAPIFY_API_KEY is missing in backend .env file!");
    return res.status(500).json({
      success: false,
      message: "GEOAPIFY_API_KEY is missing in backend .env file. Please add it and restart the server.",
      results: [],
    });
  }

  // GOOGLE PLACES AUTOCOMPLETE:

  // const url = getGoogleUrl(`place/autocomplete/json?input=${query}`);
  // const response = await axios.get(url);
  //
  // const results = response.data.predictions.map((item) => ({
  //   name: item.description,
  //   placeId: item.place_id,
  // }));

  // GEOAPIFY AUTOCOMPLETE API (v1):

  const url = getGeoapifyUrl(
    `geocode/autocomplete?text=${encodeURIComponent(query.trim())}&limit=10`,
    "v1",
  );

  try {
    const response = await axios.get(url);
    const features = response.data?.features || [];

    const results = features.map((item) => ({
      name:
        item.properties.formatted ||
        item.properties.name ||
        item.properties.address_line1 ||
        "",
      address: item.properties.address_line2 || item.properties.formatted || "",
      placeId: item.properties.place_id,
      lat: item.properties.lat,
      lng: item.properties.lon,
      types:
        item.properties.categories ||
        (item.properties.category ? [item.properties.category] : []),
    }));

    return res.status(200).json({
      success: true,
      message: "Fetch search location successfully",
      results,
    });
  } catch (error) {
    console.error("❌ Geoapify Search Error:", error?.response?.data || error.message);
    return res.status(200).json({
      success: true,
      message: "Search location failed",
      results: [],
    });
  }
});

// 3. Place Details (By placeId)

export const getPlaceDetail = asynchandller(async (req, res) => {
  const { placeId } = req.params;

  if (!placeId) {
    return res.status(400).json({
      success: false,
      message: "Place ID is required",
    });
  }

  if (!process.env.GEOAPIFY_API_KEY) {
    console.error("❌ GEOAPIFY_API_KEY is missing in backend .env file!");
    return res.status(500).json({
      success: false,
      message: "GEOAPIFY_API_KEY is missing in backend .env file. Please add it and restart the server.",
    });
  }

  // GOOGLE PLACE DETAILS:

  // const url = getGoogleUrl(`place/details/json?place_id=${placeId}`);
  //
  // const response = await axios.get(url);
  // const place = response.data.result;
  // return res.status(200).json({
  //   success: true,
  //   message: "Fetch place detail",
  //   detail: {
  //     name: place.name,
  //     address: place.vicinity,
  //     lat: place.geometry.location.lat,
  //     lng: place.geometry.location.lng,
  //   },
  // });

  // GEOAPIFY PLACE DETAILS API (v2):

  const url = getGeoapifyUrl(`place-details?id=${placeId}`, "v2");

  try {
    const response = await axios.get(url);
    const feature = response.data?.features?.[0]?.properties;

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: "Place details not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fetch place detail",
      detail: {
        name:
          feature.name ||
          feature.address_line1 ||
          feature.formatted ||
          "Unknown Place",
        address: feature.address_line2 || feature.formatted || "",
        lat: feature.lat,
        lng: feature.lon,
      },
    });
  } catch (error) {
    console.error("❌ Geoapify Place Detail Error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve place details from Geoapify",
    });
  }
});

// 4. Reverse Geocoding (Coordinates -> Area & City string)

export const reverseGeocoding = async (location) => {
  try {

    // GOOGLE REVERSE GEOCODING:

    // const url = getGoogleUrl(
    //   `geocode/json?latlng=${location.lat},${location.lng}`,
    // );
    //
    // const response = await axios.get(url);
    // const resdata = response.data?.results[0];
    // let area = "";
    // let city = "";
    //
    // if (!resdata) {
    //   console.log("No address components found");
    //   return null;
    // }
    //
    // resdata?.address_components.forEach((c) => {
    //   if (c.types.includes("sublocality")) {
    //     area = c.long_name;
    //   }
    //   if (c.types.includes("locality")) {
    //     city = c.long_name;
    //   }
    // });
    //
    // return `${area}, ${city}`;

    // GEOAPIFY REVERSE GEOCODING API (v1):

    const url = getGeoapifyUrl(
      `geocode/reverse?lat=${location.lat}&lon=${location.lng}`,
      "v1",
    );

    const response = await axios.get(url);
    const feature = response.data?.features?.[0]?.properties;

    if (!feature) {
      console.log("No address components found");
      return null;
    }

    const area =
      feature.suburb ||
      feature.neighbourhood ||
      feature.district ||
      feature.quarter ||
      feature.subdistrict ||
      "";
    const city =
      feature.city ||
      feature.county ||
      feature.state ||
      "";

    if (area && city) {
      return `${area}, ${city}`;
    }

    return area || city || feature.formatted || null;
  } catch (error) {
    console.log("Reverse Geocoding Error:", error);
    return null;
  }
};
