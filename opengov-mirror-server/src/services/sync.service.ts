import { ArkivService } from './arkiv.service.js';
import { PolkassemblyService } from './polkassembly.service.js';
import { PaseoService } from './paseo.service.js';
import { db } from '../database/db.js';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

export interface SyncResult {
  status: 'completed' | 'failed';
  message: string;
  stats: {
    scraped: number;
    alreadyProcessed: number;
    newlyMirrored: number;
    failed: number;
    errors: Array<{ polkassemblyId: number; error: string }>;
  };
}

export class SyncService {
  private arkiv: ArkivService;
  private polkassembly: PolkassemblyService;
  private paseo: PaseoService;

  constructor() {
    this.arkiv = new ArkivService();
    this.polkassembly = new PolkassemblyService();
    this.paseo = new PaseoService();
  }

  /**
   * Sync proposals from Polkassembly to Paseo via Arkiv
   */
  async syncProposals(): Promise<SyncResult> {
    logger.info({ msg: '🔄 Starting sync process' });

    const stats = {
      scraped: 0,
      alreadyProcessed: 0,
      newlyMirrored: 0,
      failed: 0,
      errors: [] as Array<{ polkassemblyId: number; error: string }>,
    };

    try {
      // 1. Fetch deciding proposals from Polkassembly
      const proposals = await this.polkassembly.getDecidingProposals();
      stats.scraped = proposals.length;

      logger.info({
        msg: 'Fetched proposals from Polkassembly',
        count: proposals.length,
      });

      // 2. Process each proposal
      for (const proposal of proposals) {
        try {
          // Check if already fully completed
          const existing = db.getByPolkassemblyId(proposal.id);
          if (existing && existing.processingStatus === 'completed') {
            logger.info({
              msg: 'Proposal already completed',
              polkassemblyId: proposal.id,
            });
            stats.alreadyProcessed++;
            continue;
          }

          // If it exists but failed, we'll retry it below
          const isRetry = existing && existing.processingStatus === 'failed';

          // Insert into database if new
          if (!existing) {
            db.insertProposal({
              polkassemblyId: proposal.id,
              polkassemblyTitle: proposal.title,
              polkassemblyContent: proposal.content,
              polkassemblyUrl: proposal.url,
              polkassemblyStatus: proposal.status,
              polkassemblyTrack: proposal.track,
              polkassemblyCreatedAt: proposal.createdAt,
            });
          }

          logger.info({
            msg: isRetry ? 'Retrying failed proposal' : 'Mirroring proposal',
            polkassemblyId: proposal.id,
            title: proposal.title,
          });

          // Update status to processing
          db.updateStatus(proposal.id, 'processing');

          // 3. Store in Arkiv (skip if already stored)
          let arkivCid = existing?.arkivCid || null;
          if (!arkivCid) {
            const arkivResult = await this.arkiv.storeDescription(proposal.content, {
              polkassemblyId: proposal.id,
              title: proposal.title,
              track: proposal.track,
            });

            db.updateArkiv(proposal.id, arkivResult.cid, arkivResult.url);
            arkivCid = arkivResult.cid;

            logger.info({
              msg: '✓ Stored in Arkiv',
              polkassemblyId: proposal.id,
              cid: arkivResult.cid,
            });
          } else {
            logger.info({
              msg: 'Using existing Arkiv CID',
              polkassemblyId: proposal.id,
              cid: arkivCid,
            });
          }

          // 4. Create Vote contract on Paseo
          // Use Polkassembly ID as the description key (shorter, contract-friendly)
          const descriptionKey = `polkassembly-${proposal.id}`;

          const paseoResult = await this.paseo.createVote({
            name: proposal.title.substring(0, 50), // Limit title length
            description: descriptionKey, // Use short key, not full CID
            numberOfVoters: settings.proposal.defaultNumberOfVoters,
          });

          db.updatePaseo(
            proposal.id,
            paseoResult.contractAddress,
            paseoResult.txHash,
            paseoResult.blockNumber
          );

          // Mark as completed
          db.updateStatus(proposal.id, 'completed');
          stats.newlyMirrored++;

          logger.info({
            msg: '✓ Proposal mirrored successfully',
            polkassemblyId: proposal.id,
            arkivCid: arkivCid,
            voteContract: paseoResult.contractAddress,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error({
            msg: 'Failed to mirror proposal',
            polkassemblyId: proposal.id,
            error: errorMsg,
          });

          db.updateStatus(proposal.id, 'failed', errorMsg);
          stats.failed++;
          stats.errors.push({
            polkassemblyId: proposal.id,
            error: errorMsg,
          });
        }
      }

      const message = `Sync completed: ${stats.newlyMirrored} new proposals mirrored`;

      logger.info({
        msg: '✓ Sync completed',
        ...stats,
      });

      return {
        status: 'completed',
        message,
        stats,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error({
        msg: 'Sync failed',
        error: errorMsg,
      });

      return {
        status: 'failed',
        message: `Sync failed: ${errorMsg}`,
        stats,
      };
    }
  }

  /**
   * Retry failed proposals
   */
  async retryFailed(): Promise<SyncResult> {
    logger.info({ msg: 'Retrying failed proposals' });

    const failedProposals = db.getFailed();
    const stats = {
      scraped: failedProposals.length,
      alreadyProcessed: 0,
      newlyMirrored: 0,
      failed: 0,
      errors: [] as Array<{ polkassemblyId: number; error: string }>,
    };

    for (const proposal of failedProposals) {
      try {
        logger.info({
          msg: 'Retrying failed proposal',
          polkassemblyId: proposal.polkassemblyId,
        });

        // Update status to processing
        db.updateStatus(proposal.polkassemblyId, 'processing');

        // If no Arkiv CID, store in Arkiv
        if (!proposal.arkivCid) {
          const arkivResult = await this.arkiv.storeDescription(
            proposal.polkassemblyContent,
            {
              polkassemblyId: proposal.polkassemblyId,
              title: proposal.polkassemblyTitle,
              track: proposal.polkassemblyTrack || undefined,
            }
          );

          db.updateArkiv(proposal.polkassemblyId, arkivResult.cid, arkivResult.url);
        }

        // If no Vote contract, create on Paseo
        if (!proposal.paseoVoteContractAddress) {
          const arkivCid = proposal.arkivCid || (await this.arkiv.storeDescription(
            proposal.polkassemblyContent,
            {
              polkassemblyId: proposal.polkassemblyId,
              title: proposal.polkassemblyTitle,
              track: proposal.polkassemblyTrack || undefined,
            }
          )).cid;

          const expiration = Math.floor(Date.now() / 1000) + settings.proposal.expirationOffsetSeconds;

          const paseoResult = await this.paseo.createVote({
            name: proposal.polkassemblyTitle.substring(0, 50),
            description: arkivCid,
            numberOfVoters: settings.proposal.defaultNumberOfVoters,
            expiration,
          });

          db.updatePaseo(
            proposal.polkassemblyId,
            paseoResult.contractAddress,
            paseoResult.txHash,
            paseoResult.blockNumber
          );
        }

        // Mark as completed
        db.updateStatus(proposal.polkassemblyId, 'completed');
        stats.newlyMirrored++;

        logger.info({
          msg: '✓ Failed proposal recovered',
          polkassemblyId: proposal.polkassemblyId,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error({
          msg: 'Retry failed',
          polkassemblyId: proposal.polkassemblyId,
          error: errorMsg,
        });

        db.updateStatus(proposal.polkassemblyId, 'failed', errorMsg);
        stats.failed++;
        stats.errors.push({
          polkassemblyId: proposal.polkassemblyId,
          error: errorMsg,
        });
      }
    }

    return {
      status: 'completed',
      message: `Retry completed: ${stats.newlyMirrored} proposals recovered`,
      stats,
    };
  }
}
