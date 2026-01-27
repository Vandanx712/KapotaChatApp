import React, { useEffect } from "react";
import { refresh } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../socket/socket";
import '../index.css'

function Loding() {
  useEffect(() => {
    refreshAccount();
  }, []);

  const navigate = useNavigate();

  const refreshAccount = () => {
    setTimeout(async() => {
      try {
        const data = await refresh({});
        sessionStorage.setItem("token", data.user.token);
        connectSocket(data.user.token);
        navigate("/home");
      } catch (error) {
        console.log(error);
        if (error.response?.data?.success === false) navigate("/login");
      }
    }, 3000);
  };
  return (
    <>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden">
        {/* Pigeon */}
        <div className="relative pigeon-float">
          <svg
            viewBox="0 0 100 100"
            className="w-36 h-36 md:w-44 md:h-44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body */}
            <ellipse cx="50" cy="55" rx="20" ry="15" className="fill-primary" />

            {/* Head */}
            <circle cx="68" cy="45" r="10" className="fill-primary" />

            {/* Eye */}
            <circle cx="72" cy="43" r="2" className="fill-background" />

            {/* Beak */}
            <path d="M78 45 L85 47 L77 49 Z" className="fill-accent" />

            {/* Tail */}
            <path d="M30 55 L15 50 L15 60 Z" className="fill-primary" />

            {/* Left Wing */}
            <g className="wing-left">
              <path
                d="M45 50 Q35 30 25 35 Q30 45 40 55 Z"
                className="fill-primary"
              />
            </g>

            {/* Right Wing */}
            <g className="wing-right">
              <path
                d="M55 50 Q60 25 70 30 Q65 45 55 55 Z"
                className="fill-primary"
              />
            </g>

            {/* Chest */}
            <ellipse cx="55" cy="58" rx="8" ry="6" className="fill-muted" />
          </svg>
        </div>

        {/* Text */}
        <p className="mt-10 text-muted-foreground text-base md:text-lg font-medium tracking-wide text-center loading-text">
          Conversations, carried with care
          <span className="loading-dots">...</span>
        </p>
      </div>
    </>
  );
}

export default Loding;
