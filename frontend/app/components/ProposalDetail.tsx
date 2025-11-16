'use client';

import { useState } from 'react';
import type { Abi, Address } from 'viem';

import { useIntegratedProposal } from '../hooks/useIntegratedProposal';
import MarkdownContent from './MarkdownContent';
import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';
import { VoteActionButtons } from './VoteActionButtons';
import ArkivChat from './ArkivChat';
import BrandedLoader from './BrandedLoader';

interface ProposalDetailProps {
  proposalId: number;
}

export default function ProposalDetail({ proposalId }: ProposalDetailProps) {
  // Use integrated hook instead of just backend data
  const { proposal, isLoading, error, refetch } = useIntegratedProposal(proposalId);
  const [showFullContent, setShowFullContent] = useState(false);

  const scrollToContent = () => {
    const contentElement = document.getElementById('proposal-content');
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate random anonymous name on mount
  const [userName] = useState(() => {
    const adjectives = ['Swift', 'Bright', 'Bold', 'Quick', 'Silent', 'Wise', 'Brave', 'Calm', 'Clever', 'Noble'];
    const nouns = ['Voter', 'Citizen', 'Delegate', 'Member', 'Participant', 'Observer', 'Advocate', 'Supporter'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    return `${randomAdj}${randomNoun}${randomNum}`;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BrandedLoader />
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

  // Vote contract wiring for buttons
  const voteAbi = (VoteJson as any).abi as Abi;
  const voteAddress = proposal.paseoVoteContractAddress as Address;

  // Split content for preview (find a good break point)
  const PREVIEW_LENGTH = 1000;
  const contentPreview = arkivContent.slice(0, PREVIEW_LENGTH);
  const hasMoreContent = arkivContent.length > PREVIEW_LENGTH;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 animate-slide-in-left">
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl md:p-8 hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,255,0.2)]">
          {/* Title */}
          <h1
            className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {proposal.polkassemblyTitle}
          </h1>

          {/* Arkiv Content - Styled Markdown */}
          <div id="proposal-content" className="max-w-none">
            <MarkdownContent content={showFullContent ? arkivContent : contentPreview} />
          </div>

          {/* Show More Button */}
          {hasMoreContent && (
            <button
              onClick={() => {
                setShowFullContent(!showFullContent);
                if (!showFullContent) {
                  // Scroll to content after state update
                  setTimeout(scrollToContent, 100);
                }
              }}
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
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6 animate-slide-in-right">
        {/* Vote Status Card */}
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)]">
          <h2
            className="mb-4 text-xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            Vote Status
          </h2>

          {/* Status Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {voteStats.isInscriptionOpen && (
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
                Inscription Open
              </span>
            )}
            {voteStats.isVotingOpen && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                Voting Open
              </span>
            )}
            {voteStats.isFinalized && (
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
                Finalized
              </span>
            )}
            {proposal.isUserRegistered && (
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300 flex items-center gap-1 animate-fade-in">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                You're Registered
              </span>
            )}
            {proposal.hasUserVoted && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 flex items-center gap-1 animate-fade-in">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                You Voted
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
                  {voteStats.enscribedVoters} / {voteStats.maximalNumberOfVoters}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] transition-all"
                  style={{
                    width: `${proposal.votingProgress}%`,
                  }}
                />
              </div>
            </div>

            {/* Voting Progress */}
            {voteStats.enscribedVoters > 0 && (
              <div>
                <div className="mb-2 flex justify-between text-sm text-white/70">
                  <span>Votes Cast</span>
                  <span>
                    {proposal.votesCount} / {voteStats.enscribedVoters}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{
                      width:
                        voteStats.enscribedVoters > 0
                          ? `${(proposal.votesCount / voteStats.enscribedVoters) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vote Results - ONLY SHOW AFTER VOTING IS COMPLETE */}
          {voteStats.isFinalized && voteStats.votedVoters > 0 && (
            <div className="mt-4 space-y-2 border-t border-white/20 pt-4">
              <div className="flex justify-between text-sm text-white/70">
                <span>Yes Votes</span>
                <span className="font-bold text-green-400">{voteStats.yesVotes}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>No Votes</span>
                <span className="font-bold text-red-400">
                  {voteStats.votedVoters - voteStats.yesVotes}
                </span>
              </div>
            </div>
          )}

          {/* Privacy Message While Voting In Progress */}
          {!voteStats.isFinalized && voteStats.votedVoters > 0 && (
            <div className="mt-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <svg className="h-5 w-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-semibold">Votes are encrypted</span>
              </div>
              <p className="mt-1 text-xs text-purple-200/70">
                All votes remain private until everyone has voted. Results will be revealed only after voting is complete.
              </p>
            </div>
          )}

          {/* Final Result */}
          {voteStats.isFinalized && voteStats.finalVote !== null && (
            <div className="mt-4 rounded-lg bg-white/10 p-3 text-center">
              <div className="text-xs text-white/50">Final Result</div>
              <div
                className={`text-xl font-bold ${
                  voteStats.finalVote ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {voteStats.finalVote ? 'PASSED' : 'REJECTED'}
              </div>
            </div>
          )}

          {/* Vote Action Buttons - NOW FULLY FUNCTIONAL */}
          <div className="mt-6 border-t border-white/20 pt-4">
            <VoteActionButtons
              voteAddress={voteAddress}
              voteAbi={voteAbi}
              canRegister={proposal.canUserRegister}
              canVote={proposal.canUserVote}
              hasVoted={proposal.hasUserVoted}
              isComplete={proposal.isVotingComplete}
              onSuccess={refetch} // Refresh data after successful action
            />
          </div>

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

        {/* Voters List */}
        {voteStats.voters.length > 0 && (
          <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            <h2
              className="mb-4 text-xl font-bold text-white"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Registered Voters ({voteStats.voters.length})
            </h2>
            <div className="space-y-2">
              {voteStats.voters.map((voter, idx) => (
                <div
                  key={`voter-${idx}-${voter.address}`}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs"
                >
                  <span className="font-mono text-white/70">
                    {voter.address.slice(0, 6)}...{voter.address.slice(-4)}
                  </span>
                  {voter.hasVoted && (
                    <span className="text-green-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Voted
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Card */}
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)]">
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

      {/* Chat Section - Full Width */}
      <div className="lg:col-span-3 animate-slide-in-up">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="text-xl font-bold text-white"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Discussion
            </h2>
            <span className="text-xs text-white/40">{userName}</span>
          </div>
          <div className="h-[400px] rounded-xl border border-white/10 bg-black/20">
            <ArkivChat roomId={`proposal-${proposalId}`} userName={userName} />
          </div>
          <p className="mt-2 text-xs text-white/30">
            Messages expire after 1 minute
          </p>
        </div>
      </div>
    </div>
  );
}
