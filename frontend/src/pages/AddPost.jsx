import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  MapPin,
  Music2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Cropper from "react-easy-crop";
import { getAllSongs } from "../lib/axios";

// const MUSIC_LIBRARY = [
//   { id: "m1", title: "Late Night Drive", artist: "Kaito" },
//   { id: "m2", title: "Golden Hour", artist: "Nova" },
//   { id: "m3", title: "City Lights", artist: "Rhea" },
//   { id: "m4", title: "Sunrise Bloom", artist: "Aria" },
//   { id: "m5", title: "Echoes", artist: "Nico" },
// ];

function AddPost() {
  const { authUser } = useAuthStore();
  const { FILTERS } = useThemeStore();

  const [imagePreview, setImagePreview] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Original");
  const [filterStrength, setFilterStrength] = useState(70);
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [musicQuery, setMusicQuery] = useState("");
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [hideLikes, setHideLikes] = useState(false);
  const [disableComments, setDisableComments] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [ratioType, setRatioType] = useState("portrait");
  const audioRef = useRef(null);
  const playPreview = (song) => {
    const audio = audioRef.current;

    audio.pause();
    audio.src = song.track_file;
    audio.currentTime = 0;

    audio.play();

    setTimeout(() => {
      audio.pause();
    }, 30000);
  };
  const RATIOS = {
    square: 1 / 1,
    portrait: 4 / 5,
    landscape: 16 / 9,
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    const songs = await getAllSongs();
    setMusicLibrary(songs.tracks);
  };

  const filteredMusic = useMemo(() => {
    if (!musicQuery.trim()) return musicLibrary;
    const q = musicQuery.toLowerCase();
    return musicLibrary.filter(
      (track) =>
        track.track_title.toLowerCase().includes(q) ||
        track.artist_name.toLowerCase().includes(q),
    );
  }, [musicQuery]);

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
              <input type="checkbox" />
              <div className="collapse-title flex items-center gap-2 text-base font-semibold">
                <Music2 className="size-4" />
                Music
              </div>
              <div className="collapse-content space-y-3">
                <input
                  type="text"
                  placeholder="Search tracks"
                  className="input input-bordered w-full"
                  value={musicQuery}
                  onChange={(e) => setMusicQuery(e.target.value)}
                />
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {filteredMusic.map((track) => (
                    <button
                      key={track.track_id}
                      onClick={() => setSelectedMusic(track)}
                      className={`flex w-full items-center justify-between rounded-lg border border-base-300 p-2 text-left transition ${
                        selectedMusic?.id === track.id
                          ? "bg-primary/10 border-primary"
                          : "bg-base-100"
                      }`}
                    >
                      <div>
                        <img src={track.album_image} width="40" />
                        <p className="text-sm font-medium">{track.track_title}</p>
                        <p className="text-xs text-base-content/60">
                          {track.artist_name}
                        </p>
                      </div>
                      <Sparkles
                        onClick={() => playPreview(track)}
                        className="size-4 text-primary"
                      />
                    </button>
                  ))}
                  <audio ref={audioRef} />
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
                <input
                  type="text"
                  placeholder="Add location"
                  className="input input-bordered w-full"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
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
