import React from "react";
import { useAuthStore } from "../store/useAuthStore";

function Navbar() {
  const { authUser } = useAuthStore();
  return <div></div>;
}

export default Navbar;
