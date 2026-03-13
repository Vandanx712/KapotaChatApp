import { useMemo, useState } from "react";
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

const FILTERS = [
  "Original",
  "Warm",
  "Cool",
  "Vintage",
  "Mono",
  "Noir",
  "Sunset",
  "Forest",
  "Soft",
];

const MUSIC_LIBRARY = [
  { id: "m1", title: "Late Night Drive", artist: "Kaito" },
  { id: "m2", title: "Golden Hour", artist: "Nova" },
  { id: "m3", title: "City Lights", artist: "Rhea" },
  { id: "m4", title: "Sunrise Bloom", artist: "Aria" },
  { id: "m5", title: "Echoes", artist: "Nico" },
];

function Status() {
  const [imagePreview, setImagePreview] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Original");
  const [filterStrength, setFilterStrength] = useState(70);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [musicQuery, setMusicQuery] = useState("");
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [hideLikes, setHideLikes] = useState(false);
  const [disableComments, setDisableComments] = useState(false);
  const [audience, setAudience] = useState("public");

  const filteredMusic = useMemo(() => {
    if (!musicQuery.trim()) return MUSIC_LIBRARY;
    const q = musicQuery.toLowerCase();
    return MUSIC_LIBRARY.filter(
      (track) =>
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q),
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
              Build your post step by step. More tools can be added later
              without changing the layout.
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
              <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-base-300 bg-base-100">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-base-content/60">
                    <div className="rounded-full bg-base-200 p-4">
                      <ImagePlus className="size-6" />
                    </div>
                    <div className="text-sm">Upload a photo to start</div>
                  </div>
                )}
              </div>
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
                  {FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`btn btn-xs ${
                        selectedFilter === filter
                          ? "btn-primary"
                          : "btn-ghost"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-base-content/60">
                    <span>Strength</span>
                    <span>{filterStrength}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterStrength}
                    onChange={(e) => setFilterStrength(Number(e.target.value))}
                    className="range range-primary"
                  />
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
                      key={track.id}
                      onClick={() => setSelectedMusic(track)}
                      className={`flex w-full items-center justify-between rounded-lg border border-base-300 p-2 text-left transition ${
                        selectedMusic?.id === track.id
                          ? "bg-primary/10 border-primary"
                          : "bg-base-100"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{track.title}</p>
                        <p className="text-xs text-base-content/60">
                          {track.artist}
                        </p>
                      </div>
                      <Sparkles className="size-4 text-primary" />
                    </button>
                  ))}
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
                <div className="space-y-2">
                  <label className="text-sm">Audience</label>
                  <select
                    className="select select-bordered w-full"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends</option>
                    <option value="only-me">Only me</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Status;
