'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SliderProps {
  children: React.ReactNode[];
  autoplayInterval?: number; // milliseconds, 0 or undefined for no autoplay
  duration?: number; // milliseconds for slide transition, default 500
  className?: string; // Additional classes for the main slider container
}

export function Slider({ children, autoplayInterval = 0, duration = 500, className }: SliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideCount = React.Children.count(children);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = (index: number) => {
    setCurrentSlide((index + slideCount) % slideCount);
  };

  const goToNextSlide = () => {
    goToSlide(currentSlide + 1);
  };

  const goToPrevSlide = () => {
    goToSlide(currentSlide - 1);
  };

  // Autoplay effect
  useEffect(() => {
    if (autoplayInterval > 0 && slideCount > 1) {
      autoplayRef.current = setInterval(() => {
        goToNextSlide();
      }, autoplayInterval);
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [currentSlide, autoplayInterval, slideCount]);

  // Pause autoplay on hover (optional, but good UX)
  const handleMouseEnter = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (autoplayInterval > 0 && slideCount > 1) {
      autoplayRef.current = setInterval(() => {
        goToNextSlide();
      }, autoplayInterval);
    }
  };

  const transitionStyle = `transform ${duration}ms ease-in-out motion-reduce:transition-none`;

  return (
    <section
      className={`section relative overflow-hidden ${className ?? ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-roledescription="carousel"
      aria-label="Image Slider"
    >
      <div
        className="flex"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
          transition: transitionStyle,
          width: `${slideCount * 100}%` // Ensure the container is wide enough for all slides side-by-side
        }}
      >
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slideCount}`}
          >
            {child}
          </div>
        ))}
      </div>

      {slideCount > 1 && (
        <>
          {/* Previous button */}
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-subtle/50 text-ink hover:bg-subtle/70 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
            onClick={goToPrevSlide}
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          {/* Next button */}
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-subtle/50 text-ink hover:bg-subtle/70 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
            onClick={goToNextSlide}
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </>
      )}

      {/* Pagination dots */}
      {slideCount > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {Array.from({ length: slideCount }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`w-3 h-3 rounded-full transition-colors duration-300 ease-in-out ${idx === currentSlide ? 'bg-brand' : 'bg-ink/50 hover:bg-ink'} focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface`}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
