import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

interface MarqueeTestimonialsProps {
  testimonials: Testimonial[];
}

export function MarqueeTestimonials({ testimonials }: MarqueeTestimonialsProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Split testimonials into two rows
  const midpoint = Math.ceil(testimonials.length / 2);
  const firstRow = testimonials.slice(0, midpoint);
  const secondRow = testimonials.slice(midpoint);

  return (
    <div className="relative w-full overflow-hidden">
      {/* First Row - Left to Right */}
      <div className="mb-8">
        <div
          className="flex gap-6 animate-marquee-left"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Duplicate testimonials for seamless loop */}
          {[...firstRow, ...firstRow].map((testimonial, index) => (
            <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      {/* Second Row - Right to Left */}
      <div>
        <div
          className="flex gap-6 animate-marquee-right"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Duplicate testimonials for seamless loop */}
          {[...secondRow, ...secondRow].map((testimonial, index) => (
            <TestimonialCard key={`row2-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      {/* Gradient Overlays */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="flex-shrink-0 w-[400px] p-8 space-y-6 hover:shadow-xl transition-shadow duration-300">
      {/* Star Rating */}
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-cyan-400 text-cyan-400" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-foreground italic leading-relaxed min-h-[120px]">
        "{testimonial.quote}"
      </p>

      {/* Author */}
      <div className="border-t border-border pt-4">
        <p className="font-semibold text-foreground">{testimonial.author}</p>
        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
      </div>
    </Card>
  );
}
