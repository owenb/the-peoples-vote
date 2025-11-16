import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { u8aToHex, hexToU8a } from '@polkadot/util';

// Paseo Asset Hub WebSocket endpoint
const PASEO_ASSET_HUB_WS = 'wss://paseo-asset-hub-rpc.polkadot.io';

// Cache for API instance
let apiInstance: ApiPromise | null = null;

/**
 * Get or create API instance for Paseo Asset Hub
 */
export async function getApi(): Promise<ApiPromise> {
  if (apiInstance && apiInstance.isConnected) {
    return apiInstance;
  }

  const provider = new WsProvider(PASEO_ASSET_HUB_WS);
  apiInstance = await ApiPromise.create({ provider });
  return apiInstance;
}

/**
 * Disconnect API instance
 */
export async function disconnectApi(): Promise<void> {
  if (apiInstance) {
    await apiInstance.disconnect();
    apiInstance = null;
  }
}

/**
 * Convert Polkadot SS58 address to Ethereum H160 address
 * Uses the pallet-revive runtime API
 *
 * @param polkadotAddress - Polkadot SS58 formatted address
 * @returns Ethereum H160 address (0x prefixed)
 */
export async function polkadotToEthAddress(polkadotAddress: string): Promise<string> {
  try {
    const api = await getApi();

    // Decode the SS58 address to get the public key
    const publicKey = decodeAddress(polkadotAddress);
    const publicKeyHex = u8aToHex(publicKey);

    // Use the revive runtime API to get the corresponding H160 address
    const result = await api.call.reviveApi.address(publicKeyHex);

    return result.toHex();
  } catch (error) {
    console.error('Error converting Polkadot address to Ethereum address:', error);
    throw new Error(`Failed to convert address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert Ethereum H160 address to Polkadot AccountId32
 * This extends the 20-byte address with twelve 0xEE bytes
 *
 * @param ethAddress - Ethereum H160 address (0x prefixed)
 * @param ss58Format - SS58 format (0 for Polkadot, 42 for generic Substrate)
 * @returns Polkadot SS58 formatted address
 */
export function ethToPolkadotAddress(ethAddress: string, ss58Format: number = 42): string {
  try {
    // Remove 0x prefix if present
    const cleanAddress = ethAddress.startsWith('0x') ? ethAddress.slice(2) : ethAddress;

    // Validate it's 20 bytes (40 hex characters)
    if (cleanAddress.length !== 40) {
      throw new Error('Invalid Ethereum address length');
    }

    // Extend to 32 bytes by appending twelve 0xEE bytes
    const extendedAddress = cleanAddress + 'EEEEEEEEEEEEEEEEEEEEEEEE';

    // Convert to Uint8Array
    const addressBytes = hexToU8a('0x' + extendedAddress);

    // Encode as SS58
    return encodeAddress(addressBytes, ss58Format);
  } catch (error) {
    console.error('Error converting Ethereum address to Polkadot address:', error);
    throw new Error(`Failed to convert address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Map a Polkadot account to work with pallet-revive contracts
 * This must be called before the account can interact with contracts
 *
 * @param account - Injected account from Polkadot wallet extension
 * @returns Transaction hash
 */
export async function mapAccount(account: any): Promise<string> {
  try {
    const api = await getApi();

    // Get the injector for this account
    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);

    // Create the map_account extrinsic
    const tx = api.tx.revive.mapAccount();

    // Sign and send the transaction
    return new Promise((resolve, reject) => {
      tx.signAndSend(
        account.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            console.log(`Transaction included in block hash: ${status.asInBlock}`);
          }

          if (status.isFinalized) {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else {
              console.log(`Transaction finalized in block hash: ${status.asFinalized}`);
              resolve(status.asFinalized.toHex());
            }
          }
        }
      ).catch(reject);
    });
  } catch (error) {
    console.error('Error mapping account:', error);
    throw new Error(`Failed to map account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if an account is mapped
 * Note: This queries the chain state to check if mapping exists
 *
 * @param polkadotAddress - Polkadot SS58 formatted address
 * @returns boolean indicating if account is mapped
 */
export async function isAccountMapped(polkadotAddress: string): Promise<boolean> {
  try {
    const api = await getApi();

    // Decode address to AccountId32
    const publicKey = decodeAddress(polkadotAddress);

    // Query the AddressSuffix storage to check if account is mapped
    // The storage structure is: AddressSuffix: Map AccountId32 => [u8; 12]
    const suffix = await api.query.revive.addressSuffix(publicKey);

    // If suffix exists and is not empty, account is mapped
    return !suffix.isEmpty;
  } catch (error) {
    console.error('Error checking if account is mapped:', error);
    // If we can't determine, assume it's not mapped to be safe
    return false;
  }
}

/**
 * Get account info including whether it's mapped and its corresponding H160 address
 *
 * @param polkadotAddress - Polkadot SS58 formatted address
 * @returns Account mapping information
 */
export async function getAccountMappingInfo(polkadotAddress: string): Promise<{
  polkadotAddress: string;
  isMapped: boolean;
  ethAddress?: string;
}> {
  const isMapped = await isAccountMapped(polkadotAddress);

  const info: {
    polkadotAddress: string;
    isMapped: boolean;
    ethAddress?: string;
  } = {
    polkadotAddress,
    isMapped,
  };

  if (isMapped) {
    try {
      info.ethAddress = await polkadotToEthAddress(polkadotAddress);
    } catch (error) {
      console.error('Error getting Ethereum address:', error);
    }
  }

  return info;
}
