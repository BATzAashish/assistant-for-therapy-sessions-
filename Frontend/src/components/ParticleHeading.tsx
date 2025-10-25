import { useRef, useEffect, useState } from "react";
import ParticleText from "./ParticleText";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface ParticleHeadingProps {
  children: React.ReactNode;
  particleText: string;
  className?: string;
  particleClassName?: string;
  fontSize?: number;
  particleColor?: string;
}

const ParticleHeading = ({
  children,
  particleText,
  className = "",
  particleClassName = "h-24 md:h-32",
  fontSize = 50,
  particleColor = "59, 130, 246",
}: ParticleHeadingProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const isInView = useIntersectionObserver({
    ref: sectionRef,
    threshold: 0.3,
    triggerOnce: false,
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setShowParticles(true);
      setHasAnimated(true);
    } else if (isInView && hasAnimated) {
      // Re-trigger animation on scroll back
      setShowParticles(false);
      setTimeout(() => setShowParticles(true), 50);
    }
  }, [isInView]);

  return (
    <div ref={sectionRef} className={className}>
      {showParticles && (
        <div className="flex justify-center mb-4">
          <ParticleText
            text={particleText}
            className={particleClassName}
            fontSize={fontSize}
            particleColor={particleColor}
          />
        </div>
      )}
      {children}
    </div>
  );
};

export default ParticleHeading;
