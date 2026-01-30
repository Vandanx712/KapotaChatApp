import React from "react";
import { useAuthStore } from "../store/useAuthStore";

function Profile() {
  const { authUser } = useAuthStore();
  return <div></div>;
}

export default Profile;
