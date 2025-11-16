import { createPublicClient, http, type PublicClient } from 'viem';
import { paseoAssetHub } from '../config/wagmi';

/**
 * Simple singleton for a viem PublicClient.
 * Avoids passing possibly-undefined clients across components/services.
 */
class PublicClientSingleton {
  private static _client: PublicClient | null = null;

  static get(): PublicClient {
    if (!this._client) {
      this._client = createPublicClient({
        chain: paseoAssetHub,
        transport: http('https://testnet-passet-hub-eth-rpc.polkadot.io'),
      });
    }
    return this._client;
  }
}

export default PublicClientSingleton;
