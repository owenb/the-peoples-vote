'use client';

import { useEffect, useState } from 'react';

// Deterministic random generator for consistent SSR/client rendering
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateStars = (isMobile: boolean) => {
  // Fewer stars on mobile for performance
  const count = isMobile ? 8 : 15;
  return [...Array(count)].map((_, i) => ({
    width: seededRandom(i * 3) * 3 + 1,
    height: seededRandom(i * 3 + 1) * 3 + 1,
    left: seededRandom(i * 3 + 2) * 100,
    top: seededRandom(i * 3 + 3) * 60,
    color: ['#FFD700', '#FF00FF', '#7B68EE', '#FFF'][Math.floor(seededRandom(i * 3 + 4) * 4)],
    boxShadow: seededRandom(i * 3 + 5) * 10 + 5,
    animationDuration: seededRandom(i * 3 + 6) * 3 + 2,
    animationDelay: seededRandom(i * 3 + 7) * 2,
  }));
};

const generateParticles = (isMobile: boolean) => {
  // Fewer particles on mobile
  const count = isMobile ? 4 : 8;
  return [...Array(count)].map((_, i) => ({
    left: seededRandom(i * 5) * 100,
    size: seededRandom(i * 5 + 1) * 4 + 2,
    duration: seededRandom(i * 5 + 2) * 5 + 8,
    delay: seededRandom(i * 5 + 3) * 5,
    color: ['#FF00FF', '#7B68EE', '#FFD700'][Math.floor(seededRandom(i * 5 + 4) * 3)],
  }));
};

const generateDataStreams = (isMobile: boolean) => {
  // Fewer data streams on mobile
  const count = isMobile ? 3 : 5;
  return [...Array(count)].map((_, i) => ({
    left: seededRandom(i * 7) * 100,
    width: seededRandom(i * 7 + 1) * 2 + 1,
    duration: seededRandom(i * 7 + 2) * 3 + 3,
    delay: seededRandom(i * 7 + 3) * 4,
    color: ['#FF00FF', '#00FFFF'][Math.floor(seededRandom(i * 7 + 4) * 2)],
  }));
};

