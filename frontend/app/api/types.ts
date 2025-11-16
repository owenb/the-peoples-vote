/**
 * Backend API Type Definitions
 *
 * These types match the backend API responses from opengov-mirror-server
 */

export interface Proposal {
  id: number;
  polkassemblyId: number;
  polkassemblyTitle: string;
  polkassemblyContent: string;
  polkassemblyUrl: string;
  polkassemblyStatus: string;
  polkassemblyTrack: number;
  polkassemblyCreatedAt: string;
  arkivCid: string;
  arkivUrl: string;
  paseoVoteContractAddress: string;
  paseoTxHash: string;
  paseoBlockNumber: number;
  processingStatus: 'pending' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoteStats {
  enscribedVoters: number;
  votedVoters: number;
  maximalNumberOfVoters: number;
  yesVotes: number;
  finalVote: boolean | null;
  voters: Array<{
    address: string;
    hasVoted: boolean;
  }>;
  isInscriptionOpen: boolean;
  isVotingOpen: boolean;
  isFinalized: boolean;
}

export interface ProposalWithVoteStats extends Proposal {
  voteStats: VoteStats;
}

export interface ProposalFull extends Proposal {
  arkivContent: string;
  voteStats: VoteStats;
}

export interface ApiStats {
  totalProposals: number;
  byStatus: {
    pending: number;
    completed: number;
    failed: number;
  };
}
