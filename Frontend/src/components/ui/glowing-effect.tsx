"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  className?: string;
}

const GlowingEffect = memo(({ className }: GlowingEffectProps) => {
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!glowRef.current) return;
    
    const card = glowRef.current.parentElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    glowRef.current.style.setProperty("--mouse-x", `${x}px`);
    glowRef.current.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  useEffect(() => {
    const card = glowRef.current?.parentElement;
    if (!card) return;

    card.addEventListener("mousemove", handleMouseMove);
    return () => card.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div
      ref={glowRef}
      className={cn(
        "pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-0 transition-opacity duration-500",
        "before:absolute before:inset-0 before:rounded-[inherit]",
        "before:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(59,130,246,0.4),transparent_40%)]",
        "group-hover:opacity-100",
        className
      )}
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        } as React.CSSProperties
      }
    />
  );
});

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
