import axios from 'axios';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

export interface PolkassemblyProposal {
  id: number;
  title: string;
  content: string;
  status: string;
  track: number;
  createdAt: string;
  url: string;
}

export class PolkassemblyService {
  private apiUrl: string;
  private network: string;
  private filterStartDate: Date;

  constructor() {
    this.apiUrl = settings.polkassembly.apiUrl;
    this.network = settings.polkassembly.network;
    this.filterStartDate = new Date(settings.polkassembly.filterStartDate);

    logger.info({
      msg: 'Polkassembly scraper initialized',
      apiUrl: this.apiUrl,
      network: this.network,
      filterStartDate: settings.polkassembly.filterStartDate,
    });
  }

  /**
   * Scrape the /all page to get all proposal IDs
   */
  private async getAllProposalIds(): Promise<number[]> {
    try {
      logger.info({ msg: 'Fetching /all page to discover proposal IDs' });

      const response = await axios.get(
        `https://${this.network}.polkassembly.io/all`,
        { timeout: 30000 }
      );

      // Extract all referenda IDs from HTML
      const ids = [...response.data.matchAll(/referenda\/(\d+)/g)].map((match) =>
        parseInt(match[1])
      );
      const uniqueIds = [...new Set(ids)].sort((a, b) => b - a);

      logger.info({
        msg: 'Discovered proposal IDs',
        count: uniqueIds.length,
        latestId: uniqueIds[0] || null,
      });

      return uniqueIds;
    } catch (error) {
      logger.error({
        msg: 'Failed to fetch /all page',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Fetch detailed proposal data from API
   */
  private async fetchProposalDetails(
    postId: number
  ): Promise<PolkassemblyProposal | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/posts/on-chain-post`, {
        headers: {
          'x-network': this.network,
          'Content-Type': 'application/json',
        },
        params: {
          postId,
          proposalType: 'referendums_v2',
        },
        timeout: 10000,
      });

      if (response.status !== 200) {
        return null;
      }

      const data = response.data;

      return {
        id: postId,
        title: data.title || 'Untitled Proposal',
        content: data.content || '',
        track: data.track_number || 0,
        status: data.status || '',
        createdAt: data.created_at || new Date().toISOString(),
        url: `https://${this.network}.polkassembly.io/referenda/${postId}`,
      };
    } catch (error) {
      // Silently skip proposals that don't exist or can't be fetched
      return null;
    }
  }

  /**
   * Fetch "Deciding" proposals from Polkassembly
   */
  async getDecidingProposals(limit = 100): Promise<PolkassemblyProposal[]> {
    try {
      logger.info({
        msg: 'Fetching deciding proposals from Polkassembly',
        limit,
      });

      // Get all proposal IDs
      const allIds = await this.getAllProposalIds();

      // Fetch details for each proposal (up to limit)
      const proposals: PolkassemblyProposal[] = [];

      for (const id of allIds.slice(0, limit * 2)) {
        // Fetch more than needed to account for filtering
        const proposal = await this.fetchProposalDetails(id);

        if (!proposal) continue;

        // Filter by status and date
        const createdAt = new Date(proposal.createdAt);
        if (
          proposal.status === 'Deciding' &&
          createdAt >= this.filterStartDate
        ) {
          proposals.push(proposal);

          if (proposals.length >= limit) {
            break;
          }
        }
      }

      logger.info({
        msg: 'Fetched deciding proposals',
        count: proposals.length,
        filteredBy: settings.polkassembly.filterStartDate,
      });

      return proposals;
    } catch (error) {
      logger.error({
        msg: 'Failed to fetch Polkassembly proposals',
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Polkassembly fetch failed: ${error}`);
    }
  }

  /**
   * Get a specific proposal by ID
   */
  async getProposal(id: number): Promise<PolkassemblyProposal | null> {
    return this.fetchProposalDetails(id);
  }
}
