import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { cookieStorage, createStorage } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'The Peoples Vote',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
