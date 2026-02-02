import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Camera,
  Image,
  Mail,
  User,
  User2Icon,
  UserPen,
  ViewIcon,
} from "lucide-react";
import PreviewImg from "../components/PreviewImg";

function Profile() {
  const { authUser, isUpdateProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [preview, setPreview] = useState(false);

  const handleProfilePic = async (e) => {
    e.preventDefault();
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async()=>{
      const base64Image = reader.result
      setSelectedImg(base64Image)
      await updateProfile({profilePic:base64Image})
    }
  };
  return (
    <div className="h-screen pt-20">
      {!preview && (
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
                  src={selectedImg || authUser.profilePic.url}
                  alt="Profile"
                  className="size-32 rounded-full object-cover border-4 "
                />
                <div className="fab absolute bottom-0 -right-2">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-lg btn-circle"
                  >
                    <UserPen
                      className={`size-10 text-base-200 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdateProfile ? "animate-pulse pointer-events-none" : ""}`}
                    />
                  </div>
                  <div className="flex md:flex-nowrap flex-wrap absolute left-12 bottom-0">
                    <button
                      onClick={() => setPreview(true)}
                      className="btn btn-lg btn-circle"
                    >
                      <ViewIcon className="size-6" />
                    </button>
                    <button className="btn btn-lg btn-circle">
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
                    <button className="btn btn-lg btn-circle">
                      <User2Icon className="size-6" />
                    </button>
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
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                  {authUser?.fullname}
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
      )}
      {preview && (
        <PreviewImg detail={authUser} onclose={() => setPreview(false)} />
      )}
    </div>
  );
}

export default Profile;
