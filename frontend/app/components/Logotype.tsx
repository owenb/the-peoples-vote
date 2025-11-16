'use client';

interface LogotypeProps {
  className?: string;
  onClick?: () => void;
}

export default function Logotype({ className = '', onClick }: LogotypeProps) {
  return (
    <h1
      className={`text-2xl font-bold text-white md:text-3xl ${onClick ? 'cursor-pointer hover:text-white/80 transition-colors' : ''} ${className}`}
      style={{ fontFamily: 'Handjet, monospace' }}
      onClick={onClick}
    >
      The People's Vote
    </h1>
  );
}
