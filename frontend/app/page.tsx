'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import ProposalList from './components/ProposalList';
import ProposalDetail from './components/ProposalDetail';
import {
  XXNetwork,
  XXDirectMessages,
  XXMsgSender,
  XXDirectMessagesReceived,
} from '../lib/mixnet/xxdk';


export default function Home() {
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(1); // Default to first proposal

  return (
    <XXNetwork>
      <XXDirectMessages>
        <main className="min-h-screen px-4 py-8 md:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {/* Header with Wallet Connect */}
            <div className="mb-8 flex items-center justify-between">
              <h1
                className="text-2xl font-bold text-white md:text-3xl"
                style={{ fontFamily: 'Handjet, monospace' }}
              >
                The People's Vote
              </h1>
              <ConnectButton />
            </div>

            {/* Main Content */}
            {selectedProposalId ? (
              <>
                <button
                  onClick={() => setSelectedProposalId(null)}
                  className="mb-6 flex items-center gap-2 text-white/70 hover:text-white"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to All Proposals
                </button>
                <ProposalDetail proposalId={selectedProposalId} />
              </>
            ) : (
              <ProposalList onSelectProposal={setSelectedProposalId} />
            )}

            {/* ─────────────────────────────────────────────
                xxdk Mixnet DM Panel
               ───────────────────────────────────────────── */}
            <section className="mt-12 grid gap-4 md:grid-cols-2">
              {/* Received messages */}
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <h2
                  className="mb-3 text-lg font-bold text-white"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  Mixnet Direct Messages (Inbox)
                </h2>
                <div className="max-h-64 space-y-1 overflow-y-auto text-sm text-white/80 [overflow-anchor:none]">
                  <XXDirectMessagesReceived />
                  <div id="anchor2" className="h-1 [overflow-anchor:auto]" />
                </div>
              </div>

              {/* Sender */}
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <h2
                  className="mb-3 text-lg font-bold text-white"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  Send Mixnet Message
                </h2>
                <div className="flex items-center gap-3">
                  <XXMsgSender />
                </div>
              </div>
            </section>
          </div>
        </main>
      </XXDirectMessages>
    </XXNetwork>
  );
}
