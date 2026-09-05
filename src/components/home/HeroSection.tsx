import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { HeroSlide } from '../../types';

export default function HeroSection() {
  const { navigateTo } = useStore();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await fetch('/api/admin/hero-slides');
        const data = await res.json();
        if (data.success && Array.isArray(data.slides)) {
          // Only display active slides, ordered by their 'order' value
          const activeSlides = data.slides
            .filter((slide: HeroSlide) => slide.isActive)
            .sort((a: HeroSlide, b: HeroSlide) => a.order - b.order);
          setSlides(activeSlides);
        }
      } catch (err) {
        console.error('Failed to fetch hero slides:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSlides();
  }, []);

  // Auto-slide effect every 5 seconds, paused when hovering
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const handleIndicatorClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const handleSlideClick = (link: string) => {
    if (link) {
      navigateTo(link);
    }
  };

  // Fallback to static banner if there are no active slides
  if (loading || slides.length === 0) {
    return (
      <section className="w-full bg-slate-50 pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            onClick={() => handleSlideClick('/catalog')}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-500 bg-slate-900 w-full h-36 sm:h-52 md:h-64 lg:h-76 xl:h-[320px] cursor-pointer"
          >
            <img
              src="/images/hero-banner.webp"
              alt="Jersey Mention BD Banner"
              className="w-full h-full object-cover object-center block hover:scale-[1.015] transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <section className="w-full bg-slate-50 pt-6 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => handleSlideClick(currentSlide.link)}
          className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-500 bg-slate-900 w-full h-44 sm:h-56 md:h-68 lg:h-80 xl:h-[360px] cursor-pointer group"
        >
          {/* Slide image background */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-center block transition-all duration-700 ease-in-out group-hover:scale-[1.015]"
              referrerPolicy="no-referrer"
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
          </div>

          {/* Slide Content */}
          <div className="absolute inset-y-0 bottom-0 top-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20 z-10 max-w-xl text-white">
            {currentSlide.badge && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 font-extrabold text-[7px] min-[375px]:text-[8px] sm:text-[10px] px-1.5 py-0.5 min-[375px]:px-2 min-[375px]:py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-emerald-500/30 w-fit mb-1.5 sm:mb-4 uppercase tracking-wider">
                <Sparkles className="w-2 h-2 sm:w-3 sm:h-3" /> {currentSlide.badge}
              </span>
            )}
            <h1 className="text-[13px] min-[375px]:text-[15px] min-[410px]:text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-none min-[375px]:leading-[1.1] sm:leading-tight uppercase drop-shadow-md">
              {currentSlide.title}
            </h1>
            {currentSlide.subtitle && (
              <p className="text-[7px] min-[375px]:text-[8.5px] min-[410px]:text-[9px] sm:text-xs text-slate-300 mt-1 sm:mt-2 line-clamp-2 max-w-md drop-shadow-xs leading-snug sm:leading-relaxed">
                {currentSlide.subtitle}
              </p>
            )}
            <div className="mt-2.5 sm:mt-6">
              <button 
                className={`bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-full transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md border-none ${
                  currentSlide.buttonText === 'CUSTOMIZE NOW'
                    ? 'text-[7.5px] min-[375px]:text-[8.5px] sm:text-xs px-2.5 py-1 sm:px-5 sm:py-2.5'
                    : 'text-[8px] min-[375px]:text-[9px] sm:text-xs px-3.5 py-1.5 sm:px-5 sm:py-2.5'
                }`}
              >
                <span>{currentSlide.buttonText || 'SHOP NOW'}</span>
              </button>
            </div>
          </div>

          {/* Left/Right Navigation Arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white border-none flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 animate-in fade-in"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white border-none flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 animate-in fade-in"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Indicators / Progress dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleIndicatorClick(idx, e)}
                  className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all duration-300 ${
                    idx === currentIndex
                      ? 'bg-emerald-500 w-5 sm:w-6'
                      : 'bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
