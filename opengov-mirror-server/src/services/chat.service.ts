import {
  createWalletClient,
  http,
  type WalletArkivClient
} from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { stringToPayload } from '@arkiv-network/sdk/utils';
import { privateKeyToAccount } from 'viem/accounts';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

export interface ChatMessage {
  roomId: string;
  sender: string;
  content: string;
  timestamp: number;
}

export interface ChatSendResult {
  success: boolean;
  entityKey: string;
  txHash?: string;
  message: string;
}

export class ChatService {
  private walletClient: WalletArkivClient;
  private readonly MESSAGE_TTL_SECONDS = 60; // 1 minute

  constructor() {
    const account = privateKeyToAccount(settings.arkiv.privateKey as `0x${string}`);

    this.walletClient = createWalletClient({
      chain: mendoza,
      transport: http(),
      account,
    });

    logger.info({
      msg: 'Chat service initialized',
      chain: mendoza.name,
      serverAddress: account.address,
      messageTTL: `${this.MESSAGE_TTL_SECONDS}s`,
    });
  }

  /**
   * Send a chat message to Arkiv
   * All messages are sent from the server's address for privacy
   */
  async sendMessage(message: ChatMessage): Promise<ChatSendResult> {
    const { roomId, sender, content, timestamp } = message;

    // Validate input
    if (!roomId || !sender || !content) {
      throw new Error('Missing required fields: roomId, sender, content');
    }

    logger.info({
      msg: 'Sending chat message',
      roomId,
      sender,
      contentLength: content.length,
      ttl: `${this.MESSAGE_TTL_SECONDS}s`,
    });

    try {
      // Convert content to payload
      const payload = stringToPayload(content);

      // Create entity on Arkiv with 1-minute expiry
      const result = await this.walletClient.createEntity({
        payload,
        contentType: 'text/plain',
        attributes: [
          { key: 'type', value: 'chat_message' },
          { key: 'roomId', value: roomId },
          { key: 'sender', value: sender },
          { key: 'timestamp', value: timestamp?.toString() || Date.now().toString() },
        ],
        expiresIn: this.MESSAGE_TTL_SECONDS,
      });

      const entityKey = result.entityKey;
      const txHash = (result as any).txReceipt?.hash;

      logger.info({
        msg: '✓ Chat message sent',
        entityKey,
        txHash,
        roomId,
        sender,
        expiresIn: `${this.MESSAGE_TTL_SECONDS}s`,
      });

      return {
        success: true,
        entityKey,
        txHash,
        message: 'Message sent successfully',
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to send chat message',
        roomId,
        sender,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Get the message TTL in seconds
   */
  getMessageTTL(): number {
    return this.MESSAGE_TTL_SECONDS;
  }
}
