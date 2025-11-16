// Mixnet client for sending signed Ethereum transactions through the xx network

import type { Hex } from 'viem';
import {
  partitionPayload,
  ConversationCounter,
  DEFAULT_MAX_MESSAGE_LENGTH,
} from './partition';
import type {
  MixnetSendResult,
  PartSendProgress,
  ProgressCallback,
  PartResponse,
} from '../../types/mixnet';

// Message type for signed Ethereum transactions
export const SIGNED_TX_MESSAGE_TYPE = 10;

// XX Network Server configuration
const XX_SERVER_URL =
  process.env.NEXT_PUBLIC_XX_SERVER_URL || 'http://localhost:8080';
const XX_SERVER_ID =
  process.env.NEXT_PUBLIC_XX_SERVER_ID || 'vG1i2XAKAa9nCvGLONABbIlsG+7uPLaE+hwYu6qPkyY';

// Global counter for message IDs (in production, this should be persisted)
const messageCounter = new ConversationCounter();

/**
 * Convert a hex string (with or without 0x prefix) to Uint8Array
 */
export function hexToBytes(hex: Hex): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Send a single partition part to the xx network server
 */
async function sendPart(
  part: Uint8Array,
  senderId: string,
  messageType: number,
  retryCount = 0,
): Promise<PartResponse> {
  const maxRetries = 1;

  try {
    const response = await fetch(`${XX_SERVER_URL}/api/parts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId,
        payload: bytesToBase64(part),
        messageType,
        timestampNs: Date.now() * 1_000_000,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: PartResponse = await response.json();
    return result;
  } catch (error) {
    // Retry logic: retry once if failed
    if (retryCount < maxRetries) {
      console.log(`Retrying part (attempt ${retryCount + 1}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      return sendPart(part, senderId, messageType, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Send a signed Ethereum transaction through the xx network mixnet
 *
 * @param signedTx - The signed transaction as a hex string
 * @param onProgress - Optional callback for progress updates
 * @returns Result with success status, message ID, number of parts, and transaction hash if successful
 */
export async function sendSignedTransaction(
  signedTx: Hex,
  onProgress?: ProgressCallback,
): Promise<MixnetSendResult> {
  try {
    // Step 1: Convert hex to bytes
    const txBytes = hexToBytes(signedTx);
    console.log(`[mixnet] Converting signed tx to bytes (${txBytes.length} bytes)`);

    // Step 2: Partition the transaction
    const partitionResult = partitionPayload(txBytes, messageCounter, {
      messageType: SIGNED_TX_MESSAGE_TYPE,
      maxMessageLength: DEFAULT_MAX_MESSAGE_LENGTH,
    });

    const { parts, fullMessageId, numParts } = partitionResult;
    console.log(`[mixnet] Partitioned transaction into ${numParts} parts`);

    // Step 3: Send each part
    let completedPayload: string | undefined;
    let txHash: string | undefined;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Notify progress
      onProgress?.({
        partIndex: i,
        totalParts: numParts,
        status: 'sending',
      });

      try {
        const response = await sendPart(
          part,
          XX_SERVER_ID,
          SIGNED_TX_MESSAGE_TYPE,
        );

        console.log(`[mixnet] Part ${i + 1}/${numParts} sent:`, {
          accepted: response.accepted,
          completed: response.completed,
          bytes: response.bytes,
        });

        // If this is the final part and message is complete
        if (response.completed) {
          completedPayload = response.completedPayload;
          txHash = response.txHash;
          console.log('[mixnet] Transaction complete!', {
            txHash,
            payloadBytes: completedPayload?.length,
          });
        }

        // Notify success for this part
        onProgress?.({
          partIndex: i,
          totalParts: numParts,
          status: 'success',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(`[mixnet] Failed to send part ${i + 1}/${numParts}:`, error);

        // Notify error for this part
        onProgress?.({
          partIndex: i,
          totalParts: numParts,
          status: 'error',
          error: errorMessage,
        });

        return {
          success: false,
          messageId: fullMessageId,
          numParts,
          error: `Failed to send part ${i + 1}: ${errorMessage}`,
        };
      }
    }

    // Success!
    return {
      success: true,
      messageId: fullMessageId,
      numParts,
      txHash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[mixnet] Error sending transaction:', error);

    return {
      success: false,
      messageId: 0n,
      numParts: 0,
      error: errorMessage,
    };
  }
}
