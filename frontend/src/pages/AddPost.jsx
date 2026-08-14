import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  MapPin,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Type,
  X,
} from "lucide-react";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";
import {
  createPost,
  getPlaceDetail,
  getSuggestion,
  searchLocation,
} from "../lib/axios";
import SectionLoader from "../components/common/SectionLoader";
import BusyOverlay from "../components/common/BusyOverlay";
import { AppPage, PageHeader } from "../components/layout/AppPage";
import {
  Badge,
  Button,
  Disclosure,
  EmptyState,
  Input,
  SegmentedControl,
  Switch,
  Textarea,
} from "../components/ui";
import LoadableImage from "../components/common/LoadableImage";
import { uploadMedia } from "../hooks/uploadMedia";

function AddPost() {
  const { FILTERS } = useThemeStore();
  const skipAutoSearchRef = useRef(false);
  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Original");
  const [filterStrength, setFilterStrength] = useState(70);
  const [caption, setCaption] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [placeDetailData, setPlaceDetailData] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");
  const [hideLikes, setHideLikes] = useState(false);
  const [disableShare, setDisableShare] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [ratioType, setRatioType] = useState("portrait");

  const navigate = useNavigate();

  const RATIOS = {
    square: 1,
    portrait: 4 / 5,
    landscape: 16 / 9,
  };

  const previewWidths = {
    square: "min(100%, calc(100vh - 260px), 780px)",
    portrait: "min(100%, calc((100vh - 260px) * 0.8), 780px)",
    landscape: "min(100%, calc((100vh - 260px) * 1.7778), 780px)",
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (locationQuery.trim()) return;
    setSearchSuggestions([]);
    setIsSearchingLocations(false);
  }, [locationQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      if (selectedLocation?.placeId) {
        setPlaceDetailData(null);
        const detail = await loadPlaceDetail(selectedLocation);
        if (isMounted) setPlaceDetailData(detail || null);
      } else {
        setPlaceDetailData(null);
      }
    };
    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedLocation]);

  const loadSuggestions = async () => {
    try {
      const response = await getSuggestion();
      setLocationSuggestions(response.places || []);
    } catch (error) {
      console.log(error);
    }
  };

  const runLocationSearch = async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchSuggestions([]);
      setIsSearchingLocations(false);
      return;
    }

    setIsSearchingLocations(true);
    try {
      const response = await searchLocation(trimmedQuery);
      setSearchSuggestions(response.results || []);
    } catch (error) {
      console.log(error);
      setSearchSuggestions([]);
    } finally {
      setIsSearchingLocations(false);
    }
  };

  useEffect(() => {
    if (!locationQuery.trim()) return undefined;
    if (skipAutoSearchRef.current) {
      skipAutoSearchRef.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => runLocationSearch(locationQuery), 350);
    return () => clearTimeout(timeoutId);
  }, [locationQuery]);

  const handleSearch = async () => {
    await runLocationSearch(locationQuery);
  };

  const loadPlaceDetail = async (location) => {
    if (location.address) return undefined;
    try {
      const response = await getPlaceDetail(location.placeId);
      return response?.detail;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const resolvedSelectedLocation = useMemo(() => {
    if (!selectedLocation) return null;
    if (!selectedLocation.placeId) return selectedLocation;
    return { ...selectedLocation, ...(placeDetailData || {}) };
  }, [placeDetailData, selectedLocation]);

  const locations = useMemo(() => {
    if (resolvedSelectedLocation) return [resolvedSelectedLocation];
    return locationQuery.trim() ? searchSuggestions : locationSuggestions;
  }, [locationQuery, locationSuggestions, resolvedSelectedLocation, searchSuggestions]);

  const clearSelectedLocation = () => {
    setSelectedLocation(null);
    setLocationQuery("");
    setSearchSuggestions([]);
    setIsSearchingLocations(false);
    setPlaceDetailData(null);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Select an image file");
      event.target.value = "";
      return;
    }
    if (file.size > 9 * 1024 * 1024) {
      toast.error("Image must be smaller than 9 MB");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const changeRatio = (type) => {
    setRatioType(type);
    setAspect(RATIOS[type]);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  };

  const getCroppedImage = async () => {
    if (!croppedAreaPixels) throw new Error("Crop is not ready");
    const image = new Image();
    image.src = imagePreview;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    context.filter = FILTERS[selectedFilter](filterStrength);
    context.drawImage(
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
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not create cropped image"));
        },
        "image/jpeg",
        0.9,
      );
    });
  };

  const handleSave = async () => {
    if (!imagePreview) return toast.error("An image is required");
    if (!croppedAreaPixels) return toast.error("Wait for the image preview to finish");
    const locationSource = placeDetailData ?? selectedLocation;
    try {
      setIsUploadingPost(true);
      setUploadPhase("Preparing image");
      const blob = await getCroppedImage();
      const file = new File([blob], `kapota-post-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const media = await uploadMedia({
        file,
        purpose: "post",
        onProgress: ({ phase, percent }) => {
          const label = phase === "uploading" ? `Uploading ${percent}%` : phase;
          setUploadPhase(label);
        },
      });

      setUploadPhase("Publishing post");
      const response = await createPost({
        mediaId: media._id,
        caption,
        location: locationSource
          ? {
            name: locationSource.name,
            type: "Point",
            coordinates: [locationSource.lng, locationSource.lat],
          }
          : null,
        hideLikes,
        disableShare,
        isArchived,
      });

      toast.success(response.message);
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Unable to publish post");
    } finally {
      setIsUploadingPost(false);
      setUploadPhase("");
    }
  };

  const clearImage = () => {
    setImagePreview("");
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AppPage contentClassName="bg-surface">
      <BusyOverlay
        show={isUploadingPost}
        fixed
        label={uploadPhase || "Publishing post"}
      />
      <PageHeader
        title="Create post"
        description="Edit a photo and choose how it will be shared"
        backAction={
          <Button iconOnly size="sm" variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
        }
        actions={
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isUploadingPost}
            disabled={!imagePreview || !croppedAreaPixels}
          >
            Share post
          </Button>
        }
      />

      <div className="grid h-[calc(100vh-80px)] grid-cols-[minmax(520px,1fr)_430px]">
        <section className="flex min-w-0 flex-col overflow-hidden border-r border-line bg-canvas p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Image preview</h2>
              <p className="mt-1 text-xs text-muted">Drag to reposition, then adjust zoom.</p>
            </div>
            {imagePreview && (
              <Button size="sm" variant="dangerGhost" onClick={clearImage}>
                <Trash2 className="size-4" /> Remove
              </Button>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between gap-4">
            <SegmentedControl
              value={ratioType}
              onChange={changeRatio}
              options={[
                { value: "square", label: "1:1" },
                { value: "portrait", label: "4:5" },
                { value: "landscape", label: "16:9" },
              ]}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="size-4" />
              {imagePreview ? "Replace image" : "Upload image"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div
              style={{ width: previewWidths[ratioType] }}
              className={`relative max-h-full overflow-hidden rounded-app border border-line bg-surface shadow-control ${
                ratioType === "square" ? "aspect-square" : ratioType === "landscape" ? "aspect-video" : "aspect-[4/5]"
              }`}
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
                    onCropComplete={(area, pixels) => setCroppedAreaPixels(pixels)}
                    style={{
                      containerStyle: {
                        width: "100%",
                        height: "100%",
                        filter: FILTERS[selectedFilter](filterStrength),
                      },
                    }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-control border border-white/15 bg-black/55 px-3 py-2 text-white backdrop-blur-sm">
                    <span className="text-xs font-medium">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="ui-range"
                    />
                    <span className="w-8 text-right text-xs">{zoom.toFixed(1)}x</span>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={ImagePlus}
                  title="Upload a photo to begin"
                  description="JPG, PNG, or WebP up to 9 MB."
                  action={<Button variant="primary" onClick={() => fileInputRef.current?.click()}>Choose image</Button>}
                  className="h-full"
                />
              )}
            </div>
          </div>
        </section>

        <aside className="ui-scrollbar min-h-0 overflow-y-auto px-6 pb-10">
          <Disclosure icon={SlidersHorizontal} title="Filters" description="Adjust the look of your photo" defaultOpen>
            {!imagePreview ? (
              <div className="rounded-control border border-dashed border-line-strong bg-surface-muted px-4 py-6 text-center text-sm text-muted">
                Choose an image to preview filters.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(FILTERS).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedFilter(name)}
                    className={`relative overflow-hidden rounded-control border p-1.5 text-left transition ${
                      selectedFilter === name ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-hover"
                    }`}
                  >
                    <LoadableImage
                      src={imagePreview}
                      alt={`${name} filter`}
                      className="aspect-square w-full rounded-[4px] object-cover"
                      wrapperClassName="aspect-square w-full rounded-[4px] bg-surface-muted"
                      imgProps={{ style: { filter: FILTERS[name](filterStrength) } }}
                    />
                    <span className="mt-1.5 flex items-center justify-between text-xs font-medium text-ink">
                      {name}
                      {selectedFilter === name && <Check className="size-3.5 text-brand-strong" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedFilter !== "Original" && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>Strength</span>
                  <span>{filterStrength}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterStrength}
                  onChange={(event) => setFilterStrength(Number(event.target.value))}
                  className="ui-range"
                />
              </div>
            )}
          </Disclosure>

          <Disclosure icon={Type} title="Caption" description="Add context to your post" defaultOpen>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              maxLength={2000}
              onChange={(event) => setCaption(event.target.value)}
            />
            <p className="mt-1.5 text-right text-xs text-muted">{caption.length}/2,000</p>
          </Disclosure>

          <Disclosure icon={MapPin} title="Location" description="Attach an optional place">
            <Input
              icon={MapPin}
              type="text"
              placeholder="Search for a location"
              value={locationQuery}
              onChange={(event) => {
                if (selectedLocation) {
                  setSelectedLocation(null);
                  setPlaceDetailData(null);
                }
                setLocationQuery(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              trailing={
                selectedLocation ? (
                  <Button iconOnly size="xs" variant="ghost" onClick={clearSelectedLocation} aria-label="Clear location">
                    <X className="size-4" />
                  </Button>
                ) : (
                  <Button iconOnly size="xs" variant="ghost" onClick={handleSearch} aria-label="Search location">
                    <Search className="size-4" />
                  </Button>
                )
              }
            />

            <div className="mt-3 overflow-hidden rounded-control border border-line">
              <div className="flex items-center justify-between border-b border-line bg-surface-muted px-3 py-2 text-xs text-muted">
                <span>{selectedLocation ? "Selected location" : "Suggestions"}</span>
                <span>{locations.length}</span>
              </div>
              <div className="ui-scrollbar max-h-64 overflow-y-auto">
                <SectionLoader
                  loading={isSearchingLocations}
                  label="Searching locations..."
                  minHeight={120}
                  className="rounded-none border-0 bg-transparent"
                >
                  {locations.length === 0 ? (
                    <p className="px-3 py-5 text-sm text-muted">
                      {locationQuery.trim() ? "No search results found." : "No nearby suggestions available."}
                    </p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {locations.map((suggestion, index) => {
                        if (!suggestion) return null;
                        const types = Array.isArray(suggestion.types) ? suggestion.types : [];
                        return (
                          <li key={`${suggestion.placeId || suggestion.name || "location"}-${index}`} className="p-3 hover:bg-surface-hover">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-ink">{suggestion.name || "Unknown place"}</p>
                                {suggestion.address && <p className="mt-0.5 text-xs leading-5 text-muted">{suggestion.address}</p>}
                              </div>
                              {selectedLocation ? (
                                <Button iconOnly size="xs" variant="dangerGhost" onClick={clearSelectedLocation} aria-label="Remove location">
                                  <X className="size-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => {
                                    skipAutoSearchRef.current = true;
                                    setPlaceDetailData(null);
                                    setSelectedLocation(suggestion);
                                    setLocationQuery(suggestion.name || "");
                                    setSearchSuggestions([]);
                                  }}
                                >
                                  Select
                                </Button>
                              )}
                            </div>
                            {types.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {types.slice(0, 4).map((type) => (
                                  <Badge key={`${type}-${index}`}>{type.replace(/_/g, " ")}</Badge>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </SectionLoader>
              </div>
            </div>
          </Disclosure>

          <Disclosure icon={Settings2} title="Post settings" description="Control visibility and sharing">
            <div className="space-y-4">
              <Switch
                label="Hide like count"
                description="People can still like the post."
                checked={hideLikes}
                onChange={(event) => setHideLikes(event.target.checked)}
              />
              <Switch
                label="Disable sharing"
                description="Prevent sending this post into chats."
                checked={disableShare}
                onChange={(event) => setDisableShare(event.target.checked)}
              />
              <Switch
                label="Archive post"
                description="Keep the post hidden from your public profile."
                checked={isArchived}
                onChange={(event) => setIsArchived(event.target.checked)}
              />
            </div>
          </Disclosure>
        </aside>
      </div>
    </AppPage>
  );
}

export default AddPost;
