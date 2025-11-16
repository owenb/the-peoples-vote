import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from 'wagmi/chains';
import { cookieStorage, createStorage } from 'wagmi';
import { defineChain } from 'viem';

// Passet Hub testnet chain
export const passetHubTestnet = defineChain({
  id: 420420422,
  name: 'Passet Hub Testnet',
  network: 'passet-hub',
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
    // Multicall3 is not deployed on Passet Hub, so we disable it
    multicall3: undefined,
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'The Peoples Vote',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    passetHubTestnet,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
