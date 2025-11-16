'use client';

export default function ReferendumVoting() {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Main Proposal Card */}
            <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl md:p-8">
              <h1
                className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
                style={{ fontFamily: 'Handjet, monospace' }}
              >
                Ratify Approved Referendum #1768 - execution error due to AH migration
              </h1>

              <div className="space-y-6 text-white/80" style={{ fontFamily: 'Handjet, monospace' }}>
                <div>
                  <p className="mb-2">
                    <span className="font-bold text-white">Context:</span> This proposal ratifies the payment for already-approved referendum{' '}
                    <a href="#1768" className="text-[#FF00FF] hover:text-[#FF1493]">#1768</a>, which failed to execute due to a technical error during the Asset Hub migration.
                  </p>
                </div>

                <div>
                  <p className="mb-2">
                    <span className="font-bold text-white">Background:</span> Referendum #1768 was successfully approved by the community for Chaotic's critical NFT infrastructure maintenance. However, the execution failed because Asset Rates were not correctly configured after the Asset Hub migration.
                  </p>
                </div>

                <div>
                  <p className="mb-2">
                    <span className="font-bold text-white">Resolution:</span> After consultation with the Web3 Foundation, Parity, and the Polkassembly team, we are submitting this ratification proposal to ensure the approved funding reaches its intended destination. The underlying Asset Rates issue is being resolved through referendum{' '}
                    <a href="#1787" className="text-[#FF00FF] hover:text-[#FF1493]">#1787</a>.
                  </p>
                </div>

                <div>
                  <p className="mb-2 font-bold text-white">Technical Details:</p>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>
                      Original referendum:{' '}
                      <a href="#1768" className="text-[#FF00FF] hover:text-[#FF1493]">#1768</a>{' '}
                      (approved)...
                    </li>
                  </ul>
                </div>
              </div>

              {/* Show More Button */}
              <button
                className="mt-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white/80 backdrop-blur-xl transition hover:bg-white/20"
                style={{ fontFamily: 'Handjet, monospace' }}
              >
                Show More
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Action Buttons */}
              <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-6">
                <div className="flex gap-3">
                  <button className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                  <button className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-3">
                  <button className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6 rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl md:p-8">
              <h2
                className="mb-4 text-2xl font-bold text-white md:text-3xl"
                style={{ fontFamily: 'Handjet, monospace' }}
              >
                Comments <span className="text-white/80">(0)</span>
              </h2>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-xl">
                <p className="text-white/80" style={{ fontFamily: 'Handjet, monospace' }}>
                  Please{' '}
                  <a href="#login" className="text-[#FF00FF] hover:text-[#FF1493]">Login</a>{' '}
                  to comment
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Login to Vote Button */}
            <button
              className="w-full rounded-3xl border border-[#FF00FF] bg-gradient-to-r from-[#FF00FF] to-[#FF1493] px-8 py-4 text-xl font-bold text-white transition hover:from-[#FF1493] hover:to-[#FF00FF]"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Login to Vote
            </button>

            {/* Requested Section */}
            <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  Requested
                </h3>
                <button className="text-[#FF00FF] hover:text-[#FF1493]">
                  Details →
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <span
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  180.00K USDC
                </span>
              </div>
            </div>

            {/* Voting Period Section */}
            <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  Voting Period
                </h3>
                <button className="text-[#FF00FF] hover:text-[#FF1493]">+</button>
              </div>

              {/* Decision Period */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#FF00FF]"></div>
                  <div className="h-2 w-2 rounded-full bg-[#FF00FF]"></div>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-full bg-white/20"></div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Decision Period
                  </span>
                  <span
                    className="text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    2 / 28 days
                  </span>
                </div>
              </div>

              {/* Confirmation Period */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-full bg-white/20"></div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Confirmation Period
                  </span>
                  <span
                    className="text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    0 / 4 days
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
              <h3
                className="mb-6 text-xl font-bold text-white"
                style={{ fontFamily: 'Handjet, monospace' }}
              >
                Summary
              </h3>

              <div className="mb-2 text-center">
                <span
                  className="text-sm text-white/80"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  Threshold: 97.6%
                </span>
              </div>

              {/* Voting Gauge */}
              <div className="relative mb-6 flex items-end justify-center" style={{ height: '100px', overflow: 'hidden' }}>
                {/* Semi-circle gauge */}
                <svg viewBox="0 0 200 100" style={{ width: '200px', height: '100px', maxWidth: '100%' }}>
                  {/* Background arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  {/* Aye arc (100%) */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#ayeGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="ayeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00FF88" />
                      <stop offset="100%" stopColor="#00FF88" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Vote percentages */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ fontFamily: 'Handjet, monospace', color: '#00FF88' }}
                  >
                    100.0%
                  </div>
                  <div
                    className="text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Aye
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl font-bold text-[#FF1493]"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    0.0%
                  </div>
                  <div
                    className="text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Nay
                  </div>
                </div>
              </div>

              {/* Vote details */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div>
                  <div
                    className="mb-1 text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Aye (9)
                  </div>
                  <div
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    48.0K DOT
                  </div>
                  <div
                    className="text-xs text-white/60"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Support
                  </div>
                  <div
                    className="mt-2 text-lg font-bold text-white"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    1279K DOT
                  </div>
                </div>
                <div>
                  <div
                    className="mb-1 text-sm text-white/80"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Nay (0)
                  </div>
                  <div
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    0.0 DOT
                  </div>
                  <div
                    className="text-xs text-white/60"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    Issuance
                  </div>
                  <div
                    className="mt-2 text-lg font-bold text-white"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    1.6B DOT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
