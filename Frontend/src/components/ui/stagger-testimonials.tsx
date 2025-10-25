"use client";

import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

interface StaggerTestimonialsProps {
  testimonials: Testimonial[];
}

export function StaggerTestimonials({ testimonials }: StaggerTestimonialsProps) {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger animation for each card
            testimonials.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index]);
              }, index * 200); // 200ms delay between each card
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [testimonials]);

  return (
    <div ref={containerRef} className="grid md:grid-cols-3 gap-8">
      {testimonials.map((testimonial, index) => (
        <Card
          key={index}
          className={`p-8 space-y-6 transition-all duration-700 hover:shadow-lg hover:scale-105 ${
            visibleCards.includes(index)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
          style={{
            transitionDelay: visibleCards.includes(index) ? "0ms" : `${index * 200}ms`,
          }}
        >
          {/* Star Rating */}
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 transition-all duration-300 ${
                  visibleCards.includes(index)
                    ? "fill-cyan-400 text-cyan-400 scale-100"
                    : "fill-none text-muted scale-0"
                }`}
                style={{
                  transitionDelay: visibleCards.includes(index)
                    ? `${(index * 200) + (i * 50)}ms`
                    : "0ms",
                }}
              />
            ))}
          </div>

          {/* Quote */}
          <p className="text-foreground italic leading-relaxed">"{testimonial.quote}"</p>

          {/* Author */}
          <div className="border-t border-border pt-4">
            <p className="font-semibold text-foreground">{testimonial.author}</p>
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
