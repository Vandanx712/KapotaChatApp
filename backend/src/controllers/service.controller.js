import axios from "axios";
import { asynchandller } from "../util/asynchandller.js";

export const getSongs = asynchandller(async (req, res) => {
  try {
    const response = await axios.get(
      "https://freemusicarchive.org/api/get/tracks.json?genre_handle=instrumental",
    );

    res.json(response.data);
  } catch (error) {
    console.error("Music API Error:", error.message);
    res.status(500).json({
      message: "Music fetch failed",
      error: error.message,
    });
  }
});
