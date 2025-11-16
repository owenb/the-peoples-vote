/**
 * React hook for integrated proposal data
 *
 * Merges backend data (from API) with blockchain data (from contracts)
 * to provide a complete view of a proposal and its voting state
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';

import { useProposalFull } from './useProposals';
import { getRegisteredVoters, getFinalVoteResult } from '../utils/vote';
import type { ProposalFull, VoteStats } from '../api/types';

export interface IntegratedProposal extends ProposalFull {
  // User-specific state
  isUserRegistered: boolean;
  hasUserVoted: boolean;
  canUserRegister: boolean;
  canUserVote: boolean;

  // Computed state
  votingProgress: number; // 0-100
  votesCount: number;
  isVotingComplete: boolean;
}

export interface UseIntegratedProposalResult {
  proposal: IntegratedProposal | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useIntegratedProposal(proposalId: number): UseIntegratedProposalResult {
  const { address } = useAccount();

  // 1. Fetch backend data (Polkassembly content + Arkiv)
  const {
    data: backendProposal,
    isLoading: isBackendLoading,
    error: backendError,
    refetch: refetchBackend,
  } = useProposalFull(proposalId);

  // 2. Fetch live contract state
  const {
    data: contractState,
    isLoading: isContractLoading,
    error: contractError,
    refetch: refetchContract,
  } = useQuery({
    queryKey: ['contract-state', backendProposal?.paseoVoteContractAddress],
    queryFn: async () => {
      if (!backendProposal?.paseoVoteContractAddress) {
        throw new Error('No contract address available');
      }

      const voteAddress = backendProposal.paseoVoteContractAddress as Address;

      // Fetch registered voters and voting status
      const registeredVoters = await getRegisteredVoters({ voteAddress });

      // Check if voting is complete
      const votesCount = registeredVoters.hasVoted.filter(voted => voted).length;
      const maxVoters = backendProposal.voteStats.maximalNumberOfVoters;
      const isComplete = votesCount >= maxVoters;

      // Fetch final result if complete
      let finalResult: boolean | null = null;
      if (isComplete) {
        try {
          finalResult = await getFinalVoteResult(voteAddress);
        } catch (err) {
          console.warn('Could not fetch final vote result:', err);
        }
      }

      return {
        registeredVoters,
        votesCount,
        isComplete,
        finalResult,
      };
    },
    enabled: !!backendProposal?.paseoVoteContractAddress,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  // 3. Merge backend + contract data + compute user state
  const integrated = useMemo(() => {
    if (!backendProposal || !contractState) return null;

    const userAddress = address?.toLowerCase();
    const userIndex = contractState.registeredVoters.voters.findIndex(
      v => v.toLowerCase() === userAddress
    );

    const isUserRegistered = userIndex >= 0;
    const hasUserVoted = isUserRegistered
      ? contractState.registeredVoters.hasVoted[userIndex]
      : false;

    const maxVoters = backendProposal.voteStats.maximalNumberOfVoters;
    const votingProgress = maxVoters > 0
      ? (contractState.registeredVoters.voters.length / maxVoters) * 100
      : 0;

    return {
      ...backendProposal,
      isUserRegistered,
      hasUserVoted,
      canUserRegister: !isUserRegistered && !contractState.isComplete,
      canUserVote: isUserRegistered && !hasUserVoted && !contractState.isComplete,
      votingProgress,
      votesCount: contractState.votesCount,
      isVotingComplete: contractState.isComplete,
      // Update voteStats with live data
      voteStats: {
        ...backendProposal.voteStats,
        enscribedVoters: contractState.registeredVoters.voters.length,
        votedVoters: contractState.votesCount,
        finalVote: contractState.finalResult,
        voters: contractState.registeredVoters.voters.map((addr, idx) => ({
          address: addr,
          hasVoted: contractState.registeredVoters.hasVoted[idx],
        })),
      },
    } as IntegratedProposal;
  }, [backendProposal, contractState, address]);

  // 4. Combine loading and error states
  const isLoading = isBackendLoading || isContractLoading;
  const error = (backendError || contractError) as Error | null;

  const refetch = () => {
    refetchBackend();
    refetchContract();
  };

  return {
    proposal: integrated,
    isLoading,
    error,
    refetch,
  };
}
