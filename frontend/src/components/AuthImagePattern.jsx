const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md flex flex-col items-center text-center">
        {/* Pigeon */}
        <div className="relative pigeon-float">
          <svg
            viewBox="0 0 100 100"
            className="size-28 md:size-64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body */}
            <ellipse cx="50" cy="55" rx="20" ry="15" className="fill-primary" />

            {/* Head */}
            <circle cx="68" cy="45" r="10" className="fill-primary" />

            {/* Eye */}
            <circle cx="72" cy="43" r="2" className="fill-neutral" />

            {/* Beak */}
            <path d="M78 45 L85 47 L77 49 Z" className="fill-secondary" />

            {/* Tail */}
            <path d="M30 55 L15 50 L15 60 Z" className="fill-secondary" />

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
            <ellipse cx="55" cy="58" rx="8" ry="6" className="fill-secondary" />
          </svg>
        </div>

        <h2 className="text-2xl animate-text-fade font-bold mb-4">{title}</h2>
        <p className="text-primary/50">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
