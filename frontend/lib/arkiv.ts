import { createPublicClient, http } from 'viem';
import { createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mendoza } from '@arkiv-network/sdk';

// Arkiv configuration from environment
const ARKIV_RPC_URL = process.env.NEXT_PUBLIC_ARKIV_RPC_URL || 'https://mendoza.hoodi.arkiv.network/rpc';
const ARKIV_WS_URL = process.env.NEXT_PUBLIC_ARKIV_WS_URL || 'wss://mendoza.hoodi.arkiv.network/rpc/ws';

/**
 * Create a public client for reading from Arkiv
 */
export function createArkivPublicClient() {
  return createPublicClient({
    chain: mendoza,
    transport: http(ARKIV_RPC_URL),
  });
}

/**
 * Create a wallet client for writing to Arkiv
 * Note: This should only be used server-side with the private key
 */
export function createArkivWalletClient(privateKey: string) {
  return createWalletClient({
    chain: mendoza,
    transport: http(ARKIV_RPC_URL),
    account: privateKeyToAccount(privateKey as `0x${string}`),
  });
}

/**
 * Get WebSocket URL for real-time subscriptions
 */
export function getArkivWsUrl(): string {
  return ARKIV_WS_URL;
}

/**
 * Get RPC URL
 */
export function getArkivRpcUrl(): string {
  return ARKIV_RPC_URL;
}

/**
 * Helper to convert string to payload
 */
export function stringToPayload(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Helper to convert payload to string
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Helper to create attribute filter for queries
 */
export function eq(key: string, value: string) {
  return { key, value };
}
