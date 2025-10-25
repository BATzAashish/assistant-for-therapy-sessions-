import { useEffect, useState } from "react";

interface WelcomeBookAnimationProps {
  onAnimationComplete: () => void;
}

const WelcomeBookAnimation = ({ onAnimationComplete }: WelcomeBookAnimationProps) => {
  const [stage, setStage] = useState<"initial" | "opening" | "showing" | "closing" | "complete">("initial");

  useEffect(() => {
    // Animation timeline - only runs once on mount
    const timers = [
      setTimeout(() => setStage("opening"), 300),      // Start opening the book
      setTimeout(() => setStage("showing"), 1800),     // Book fully open, show text
      setTimeout(() => setStage("closing"), 4000),     // Start closing
      setTimeout(() => {
        setStage("complete");
        onAnimationComplete();
      }, 5300), // Complete and trigger scroll
    ];

    return () => timers.forEach(clearTimeout);
  }, [onAnimationComplete]);

  if (stage === "complete") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Book Container */}
      <div className="relative perspective-1000">
        {/* Book */}
        <div className={`relative w-[800px] h-[550px] max-w-[90vw] max-h-[70vh] ${stage === "initial" ? "scale-50 opacity-0" : "scale-100 opacity-100"} transition-all duration-700`}>
          {/* Left Page */}
          <div
            className={`absolute left-0 w-1/2 h-full bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950 rounded-l-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl origin-right transition-all duration-[1500ms] ease-in-out ${
              stage === "opening" || stage === "showing" ? "rotate-y-[-170deg]" : ""
            } ${
              stage === "closing" ? "rotate-y-[0deg]" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* Book spine shadow */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-indigo-300/40 dark:from-indigo-700/40 to-transparent" />
            
            {/* Left page content - visible when book opens (on the back side) */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center p-10"
            >
              <div className={`text-center space-y-6 transition-opacity duration-500 ${
                (stage === "opening" || stage === "showing") ? "opacity-100" : "opacity-0"
              }`}>
                <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 dark:from-indigo-400 dark:via-blue-400 dark:to-indigo-300 animate-gradient-x leading-tight pb-2">
                  Hello!
                </h1>
                <p className="text-3xl font-medium text-gray-700 dark:text-gray-200 pb-2">
                  Welcome to
                </p>
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent pb-4">
                  TherapyHub
                </p>
                <div className="mt-8 flex gap-3 justify-center pt-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-400 dark:from-blue-400 dark:to-indigo-300 rounded-full animate-bounce delay-100" />
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-blue-600 dark:from-indigo-300 dark:to-blue-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Page */}
          <div
            className={`absolute right-0 w-1/2 h-full bg-gradient-to-l from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950 rounded-r-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl origin-left transition-all duration-[1500ms] ease-in-out ${
              stage === "opening" || stage === "showing" ? "rotate-y-[170deg]" : ""
            } ${
              stage === "closing" ? "rotate-y-[0deg]" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* Book spine shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-l from-indigo-300/40 dark:from-indigo-700/40 to-transparent" />
            
            {/* Right page content - visible when book opens (on the back side) */}
            <div 
              className="absolute inset-0 flex items-center justify-center p-8"
            >
              <div className={`text-center space-y-4 transition-opacity duration-500 ${
                (stage === "opening" || stage === "showing") ? "opacity-100" : "opacity-0"
              }`}>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Powered by AI
                </div>
                <div className="text-base text-gray-700 dark:text-gray-200 leading-relaxed px-4">
                  Real-time AI assistant<br/>for therapy sessions
                </div>
              </div>
            </div>
          </div>

          {/* Book Spine - Center */}
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-b from-indigo-400 via-blue-500 to-indigo-400 dark:from-indigo-600 dark:via-blue-700 dark:to-indigo-600 z-10 shadow-xl">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
          </div>

          {/* Center Glow Effect */}
          {(stage === "opening" || stage === "showing") && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
          )}
        </div>

        {/* Floating particles around the book */}
        {(stage === "showing") && (
          <>
            <div className="absolute top-10 left-10 w-5 h-5 bg-indigo-400/40 dark:bg-indigo-500/30 rounded-full animate-float-up" />
            <div className="absolute top-20 right-20 w-4 h-4 bg-blue-400/40 dark:bg-blue-500/30 rounded-full animate-float-up delay-300" />
            <div className="absolute bottom-10 left-20 w-4 h-4 bg-indigo-300/40 dark:bg-indigo-400/30 rounded-full animate-float-up delay-500" />
            <div className="absolute bottom-20 right-10 w-5 h-5 bg-blue-500/40 dark:bg-blue-600/30 rounded-full animate-float-up delay-700" />
          </>
        )}
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        .rotate-y-\\[-160deg\\] {
          transform: rotateY(-160deg);
        }

        .rotate-y-\\[160deg\\] {
          transform: rotateY(160deg);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-float-up {
          animation: float-up 2s ease-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
};

export default WelcomeBookAnimation;
