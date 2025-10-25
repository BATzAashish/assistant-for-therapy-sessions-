import { useEffect, useRef, useState } from "react";
import { useTheme } from "./theme-provider";
import { Lightbulb } from "lucide-react";

const LightPullThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 150;
  const MAX_PULL = 250;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        scrollTop.current = window.scrollY;
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, MAX_PULL));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > PULL_THRESHOLD) {
        setTheme(theme === "light" ? "dark" : "light");
      }
      setIsDragging(false);
      setPullDistance(0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.clientY;
        scrollTop.current = window.scrollY;
        setIsDragging(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || window.scrollY > 0) return;

      const distance = Math.max(0, e.clientY - startY.current);
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, MAX_PULL));
      }
    };

    const handleMouseUp = () => {
      if (pullDistance > PULL_THRESHOLD) {
        setTheme(theme === "light" ? "dark" : "light");
      }
      setIsDragging(false);
      setPullDistance(0);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, pullDistance, theme, setTheme]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const bulbOpacity = theme === "dark" ? 1 : pullProgress;
  const isLightOn = theme === "dark";

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      style={{
        transform: `translate(-50%, ${Math.min(pullDistance * 0.5, MAX_PULL * 0.5)}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* String/Chain */}
        <div
          className="w-0.5 bg-gradient-to-b from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-400"
          style={{
            height: `${pullDistance * 0.8}px`,
            transition: isDragging ? "none" : "height 0.3s ease-out",
          }}
        />

        {/* Light Bulb */}
        <div
          className={`relative transition-all duration-300 ${
            pullDistance > PULL_THRESHOLD ? "scale-110" : "scale-100"
          }`}
          style={{
            opacity: bulbOpacity,
            filter: isLightOn ? "drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))" : "none",
          }}
        >
          {/* Glow effect when on */}
          {isLightOn && (
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-400/30 rounded-full blur-2xl animate-pulse" />
            </div>
          )}

          <Lightbulb
            className={`w-12 h-12 transition-all duration-300 ${
              isLightOn
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-400 fill-transparent"
            }`}
          />
        </div>

        {/* Hint text */}
        {pullDistance > 0 && pullDistance < PULL_THRESHOLD && (
          <div
            className="mt-4 text-sm text-muted-foreground opacity-0 animate-fade-in"
            style={{
              opacity: pullProgress,
            }}
          >
            Pull to switch theme
          </div>
        )}

        {pullDistance >= PULL_THRESHOLD && (
          <div className="mt-4 text-sm font-semibold text-primary animate-bounce">
            Release to switch!
          </div>
        )}
      </div>
    </div>
  );
};

export default LightPullThemeSwitcher;
