// Type definitions for mixnet transaction routing

export interface MixnetSendResult {
  success: boolean;
  messageId: bigint;
  numParts: number;
  txHash?: string;
  error?: string;
}

export interface PartSendProgress {
  partIndex: number;
  totalParts: number;
  status: 'pending' | 'sending' | 'success' | 'error' | 'retrying';
  error?: string;
}

export type ProgressCallback = (progress: PartSendProgress) => void;

export interface PartResponse {
  accepted: boolean;
  completed: boolean;
  messageType: number;
  bytes: number;
  completedPayload?: string;
  txHash?: string;
  info?: string;
}
