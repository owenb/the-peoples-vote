/**
 * React hooks for fetching proposals from the backend
 *
 * Uses TanStack Query for caching and automatic refetching
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  getProposals,
  getActiveProposals,
  getProposal,
  getProposalFull,
  getStats,
} from '../api/client';
import type { Proposal, ProposalWithVoteStats, ProposalFull, ApiStats } from '../api/types';

/**
 * Fetch all proposals with optional filtering
 */
export function useProposals(params?: {
  status?: 'pending' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
}): UseQueryResult<Proposal[], Error> {
  return useQuery({
    queryKey: ['proposals', params],
    queryFn: () => getProposals(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch active proposals (with vote stats)
 * Refetches more frequently since voting status changes
 */
export function useActiveProposals(): UseQueryResult<ProposalWithVoteStats[], Error> {
  return useQuery({
    queryKey: ['proposals', 'active'],
    queryFn: () => getActiveProposals(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Fetch a single proposal by ID (basic data only)
 */
export function useProposal(id: number): UseQueryResult<Proposal, Error> {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: () => getProposal(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch full proposal details (with Arkiv content and vote stats)
 * This is the main hook for displaying proposal details
 */
export function useProposalFull(id: number): UseQueryResult<ProposalFull, Error> {
  return useQuery({
    queryKey: ['proposal', id, 'full'],
    queryFn: () => getProposalFull(id),
    enabled: id > 0,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}

/**
 * Fetch API statistics
 */
export function useStats(): UseQueryResult<ApiStats, Error> {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
