import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  MapPin,
  Music2,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Cropper from "react-easy-crop";
import { getSuggestion, searchLocation } from "../lib/axios";

function AddPost() {
  const { authUser } = useAuthStore();
  const { FILTERS } = useThemeStore();

  const [imagePreview, setImagePreview] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Original");
  const [filterStrength, setFilterStrength] = useState(70);
  const [caption, setCaption] = useState("");
  const [locationquery, setLocationQuery] = useState("");
  const [searchSuggestions,setSearchSuggestions] = useState([])
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [hideLikes, setHideLikes] = useState(false);
  const [disableComments, setDisableComments] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [ratioType, setRatioType] = useState("portrait");

  const RATIOS = {
    square: 1 / 1,
    portrait: 4 / 5,
    landscape: 16 / 9,
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(()=>{
    setSearchSuggestions([])
  },[locationquery==''])

  const loadSuggestions = async () => {
    try {
      const resdata = await getSuggestion();
      setLocationSuggestions(resdata.places);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearch=async()=>{
    try {
      const resdata = await searchLocation(locationquery.trim())
      setSearchSuggestions(resdata.results)
    } catch (error) {
      console.log(error)
    }
  }

  const locations = searchSuggestions || locationSuggestions

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const changeRatio = (type) => {
    setRatioType(type);
    setAspect(RATIOS[type]);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const getCroppedImage = async () => {
    const image = new Image();
    image.src = imagePreview;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.filter = FILTERS[selectedFilter](filterStrength);

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  };

  const clearImage = () => {
    setImagePreview("");
  };

  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <div className="container mx-auto px-4 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create Post</h1>
            <p className="text-base-content/60">
              Build your post step by step.
            </p>
          </div>
          <button className="btn btn-primary">Share Post</button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card border border-base-300 bg-base-200/40">
            <div className="card-body gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Preview</h2>

                {imagePreview && (
                  <button className="btn btn-ghost btn-xs" onClick={clearImage}>
                    <Trash2 className="size-4" />
                    Remove
                  </button>
                )}
              </div>

              {/* Ratio Switch */}
              {imagePreview && (
                <div className="flex justify-center">
                  <div className="join">
                    <button
                      onClick={() => changeRatio("square")}
                      className={`btn btn-xs join-item ${
                        ratioType === "square" ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      1:1
                    </button>

                    <button
                      onClick={() => changeRatio("portrait")}
                      className={`btn btn-xs join-item ${
                        ratioType === "portrait" ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      4:5
                    </button>

                    <button
                      onClick={() => changeRatio("landscape")}
                      className={`btn btn-xs join-item ${
                        ratioType === "landscape"
                          ? "btn-primary"
                          : "btn-outline"
                      }`}
                    >
                      16:9
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Area */}
              <div
                className={`relative w-full overflow-hidden rounded-xl border border-base-300 bg-base-100 ${ratioType === "square" ? "aspect-square" : ratioType === "landscape" ? "aspect-video" : "aspect-[4/5]"}`}
              >
                {imagePreview ? (
                  <>
                    <Cropper
                      image={imagePreview}
                      crop={crop}
                      zoom={zoom}
                      aspect={aspect}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(area, pixels) =>
                        setCroppedAreaPixels(pixels)
                      }
                      style={{
                        containerStyle: {
                          width: "100%",
                          height: "100%",
                          filter: FILTERS[selectedFilter](filterStrength),
                        },
                      }}
                    />

                    {/* Zoom Slider */}
                    <div className="absolute bottom-2 left-2 right-2 bg-base-200/80 backdrop-blur rounded-lg p-2">
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(e.target.value)}
                        className="range range-xs"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-base-content/60">
                    <div className="rounded-full bg-base-200 p-4">
                      <ImagePlus className="size-6" />
                    </div>
                    <div className="text-sm">Upload a photo to start</div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <label className="btn btn-outline btn-primary">
                <ImagePlus className="size-4" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="collapse collapse-arrow border border-base-300 bg-base-200/60">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title flex items-center gap-2 text-base font-semibold">
                <SlidersHorizontal className="size-4" />
                Filters
              </div>
              <div className="collapse-content space-y-4">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(FILTERS).map((name) => (
                    <div
                      key={name}
                      onClick={() => imagePreview && setSelectedFilter(name)}
                      className="cursor-pointer text-center"
                    >
                      <img
                        src={imagePreview || authUser.profilePic.url}
                        style={{
                          filter: FILTERS[name](filterStrength),
                        }}
                        className="size-20 rounded-lg object-cover"
                      />

                      <p
                        className={`text-xs mt-2 ${selectedFilter === name ? " rounded-full p-1 bg-primary/40" : ""}`}
                      >
                        {name}
                      </p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-base-content/60">
                    <span>Strength</span>
                    <span>{filterStrength}%</span>
                  </div>
                  {selectedFilter !== "Original" && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filterStrength}
                      onChange={(e) =>
                        setFilterStrength(Number(e.target.value))
                      }
                      className="range range-primary"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow border border-base-300 bg-base-200/60">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title flex items-center gap-2 text-base font-semibold">
                <Type className="size-4" />
                Caption
              </div>
              <div className="collapse-content space-y-3">
                <textarea
                  className="textarea textarea-bordered min-h-[120px] w-full"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <div className="text-xs text-base-content/60">
                  {caption.length}/2,000
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow border border-base-300 bg-base-200/60">
              <input type="checkbox" />
              <div className="collapse-title flex items-center gap-2 text-base font-semibold">
                <MapPin className="size-4" />
                Location
              </div>
              <div className="collapse-content">
                <label className="flex items-center gap-2 input input-bordered input-md w-full">
                  <input
                    type="text"
                    placeholder="Add location"
                    className=" w-full"
                    value={locationquery}
                    onChange={(e)=>setLocationQuery(e.target.value)}
                  />
                  <Search onClick={()=>handleSearch()} className="size-5 cursor-pointer" />
                </label>
                <div className="mt-3 rounded-lg border border-base-300 bg-base-100">
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-base-content/60">
                    <span>Suggestions</span>
                    <span>{locationSuggestions.length}</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto overscroll-contain">
                    {locationSuggestions.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-base-content/50">
                        "No suggestions found."
                      </div>
                    ) : (
                      <ul className="divide-y divide-base-300">
                        {locationSuggestions.map((suggestion, index) => {
                          const lat = Number(suggestion.lat);
                          const lng = Number(suggestion.lng);
                          const types = Array.isArray(suggestion.types)
                            ? suggestion.types
                            : [];

                          return (
                            <li
                              key={`${suggestion.name}-${suggestion.address}-${index}`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  // setLocation({
                                  //   name: suggestion.name,
                                  //   coordinates: {
                                  //     lng: suggestion.lng,
                                  //     lat: suggestion.lat,
                                  //   },
                                  // });
                                  // setLocationSuggestions([]);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-base-200/70"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-medium">
                                      {suggestion.name || "Unknown place"}
                                    </div>
                                    {suggestion.address && (
                                      <div className="text-xs text-base-content/60">
                                        {suggestion.address}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {types.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {types.slice(0, 4).map((type) => (
                                      <span
                                        key={`${type}-${index}`}
                                        className="badge badge-ghost badge-xs"
                                      >
                                        {type.replace(/_/g, " ")}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow border border-base-300 bg-base-200/60">
              <input type="checkbox" />
              <div className="collapse-title flex items-center gap-2 text-base font-semibold">
                <Settings2 className="size-4" />
                Post Settings
              </div>
              <div className="collapse-content space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hide like counts</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={hideLikes}
                    onChange={(e) => setHideLikes(e.target.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Disable comments</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={disableComments}
                    onChange={(e) => setDisableComments(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPost;