export default function SynthwaveBackground() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stars, setStars] = useState<ReturnType<typeof generateStars>>([]);
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const [dataStreams, setDataStreams] = useState<ReturnType<typeof generateDataStreams>>([]);

  useEffect(() => {
    // Detect mobile on mount
    const checkMobile = () => window.innerWidth < 768;
    const mobile = checkMobile();
    setIsMobile(mobile);

    // Generate elements based on device
    setStars(generateStars(mobile));
    setParticles(generateParticles(mobile));
    setDataStreams(generateDataStreams(mobile));
    setMounted(true);

    // Update on resize
    const handleResize = () => {
      const nowMobile = checkMobile();
      if (nowMobile !== mobile) {
        setIsMobile(nowMobile);
        setStars(generateStars(nowMobile));
        setParticles(generateParticles(nowMobile));
        setDataStreams(generateDataStreams(nowMobile));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
    <div className="pointer-events-none fixed inset-0">
      {/* Static Gradient Background - Paused State (Pink/Purple) */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'linear-gradient(-45deg, #FF1493, #FF00FF, #7B68EE, #9370DB, #FF1493)',
          backgroundSize: '600% 600%',
          opacity: isPlaying ? 0 : 1,
          transition: 'opacity 1s ease-in-out',
          transform: 'translateZ(0)'
        }}
      />

      {/* Animated Gradient Background - Playing State (Multi-Color) */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'linear-gradient(-45deg, #FFD700, #FF8C00, #FF1493, #FF00FF, #7B68EE, #FFD700)',
          backgroundSize: '600% 600%',
          animation: 'gradient-shift 10s ease infinite',
          animationPlayState: isPlaying ? 'running' : 'paused',
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          willChange: 'background-position, opacity',
          transform: 'translateZ(0)'
        }}
      />

      {/* Grid Overlay */}
      <div
        className="fixed inset-0 z-10 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.15) 2px, transparent 2px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 2px, transparent 2px)
          `,
          backgroundSize: '60px 60px',
          animation: 'grid-move 1s linear infinite',
          animationPlayState: isPlaying ? 'running' : 'paused',
          transition: 'opacity 1s ease-in-out',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      />

      {/* Stars Background */}
      {mounted && (
        <div className="fixed inset-0 z-5" style={{ contain: 'layout style paint' }}>
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${star.width}px`,
                height: `${star.height}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                background: star.color,
                boxShadow: `0 0 ${star.boxShadow}px currentColor`,
                animation: `twinkle ${star.animationDuration}s ease-in-out infinite ${star.animationDelay}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
                transition: 'opacity 1s ease-in-out',
                willChange: 'opacity, transform',
                transform: 'translateZ(0)'
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Particles */}
      {mounted && (
        <div className="fixed inset-0 z-5" style={{ contain: 'layout style paint' }}>
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${particle.left}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: particle.color,
                boxShadow: `0 0 15px ${particle.color}`,
                animation: `float-up ${particle.duration}s linear infinite ${particle.delay}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
                transition: 'opacity 1s ease-in-out',
                opacity: 0.5,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
            />
          ))}
        </div>
      )}

      {/* Data Streams */}
      {mounted && (
        <div className="fixed inset-0 z-5" style={{ contain: 'layout style paint' }}>
          {dataStreams.map((stream, i) => (
            <div
              key={i}
              className="absolute top-0"
              style={{
                left: `${stream.left}%`,
                width: `${stream.width}px`,
                height: '100vh',
                background: `linear-gradient(to bottom, transparent, ${stream.color}, transparent)`,
                boxShadow: `0 0 8px ${stream.color}`,
                animation: `data-stream ${stream.duration}s linear infinite ${stream.delay}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
                transition: 'opacity 1s ease-in-out',
                transformOrigin: 'top',
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
            />
          ))}
        </div>
      )}

      {/* Synthwave Floor */}
      <div
        className="fixed bottom-0 left-0 right-0 z-15 overflow-hidden"
        style={{
          height: isMobile ? '40vh' : '50vh',
          perspective: isMobile ? '300px' : '500px',
          perspectiveOrigin: '50% 50%'
        }}
      >
        {/* Glowing Sun on Horizon */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: isMobile ? '120px' : '200px',
            height: isMobile ? '120px' : '200px',
            top: isMobile ? '5%' : '10%',
            zIndex: 1
          }}
        >
          {/* Light Beams from Sun - Hidden on mobile for performance */}
          {!isMobile && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: '600px',
                height: '600px',
                animation: 'beam-rotate 20s linear infinite',
                animationPlayState: isPlaying ? 'running' : 'paused',
                transition: 'opacity 1s ease-in-out',
                opacity: 0.25,
                willChange: 'transform',
                transform: 'translateZ(0)'
              }}
            >
              {[0, 90, 180, 270].map((angle) => (
                <div
                  key={angle}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 origin-top"
                  style={{
                    width: '3px',
                    height: '300px',
                    background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.7), transparent)',
                    transform: `rotate(${angle}deg)`
                  }}
                />
              ))}
            </div>
          )}

          {/* Sun Core - Reduced shadow complexity */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: isPlaying
                ? 'radial-gradient(circle, #FFD700 0%, #FF8C00 30%, #FF1493 60%, transparent 70%)'
                : 'radial-gradient(circle, #FF00FF 0%, #FF1493 30%, #7B68EE 60%, transparent 70%)',
              animation: 'sun-pulse 4s ease-in-out infinite',
              animationPlayState: isPlaying ? 'running' : 'paused',
              transition: 'background 1s ease-in-out, opacity 1s ease-in-out',
              boxShadow: isPlaying
                ? '0 0 80px #FFD700, 0 0 160px #FF8C00'
                : '0 0 80px #FF00FF, 0 0 160px #FF1493',
              willChange: 'transform, opacity',
              transform: 'translateZ(0)'
            }}
          />
          {/* Sun Rings - Fewer on mobile */}
          {(isMobile ? [0, 1] : [0, 1, 2]).map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: `${100 + i * 40}%`,
                height: `${100 + i * 40}%`,
                border: isPlaying
                  ? '2px solid rgba(255, 105, 180, 0.3)'
                  : '2px solid rgba(255, 0, 255, 0.3)',
                animation: `sun-pulse ${4 + i * 0.5}s ease-in-out infinite ${i * 0.2}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
                transition: 'border-color 1s ease-in-out, opacity 1s ease-in-out',
                boxShadow: isPlaying
                  ? '0 0 15px rgba(255, 105, 180, 0.4)'
                  : '0 0 15px rgba(255, 0, 255, 0.4)',
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
            />
          ))}
        </div>

        {/* Grid Floor with Perspective */}
        <div
          className="absolute inset-0"
          style={{
            transform: 'rotateX(75deg)',
            transformOrigin: 'bottom center',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Horizontal Grid Lines - Removed expensive filters and extra animations */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255, 0, 255, 0.7) 49px, rgba(255, 0, 255, 0.7) 51px)',
              backgroundSize: '100% 100px',
              animation: 'floor-move 2s linear infinite',
              animationPlayState: isPlaying ? 'running' : 'paused',
              boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)',
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          />
          {/* Vertical Grid Lines - Removed expensive filters and extra animations */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(123, 104, 238, 0.7) 79px, rgba(123, 104, 238, 0.7) 81px)',
              backgroundSize: '160px 100%',
              animation: 'floor-move 2s linear infinite',
              animationPlayState: isPlaying ? 'running' : 'paused',
              boxShadow: '0 0 30px rgba(123, 104, 238, 0.5)',
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          />
          {/* Center Highlight Line */}
          <div
            className="absolute inset-x-0 top-1/2 h-1"
            style={{
              background: 'linear-gradient(90deg, transparent, #FF00FF 20%, #7B68EE 50%, #FF00FF 80%, transparent)',
              boxShadow: '0 0 20px #FF00FF, 0 0 40px #7B68EE',
              animation: 'grid-pulse 2s ease-in-out infinite',
              animationPlayState: isPlaying ? 'running' : 'paused'
            }}
          />
          {/* Gradient Fade to Horizon */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(10, 0, 21, 0.3) 50%, rgba(10, 0, 21, 0.9) 100%)'
            }}
          />
        </div>

        {/* Horizon Glow - Reduced blur */}
        <div
          className="absolute inset-x-0 top-[15%] h-32"
          style={{
            background: 'linear-gradient(to bottom, rgba(255, 105, 180, 0.3), rgba(138, 43, 226, 0.2), transparent)',
            filter: 'blur(10px)',
            willChange: 'opacity',
            transform: 'translateZ(0)'
          }}
        />
      </div>

      {/* Retro Scanlines - Simplified */}
      <div
        className="fixed inset-0 z-25"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0px, transparent 2px)',
          backgroundSize: '100% 4px',
          opacity: 0.2,
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      />

      {/* Vignette Effect */}
      <div
        className="fixed inset-0 z-26"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.5) 100%)',
          mixBlendMode: 'multiply',
          willChange: 'opacity'
        }}
      />

      {/* Dark Overlay for Better Text Contrast */}
      <div className="fixed inset-0 z-20 bg-black/40" />

      {/* Bottom Gradient Fade */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(10, 0, 21, 0.8), transparent)',
          willChange: 'opacity'
        }}
      />
    </div>

    {/* Animation Control Button */}
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPlaying(!isPlaying);
      }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-full font-bold text-base uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      style={{
        fontFamily: "'Handjet', monospace",
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
    >
      {isPlaying ? '⏸ Pause' : '▶ Play'}
    </button>
    </>
  );
}
