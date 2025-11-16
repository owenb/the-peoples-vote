'use client';

import { useState } from 'react';
import ArkivChat from '../components/ArkivChat';
import SynthwaveBackground from '../components/SynthwaveBackground';

export default function ChatPage() {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('general');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    if (userName.trim()) {
      setIsJoined(true);
    }
  };

  if (!isJoined) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <SynthwaveBackground />

        <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl">
            <h1
              className="mb-2 text-center text-4xl font-bold text-white"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Arkiv Chat
            </h1>
            <p className="mb-8 text-center text-white/60">
              Real-time messaging powered by Arkiv Network
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your name..."
                  className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-white/40 focus:bg-white/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Chat Room
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40 focus:bg-white/20"
                >
                  <option value="general">General</option>
                  <option value="proposals">Proposals</option>
                  <option value="governance">Governance</option>
                  <option value="tech">Tech Talk</option>
                </select>
              </div>

              <button
                onClick={handleJoin}
                disabled={!userName.trim()}
                className="w-full rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ fontFamily: 'Handjet, monospace' }}
              >
                Join Chat
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-xs text-white/70">
                <strong className="text-blue-300">How it works:</strong>
                <br />
                Messages are stored on Arkiv Network and delivered in real-time via WebSocket subscriptions.
                Your backend server signs and submits messages anonymously. Messages expire after 1 minute.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SynthwaveBackground />

      <div className="relative z-10 flex min-h-screen flex-col p-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Welcome, {userName}!
            </h1>
            <p className="text-white/60">Room: {roomId}</p>
          </div>
          <button
            onClick={() => setIsJoined(false)}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
          >
            Leave Chat
          </button>
        </div>

        <div className="flex-1">
          <ArkivChat roomId={roomId} userName={userName} />
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-white/50">
            Powered by{' '}
            <a
              href="https://arkiv.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Arkiv Network
            </a>
            {' '}• Messages expire in 1 minute • Privacy-preserving chat
          </p>
        </div>
      </div>
    </div>
  );
}
