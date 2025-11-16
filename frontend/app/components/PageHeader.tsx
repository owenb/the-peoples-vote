'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-slide-in-up">
      <div className="relative">
        {/* Glowing background effect */}
        <div
          className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
          style={{
            background: 'linear-gradient(90deg, #FF00FF 0%, #00FFFF 50%, #FFD700 100%)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
        />

        {/* Content */}
        <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl md:p-8">
          <div className="flex items-center gap-4">
            {/* Logo Icon */}
            <div className="relative h-16 w-16 flex-shrink-0">
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FF00FF] border-r-[#00FFFF]"
                style={{ animation: 'spin 3s linear infinite' }}
              />
              <div
                className="absolute inset-1 rounded-full border-2 border-transparent border-b-[#FFD700] border-l-[#7B68EE]"
                style={{ animation: 'spin-reverse 4s linear infinite' }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #FF00FF 0%, #00FFFF 100%)',
                  boxShadow: '0 0 15px #FF00FF, 0 0 30px #00FFFF',
                }}
              />
            </div>

            {/* Text */}
            <div className="flex-1">
              <h1
                className="text-3xl font-bold text-white md:text-4xl lg:text-5xl"
                style={{
                  fontFamily: 'Handjet, monospace',
                  textShadow: '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-white/70 md:text-base">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Bottom accent line */}
          <div
            className="mt-4 h-1 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #FF00FF 0%, #00FFFF 50%, #FFD700 100%)',
              boxShadow: '0 0 10px rgba(255, 0, 255, 0.5)',
            }}
          />
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
      `}</style>
    </div>
  );
}
