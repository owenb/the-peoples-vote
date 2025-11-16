'use client';

import { useState } from 'react';
import { useProposalFull } from '../hooks/useProposals';
import MarkdownContent from './MarkdownContent';

interface ProposalDetailProps {
  proposalId: number;
}

export default function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const { data: proposal, isLoading, error } = useProposalFull(proposalId);
  const [showFullContent, setShowFullContent] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/70" style={{ fontFamily: 'Handjet, monospace' }}>
          Loading proposal...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        <h3 className="mb-2 font-bold" style={{ fontFamily: 'Handjet, monospace' }}>
          Error Loading Proposal
        </h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 p-12 text-center">
        <p className="text-white/70" style={{ fontFamily: 'Handjet, monospace' }}>
          Proposal not found
        </p>
      </div>
    );
  }

  const { voteStats, arkivContent } = proposal;

  // 👇 Safe fallback when voteStats is null
  const stats = voteStats ?? {
    isInscriptionOpen: false,
    isVotingOpen: false,
    isFinalized: false,
    enscribedVoters: 0,
    maximalNumberOfVoters: 0,
    votedVoters: 0,
    yesVotes: 0,
    finalVote: null as boolean | null,
  };

  // Split content for preview (find a good break point)
  const PREVIEW_LENGTH = 1000;
  const contentPreview = arkivContent.slice(0, PREVIEW_LENGTH);
  const hasMoreContent = arkivContent.length > PREVIEW_LENGTH;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl md:p-8">
          {/* Title */}
          <h1
            className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {proposal.polkassemblyTitle}
          </h1>

          {/* Arkiv Content - Styled Markdown */}
          <div className="max-w-none">
            <MarkdownContent content={showFullContent ? arkivContent : contentPreview} />
          </div>

          {/* Show More Button */}
          {hasMoreContent && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="mt-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white/80 backdrop-blur-xl transition hover:bg-white/20"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              {showFullContent ? 'Show Less' : 'Show More'}
              <svg
                className={`h-5 w-5 transition-transform ${showFullContent ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}

          {/* Links */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={proposal.polkassemblyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl transition hover:bg-white/20"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              View on Polkassembly →
            </a>
            <a
              href={proposal.arkivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl transition hover:bg-white/20"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              View on Arkiv →
            </a>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Vote Status Card */}
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
          <h2
            className="mb-4 text-xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            Vote Status
          </h2>

          {/* Status Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {stats.isInscriptionOpen && (
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
                Inscription Open
              </span>
            )}
            {stats.isVotingOpen && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                Voting Open
              </span>
            )}
            {stats.isFinalized && (
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
                Finalized
              </span>
            )}
            {!voteStats && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                No on-chain stats yet
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-4">
            {/* Inscription Progress */}
            <div>
              <div className="mb-2 flex justify-between text-sm text-white/70">
                <span>Inscribed Voters</span>
                <span>
                  {stats.enscribedVoters} / {stats.maximalNumberOfVoters}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] transition-all"
                  style={{
                    width:
                      stats.maximalNumberOfVoters > 0
                        ? `${(stats.enscribedVoters / stats.maximalNumberOfVoters) * 100}%`
                        : '0%',
                  }}
                />
              </div>
            </div>

            {/* Voting Progress */}
            {stats.enscribedVoters > 0 && (
              <div>
                <div className="mb-2 flex justify-between text-sm text-white/70">
                  <span>Votes Cast</span>
                  <span>
                    {stats.votedVoters} / {stats.enscribedVoters}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{
                      width:
                        stats.enscribedVoters > 0
                          ? `${(stats.votedVoters / stats.enscribedVoters) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vote Results */}
          {stats.votedVoters > 0 && (
            <div className="mt-4 space-y-2 border-t border-white/20 pt-4">
              <div className="flex justify-between text-sm text-white/70">
                <span>Yes Votes</span>
                <span className="font-bold text-green-400">{stats.yesVotes}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>No Votes</span>
                <span className="font-bold text-red-400">
                  {stats.votedVoters - stats.yesVotes}
                </span>
              </div>
            </div>
          )}

          {/* Final Result */}
          {stats.isFinalized && stats.finalVote !== null && (
            <div className="mt-4 rounded-lg bg-white/10 p-3 text-center">
              <div className="text-xs text-white/50">Final Result</div>
              <div
                className={`text-xl font-bold ${
                  stats.finalVote ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {stats.finalVote ? 'PASSED' : 'REJECTED'}
              </div>
            </div>
          )}

          {/* Contract Address */}
          <div className="mt-4 border-t border-white/20 pt-4">
            <div className="text-xs text-white/50">Vote Contract</div>
            <div
              className="mt-1 break-all text-sm text-white/70"
              style={{ fontFamily: 'monospace' }}
            >
              {proposal.paseoVoteContractAddress}
            </div>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
          <h2
            className="mb-4 text-xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            Metadata
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-white/50">Polkassembly ID</div>
              <div className="text-white/80">#{proposal.polkassemblyId}</div>
            </div>
            <div>
              <div className="text-white/50">Status</div>
              <div className="text-white/80">{proposal.polkassemblyStatus}</div>
            </div>
            <div>
              <div className="text-white/50">Track</div>
              <div className="text-white/80">{proposal.polkassemblyTrack}</div>
            </div>
            <div>
              <div className="text-white/50">Created</div>
              <div className="text-white/80">
                {new Date(proposal.polkassemblyCreatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
