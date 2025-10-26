import React from "react";

export const BeamsBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="beam1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="rgb(99, 102, 241)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="rgb(168, 85, 247)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="rgb(34, 211, 238)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
          </linearGradient>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* Light beams */}
        <g filter="url(#blur)">
          {/* Beam 1 */}
          <path
            d="M 150 0 L 100 100 L 150 100 L 200 0 Z"
            fill="url(#beam1)"
            className="animate-beam-1"
          />
          {/* Beam 2 */}
          <path
            d="M 350 0 L 320 100 L 360 100 L 390 0 Z"
            fill="url(#beam2)"
            className="animate-beam-2"
          />
          {/* Beam 3 */}
          <path
            d="M 600 0 L 550 100 L 600 100 L 650 0 Z"
            fill="url(#beam3)"
            className="animate-beam-3"
          />
          {/* Beam 4 */}
          <path
            d="M 850 0 L 820 100 L 860 100 L 890 0 Z"
            fill="url(#beam4)"
            className="animate-beam-4"
          />
          {/* Beam 5 */}
          <path
            d="M 1100 0 L 1050 100 L 1100 100 L 1150 0 Z"
            fill="url(#beam1)"
            className="animate-beam-5"
          />
          {/* Beam 6 */}
          <path
            d="M 1350 0 L 1320 100 L 1360 100 L 1390 0 Z"
            fill="url(#beam2)"
            className="animate-beam-6"
          />
        </g>

        {/* Extended beams for longer sections */}
        <g filter="url(#blur)" opacity="0.5">
          <rect x="140" y="100" width="70" height="100%" fill="url(#beam1)" />
          <rect x="340" y="100" width="60" height="100%" fill="url(#beam2)" />
          <rect x="590" y="100" width="70" height="100%" fill="url(#beam3)" />
          <rect x="840" y="100" width="60" height="100%" fill="url(#beam4)" />
          <rect x="1090" y="100" width="70" height="100%" fill="url(#beam1)" />
          <rect x="1340" y="100" width="60" height="100%" fill="url(#beam2)" />
        </g>
      </svg>

      {/* Additional glow effects */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/5 via-indigo-500/5 to-transparent dark:from-blue-400/10 dark:via-indigo-400/10" />
      
      <style>{`
        @keyframes beam-fade {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-beam-1 {
          animation: beam-fade 4s ease-in-out infinite;
        }
        .animate-beam-2 {
          animation: beam-fade 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-beam-3 {
          animation: beam-fade 4.5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-beam-4 {
          animation: beam-fade 5.5s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .animate-beam-5 {
          animation: beam-fade 4s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-beam-6 {
          animation: beam-fade 5s ease-in-out infinite;
          animation-delay: 2.5s;
        }
      `}</style>
    </div>
  );
};
