import {
  createWalletClient,
  createPublicClient,
  http,
  type WalletArkivClient,
  type PublicArkivClient
} from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';
import { stringToPayload } from '@arkiv-network/sdk/utils';
import { privateKeyToAccount } from 'viem/accounts';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

export interface ArkivMetadata {
  polkassemblyId?: number;
  title?: string;
  track?: number;
}

export interface ArkivStoreResult {
  cid: string;
  url: string;
  txHash?: string;
  blockNumber?: number;
}

export class ArkivService {
  private walletClient: WalletArkivClient;
  private publicClient: PublicArkivClient;

  constructor() {
    const account = privateKeyToAccount(settings.arkiv.privateKey as `0x${string}`);

    this.walletClient = createWalletClient({
      chain: mendoza,
      transport: http(),
      account,
    });

    this.publicClient = createPublicClient({
      chain: mendoza,
      transport: http(),
    });

    logger.info({
      msg: 'Arkiv client initialized',
      chain: mendoza.name,
      accountAddress: account.address,
      ttlDays: settings.arkiv.ttlDays,
    });
  }

  /**
   * Store proposal description in Arkiv network
   */
  async storeDescription(
    description: string,
    metadata?: ArkivMetadata
  ): Promise<ArkivStoreResult> {
    logger.info({
      msg: 'Storing description in Arkiv',
      descriptionLength: description.length,
      ttlDays: settings.arkiv.ttlDays,
    });

    try {
      // Prepare attributes
      const attributes: Array<{ key: string; value: string }> = [
        { key: 'type', value: 'opengov-proposal' },
        { key: 'version', value: '1' },
      ];

      if (metadata) {
        if (metadata.polkassemblyId !== undefined) {
          attributes.push({
            key: 'polkassembly_id',
            value: String(metadata.polkassemblyId),
          });
        }
        if (metadata.title) {
          attributes.push({ key: 'title', value: metadata.title });
        }
        if (metadata.track !== undefined) {
          attributes.push({ key: 'track', value: String(metadata.track) });
        }
      }

      // Convert TTL to seconds (7 days = 604800 seconds)
      const ttlSeconds = settings.arkiv.ttlDays * 24 * 60 * 60;

      // Create entity in Arkiv
      const { entityKey, txReceipt } = await this.walletClient.createEntity({
        payload: stringToPayload(description),
        contentType: 'text/plain',
        attributes,
        expiresIn: ttlSeconds,
      });

      const txHash = txReceipt?.hash;
      const blockNumber = txReceipt?.blockNumber;

      logger.info({
        msg: '✓ Description stored in Arkiv',
        entityKey,
        txHash,
        blockNumber,
      });

      return {
        cid: entityKey,
        url: `${settings.arkiv.rpcUrl}/entity/${entityKey}`,
        txHash,
        blockNumber,
      };
    } catch (error) {
      logger.error({ msg: 'Failed to store description in Arkiv', error });
      throw new Error(`Arkiv storage failed: ${error}`);
    }
  }

  /**
   * Retrieve description from Arkiv by entity key
   */
  async retrieveDescription(entityKey: string): Promise<string> {
    try {
      const entity = await this.publicClient.getEntity(entityKey);
      const description = entity.toText();

      logger.info({
        msg: 'Retrieved description from Arkiv',
        entityKey,
        length: description.length,
      });

      return description;
    } catch (error) {
      logger.error({ msg: 'Failed to retrieve from Arkiv', error });
      throw error;
    }
  }

  /**
   * Query entities by attributes
   */
  async queryProposals(polkassemblyId?: number): Promise<any[]> {
    try {
      const predicates = [eq('type', 'opengov-proposal')];

      if (polkassemblyId !== undefined) {
        predicates.push(eq('polkassembly_id', String(polkassemblyId)));
      }

      const result = await this.publicClient
        .buildQuery()
        .where(predicates)
        .withAttributes(true)
        .withPayload(true)
        .fetch();

      return result.entities;
    } catch (error) {
      logger.error({ msg: 'Failed to query Arkiv', error });
      throw error;
    }
  }

  /**
   * Extend entity expiration
   */
  async extendExpiration(entityKey: string, additionalSeconds: number): Promise<void> {
    try {
      const { txHash } = await this.walletClient.extendEntity({
        entityKey,
        expiresIn: additionalSeconds,
      });

      logger.info({
        msg: 'Extended entity expiration',
        entityKey,
        txHash,
        additionalSeconds,
      });
    } catch (error) {
      logger.error({ msg: 'Failed to extend entity expiration', error });
      throw error;
    }
  }

  /**
   * Subscribe to entity creation events
   */
  async subscribeToCreations(
    onCreated: (entityKey: string, attributes: Record<string, string>) => void
  ): Promise<() => void> {
    const stopFn = await this.publicClient.subscribeEntityEvents({
      onEntityCreated: async (event) => {
        try {
          const entity = await this.publicClient.getEntity(event.entityKey);
          const attrs = Object.fromEntries(
            entity.attributes.map((a) => [a.key, a.value])
          );

          if (attrs.type === 'opengov-proposal') {
            logger.info({
              msg: '[Arkiv Event] Proposal created',
              entityKey: event.entityKey,
            });
            onCreated(event.entityKey, attrs);
          }
        } catch (err) {
          logger.error({ msg: '[Arkiv Event] Error processing creation', err });
        }
      },
      onError: (err) => {
        logger.error({ msg: '[Arkiv Event] Subscription error', err });
      },
    });

    return stopFn;
  }
}
