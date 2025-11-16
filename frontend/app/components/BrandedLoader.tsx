'use client';

export default function BrandedLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Animated Logo/Icon */}
      <div className="relative">
        {/* Outer Ring */}
        <div
          className="h-24 w-24 rounded-full border-4 border-transparent border-t-[#FF00FF] border-r-[#00FFFF]"
          style={{
            animation: 'spin 1.5s linear infinite',
          }}
        />

        {/* Inner Ring */}
        <div
          className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#FFD700] border-l-[#7B68EE]"
          style={{
            animation: 'spin-reverse 2s linear infinite',
          }}
        />

        {/* Center Dot */}
        <div
          className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, #FF00FF 0%, #00FFFF 100%)',
            animation: 'pulse-glow 2s ease-in-out infinite',
            boxShadow: '0 0 20px #FF00FF, 0 0 40px #00FFFF',
          }}
        />
      </div>

      {/* Loading Text */}
      <div className="flex items-center gap-2">
        <span
          className="text-lg font-bold text-white"
          style={{
            fontFamily: 'Handjet, monospace',
            textShadow: '0 0 10px rgba(255, 0, 255, 0.5)',
          }}
        >
          Loading
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-white"
              style={{
                animation: `dot-bounce 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
