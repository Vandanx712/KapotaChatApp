import { useState } from "react";
import {
  CalendarDays,
  Image,
  Mail,
  Save,
  ShieldCheck,
  SmileIcon,
  User,
  User2Icon,
  UserPen,
  ViewIcon,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import "react-photo-view/dist/react-photo-view.css";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { getAvatars } from "../lib/axios";
import BusyOverlay from "../components/common/BusyOverlay";
import SectionLoader from "../components/common/SectionLoader";
import { AppPage, PageHeader, PageSection } from "../components/layout/AppPage";
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Tooltip,
} from "../components/ui";

function Profile() {
  const {
    authUser,
    isUpdateProfile,
    isProfilePhotoUploading,
    isProfileDetailsUpdating,
    updateProfile,
    updateDetails,
  } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const [selectedImg, setSelectedImg] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [isAvatarListLoading, setIsAvatarListLoading] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [showPicker, setShowPicker] = useState("");
  const [profile, setProfile] = useState({
    fullname: authUser?.fullname || "",
    bio: authUser?.bio || "",
  });

  const onEmojiClick = (emojiData) => {
    const field = showPicker === "fullname" ? "fullname" : "bio";
    setProfile((current) => ({
      ...current,
      [field]: `${current[field]}${emojiData.emoji}`,
    }));
  };

  const loadavatars = async () => {
    if (avatars.length > 0) return;
    try {
      setIsAvatarListLoading(true);
      const response = await getAvatars({ gender: authUser?.gender });
      setAvatars(response.avatars || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load avatars");
    } finally {
      setIsAvatarListLoading(false);
    }
  };

  const handleProfilePic = async (event) => {
    event.preventDefault();
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
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({
        profilePic: base64Image,
        oldkey: authUser?.profilePic?.key || "",
      });
    };
  };

  const handleProfileAvatar = async (avatar) => {
    try {
      await updateProfile({ picUrl: avatar });
      setSelectedImg(avatar.url);
      setIsAvatarPickerOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update avatar");
    }
  };

  const handleProfileUpdate = () => {
    if (profile.fullname === authUser?.fullname && profile.bio === authUser?.bio) return;
    if (!profile.fullname || !profile.bio) return toast.error("Full name and bio are required");
    if (profile.fullname.length > 20) return toast.error("Full name must be less than 20 characters");
    if (profile.bio.length > 40) return toast.error("Bio must be less than 40 characters");
    updateDetails(profile);
  };

  const profileImage = selectedImg || authUser?.profilePic?.url;
  const hasProfileChanges =
    profile.fullname !== authUser?.fullname || profile.bio !== authUser?.bio;

  return (
    <PhotoProvider>
      <AppPage contentClassName="bg-surface">
      <PageHeader
        title="Your profile"
        description="Manage how people see you across Kapota"
        actions={
          <Button
            variant="primary"
            onClick={handleProfileUpdate}
            loading={isProfileDetailsUpdating}
            disabled={!hasProfileChanges || isUpdateProfile}
          >
            <Save className="size-4" />
            Save changes
          </Button>
        }
      />

      <div className="grid min-h-[calc(100vh-80px)] grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-r border-line bg-surface-muted p-8">
          <div className="sticky top-8 flex flex-col items-center text-center">
            <div className="relative">
              <BusyOverlay
                show={isProfilePhotoUploading}
                label="Uploading photo..."
                className="rounded-full"
              />
              <Avatar
                src={profileImage}
                alt={authUser?.fullname || "Profile"}
                size="2xl"
                className="ring-2 ring-brand/25 ring-offset-4 ring-offset-surface-muted"
              />
              <Button
                iconOnly
                size="sm"
                variant="primary"
                className="absolute -bottom-1 -right-1 rounded-full"
                onClick={() => document.getElementById("profile-photo-upload")?.click()}
                disabled={isUpdateProfile}
                aria-label="Upload profile photo"
              >
                <Image className="size-4" />
              </Button>
              <input
                id="profile-photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleProfilePic}
                disabled={isUpdateProfile}
              />
            </div>

            <h2 className="mt-6 text-lg font-semibold text-ink">{authUser?.fullname}</h2>
            <p className="mt-1 max-w-60 text-sm leading-6 text-muted">{authUser?.bio}</p>
            <Badge variant="success" className="mt-4">
              <ShieldCheck className="size-3.5" /> Active account
            </Badge>

            <div className="mt-6 flex items-center gap-1">
              <Tooltip label="View photo" side="bottom">
                <PhotoView src={profileImage}>
                  <Button
                    iconOnly
                    size="sm"
                    variant="ghost"
                    disabled={!profileImage}
                    aria-label="View profile photo"
                  >
                    <ViewIcon className="size-4" />
                  </Button>
                </PhotoView>
              </Tooltip>

              <Tooltip label="Choose avatar" side="bottom">
                <Button
                  iconOnly
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAvatarPickerOpen(true);
                    loadavatars();
                  }}
                  aria-label="Choose avatar"
                >
                  <User2Icon className="size-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </aside>

        <div className="px-10 py-4">
          <PageSection
            title="Profile details"
            description="Your name and bio are visible to people you message."
          >
            <div className="max-w-2xl space-y-5">
              <Field label="Full name" hint={`${profile.fullname.length}/20 characters`} htmlFor="profile-fullname">
                <Input
                  id="profile-fullname"
                  icon={User}
                  value={profile.fullname}
                  maxLength={20}
                  onChange={(event) => setProfile({ ...profile, fullname: event.target.value })}
                  trailing={
                    <Button iconOnly size="xs" variant="ghost" onClick={() => setShowPicker("fullname")} aria-label="Add emoji to name">
                      <SmileIcon className="size-4" />
                    </Button>
                  }
                />
              </Field>

              <Field label="Bio" hint={`${profile.bio.length}/40 characters`} htmlFor="profile-bio">
                <Input
                  id="profile-bio"
                  icon={UserPen}
                  value={profile.bio}
                  maxLength={40}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  trailing={
                    <Button iconOnly size="xs" variant="ghost" onClick={() => setShowPicker("bio")} aria-label="Add emoji to bio">
                      <SmileIcon className="size-4" />
                    </Button>
                  }
                />
              </Field>
            </div>
          </PageSection>

          <PageSection title="Account information" description="Read-only details associated with this account.">
            <dl className="max-w-2xl divide-y divide-line rounded-app border border-line">
              <div className="flex items-center gap-3 px-4 py-3">
                <Mail className="size-4 text-subtle" />
                <dt className="w-36 text-sm text-muted">Email address</dt>
                <dd className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{authUser?.email}</dd>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CalendarDays className="size-4 text-subtle" />
                <dt className="w-36 text-sm text-muted">Member since</dt>
                <dd className="text-sm font-medium text-ink">{authUser?.createdAt?.split("T")[0]}</dd>
              </div>
            </dl>
          </PageSection>
        </div>
      </div>

      <Modal
        open={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        title="Choose an avatar"
        description="Select a profile image for your Kapota account."
        size="md"
      >
        <SectionLoader
          loading={isAvatarListLoading}
          label="Loading avatars..."
          minHeight={220}
          className="border-0 bg-transparent"
        >
          <div className="grid grid-cols-4 justify-items-center gap-4 py-1">
            {avatars.map((avatar) => (
              <button
                key={avatar.url}
                type="button"
                onClick={() => handleProfileAvatar(avatar)}
                disabled={isProfilePhotoUploading}
                aria-label="Use this avatar"
                aria-pressed={authUser?.profilePic?.url === avatar.url}
                className={`rounded-full border-2 p-1 transition ${
                  authUser?.profilePic?.url === avatar.url
                    ? "border-brand bg-brand-soft"
                    : "border-transparent hover:border-line-strong hover:bg-surface-hover"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Avatar src={avatar.url} alt="Avatar option" size="lg" />
              </button>
            ))}
          </div>
        </SectionLoader>
      </Modal>

      <Modal
        open={Boolean(showPicker)}
        onClose={() => setShowPicker("")}
        title={`Add emoji to ${showPicker === "fullname" ? "name" : "bio"}`}
        size="sm"
        className="w-auto"
      >
        <div className="overflow-hidden rounded-control border border-line">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={theme}
            autoFocusSearch={true}
            width={350}
            height={400}
            lazyLoadEmojis={true}
          />
        </div>
      </Modal>
      </AppPage>
    </PhotoProvider>
  );
}

export default Profile;
