'use client';

import { useAllProposalsWithStats } from '../hooks/useProposals';
import type { ProposalWithVoteStats } from '../api/types';
import BrandedLoader from './BrandedLoader';

interface ProposalCardProps {
  proposal: ProposalWithVoteStats;
  onClick: () => void;
}

function ProposalCard({ proposal, onClick }: ProposalCardProps) {
  const { voteStats } = proposal;
  const progress = (voteStats.enscribedVoters / voteStats.maximalNumberOfVoters) * 100;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,0,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Title */}
      <h3
        className="mb-3 text-xl font-bold text-white"
        style={{ fontFamily: 'Handjet, monospace' }}
      >
        {proposal.polkassemblyTitle}
      </h3>

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
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-sm text-white/70">
          <span>Voters Inscribed</span>
          <span>
            {voteStats.enscribedVoters} / {voteStats.maximalNumberOfVoters}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Vote Stats */}
      {voteStats.votedVoters > 0 && (
        <div className="flex gap-4 text-sm text-white/70">
          <span>Voted: {voteStats.votedVoters}</span>
          <span>Yes Votes: {voteStats.yesVotes}</span>
        </div>
      )}

      {/* Contract Address */}
      <div className="mt-3 text-xs text-white/50">
        Contract: {proposal.paseoVoteContractAddress.slice(0, 6)}...
        {proposal.paseoVoteContractAddress.slice(-4)}
      </div>
    </div>
  );
}

interface ProposalListProps {
  onSelectProposal?: (id: number) => void;
}

export default function ProposalList({ onSelectProposal }: ProposalListProps) {
  const { data: proposals, isLoading, error } = useAllProposalsWithStats();

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
          Error Loading Proposals
        </h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 p-12 text-center">
        <p className="text-white/70" style={{ fontFamily: 'Handjet, monospace' }}>
          No proposals available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2
        className="mb-4 text-2xl font-bold text-white"
        style={{ fontFamily: 'Handjet, monospace' }}
      >
        All Proposals ({proposals.length})
      </h2>
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onClick={() => onSelectProposal?.(proposal.id)}
        />
      ))}
    </div>
  );
}
