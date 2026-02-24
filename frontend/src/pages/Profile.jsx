import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Image,
  Mail,
  Pen,
  SmileIcon,
  User,
  User2Icon,
  UserPen,
  ViewIcon,
} from "lucide-react";
import { getAvatars } from "../lib/axios";
import toast from "react-hot-toast";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import EmojiPicker from "emoji-picker-react";

function Profile() {
  const { authUser, isUpdateProfile, updateProfile, updateDetails } =
    useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [showPicker, setShowPicker] = useState("");
  const [profile, setProfile] = useState({
    fullname: authUser.fullname,
    bio: authUser.bio,
  });

  const onEmojiClick = (emojiData) => {
    showPicker == "fullname"
      ? setProfile({ ...profile, fullname: profile.fullname + emojiData.emoji })
      : setProfile({ ...profile, bio: profile.bio + emojiData.emoji });
  };

  const loadavatars = async () => {
    if (avatars.length > 0) return;
    try {
      const resdata = await getAvatars({ gender: authUser.gender });
      setAvatars(resdata.avatars);
    } catch (error) {
      console.log(error);
    }
  };

  const handleProfilePic = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({
        profilePic: base64Image,
        oldkey: authUser.profilePic?.key ? authUser.profilePic?.key : "",
      });
    };
  };

  const handleProfileAvatar = async (avatar) => {
    try {
      await updateProfile({ picUrl: avatar });
      setSelectedImg(avatar.url);
    } catch (error) {
      toast.error(error.response.data.message);
      console.log(error);
    }
  };

  const handleProfileUpdate = () => {
    if (profile.fullname === authUser.fullname && profile.bio === authUser.bio)
      return;
    if (!profile.fullname || !profile.bio)
      return toast.error("Fullname and Bio are required");
    if (profile.fullname.length > 20)
      return toast.error("Fullname must be less than 20 characters");
    if (profile.bio.length > 40)
      return toast.error("Bio must be less than 40 characters");
    updateDetails(profile);
  };
  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser?.profilePic.url}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <div className="fab">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-md btn-circle"
                >
                  <UserPen
                    className={`size-10 text-base-200 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdateProfile ? "animate-pulse pointer-events-none" : ""}`}
                  />
                </div>
                <div className="flex md:space-x-1 md:space-y-0 space-x-1 space-y-1 md:flex-nowrap flex-wrap absolute left-12 bottom-0">
                  <PhotoProvider>
                    <PhotoView src={selectedImg || authUser.profilePic?.url}>
                      <button className="btn btn-md btn-circle">
                        <ViewIcon className="size-6" />
                      </button>
                    </PhotoView>
                  </PhotoProvider>

                  <button className="btn btn-md btn-circle">
                    <label htmlFor="avatar-upload">
                      <Image className=" size-6" />
                      <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleProfilePic}
                        disabled={isUpdateProfile}
                      />
                    </label>
                  </button>
                  <div className="dropdown dropdown-end ">
                    <button
                      tabIndex={0}
                      onClick={() => loadavatars()}
                      role="button"
                      className="btn btn-md btn-circle"
                    >
                      <User2Icon className="size-6" />
                    </button>
                    <div
                      tabIndex={0}
                      className="dropdown-content rounded-box mt-5 bg-base-200 p-2 border border-primary space-y-5"
                    >
                      <label className="text-sm font-medium text-muted-foreground px-1">
                        Choose an avatar
                      </label>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
                        {avatars.map((avatar) => (
                          <button
                            key={avatar.url}
                            type="button"
                            onClick={() => handleProfileAvatar(avatar)}
                            className={`flex-shrink-0 w-14 h-14 rounded-xl transition-all ${
                              authUser.profilePic.url === avatar.url
                                ? "mt-1 ring-2 ring-primary ring-offset-2 ring-offset-card"
                                : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={avatar.url}
                              alt="Avatar option"
                              className="w-full h-full rounded-xl"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdateProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 flex justify-between py-2.5 bg-base-200 rounded-lg border">
                <input
                  type="text"
                  value={profile.fullname}
                  onChange={(e) => {
                    setProfile({ ...profile, fullname: e.target.value })
                  }}
                  className="w-full bg-inherit focus:outline-none"
                />
                <div className=" flex items-center gap-2">
                  <SmileIcon
                    onClick={() => setShowPicker("fullname")}
                    className="size-5 cursor-pointer"
                    size={20}
                  />
                 <button disabled={authUser.fullname==profile.fullname}>
                    <Pen
                      onClick={handleProfileUpdate}
                      className="size-5 cursor-pointer"
                    />
                  </button>
                </div>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <UserPen className="w-4 h-4" />
                Bio
              </div>
              <p className="px-4 flex justify-between py-2.5 bg-base-200 rounded-lg border">
                <input
                  type="text"
                  onChange={(e) => {
                    setProfile({ ...profile, bio: e.target.value })
                  }}
                  className="w-full bg-inherit focus:outline-none"
                  value={profile.bio}
                />
                <div className=" flex items-center gap-2">
                  <SmileIcon
                    onClick={() => setShowPicker("bio")}
                    className="size-5 cursor-pointer"
                    size={20}
                  />
                  <button disabled={authUser.bio==profile.bio}>
                    <Pen
                      onClick={handleProfileUpdate}
                      className="size-5 cursor-pointer"
                    />
                  </button>
                </div>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPicker && (
        <>
          {/* Dark Backdrop: Closes picker when clicking anywhere else */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowPicker("")}
          />

          {/* Centered Picker Container */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]">
            <div className="shadow-2xl border border-base-300 rounded-xl overflow-hidden scale-95 md:scale-100 animate-in zoom-in duration-200">
              <EmojiPicker
                onEmojiClick={(emojiData, event) => {
                  onEmojiClick(emojiData, event);
                }}
                theme="dark"
                autoFocusSearch={true}
                width={window.innerWidth < 450 ? 280 : 350}
                height={400}
                lazyLoadEmojis={true}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
