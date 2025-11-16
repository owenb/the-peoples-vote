import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage } from 'wagmi';
import { defineChain } from 'viem';

// Paseo Asset Hub testnet chain - THE ONLY CHAIN WE USE
export const paseoAssetHub = defineChain({
  id: 420420422,
  name: 'Paseo Asset Hub',
  network: 'paseo-asset-hub',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
    public: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    },
  },
  contracts: {
    // Multicall3 is not deployed on Paseo Asset Hub, so we disable it
    multicall3: undefined,
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'The Peoples Vote',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    paseoAssetHub, // ONLY Paseo Asset Hub - this is our default and only chain
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
