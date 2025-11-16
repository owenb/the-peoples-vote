/**
 * Backend API Client
 *
 * Handles all HTTP requests to the opengov-mirror-server backend
 */

import type { Proposal, ProposalWithVoteStats, ProposalFull, ApiStats } from './types';

// Backend API base URL - configurable via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all proposals (paginated)
 */
export async function getProposals(params?: {
  status?: 'pending' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
}): Promise<Proposal[]> {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.append('status', params.status);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const query = searchParams.toString();
  return fetchApi<Proposal[]>(`/proposals${query ? `?${query}` : ''}`);
}

/**
 * Get active proposals (with vote stats)
 * These are proposals where inscription or voting is still open
 */
export async function getActiveProposals(): Promise<ProposalWithVoteStats[]> {
  return fetchApi<ProposalWithVoteStats[]>('/proposals/active');
}

/**
 * Get a single proposal by ID (without Arkiv content or vote stats)
 */
export async function getProposal(id: number): Promise<Proposal> {
  return fetchApi<Proposal>(`/proposals/${id}`);
}

/**
 * Get a single proposal by Polkassembly ID
 */
export async function getProposalByPolkassemblyId(polkassemblyId: number): Promise<Proposal> {
  return fetchApi<Proposal>(`/proposals/polkassembly/${polkassemblyId}`);
}

/**
 * Get full proposal details (with Arkiv content AND vote stats)
 * This is the main endpoint for displaying proposal details
 */
export async function getProposalFull(id: number): Promise<ProposalFull> {
  return fetchApi<ProposalFull>(`/proposals/${id}/full`);
}

/**
 * Get API statistics
 */
export async function getStats(): Promise<ApiStats> {
  return fetchApi<ApiStats>('/stats');
}

/**
 * Get health status
 */
export async function getHealth(): Promise<{
  status: string;
  timestamp: string;
  uptime: number;
}> {
  return fetchApi('/health');
}

/**
 * Get detailed health status (with service checks)
 */
export async function getHealthDetailed(): Promise<{
  status: string;
  timestamp: string;
  uptime: number;
  services: {
    database: boolean;
    paseo: boolean;
    arkiv: boolean;
  };
  stats: ApiStats;
  paseoBalance: string | null;
}> {
  return fetchApi('/health/detailed');
}

/**
 * Trigger manual sync (requires appropriate permissions)
 */
export async function triggerSync(): Promise<{
  status: string;
  message: string;
  stats: {
    scraped: number;
    alreadyProcessed: number;
    newlyMirrored: number;
    failed: number;
    errors: string[];
  };
}> {
  const response = await fetch(`${API_BASE_URL}/sync`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
