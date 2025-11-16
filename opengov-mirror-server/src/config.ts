import { config } from 'dotenv';

config();

export const settings = {
  // Paseo Asset Hub
  paseo: {
    rpcUrl: process.env.PASEO_RPC_URL || 'https://paseo-asset-hub-eth-rpc.polkadot.io',
    chainId: parseInt(process.env.PASEO_CHAIN_ID || '420420422'),
    walletAddress: process.env.PASEO_WALLET_ADDRESS!,
    privateKey: process.env.PASEO_PRIVATE_KEY!,
  },

  // VoteFactory Contract
  voteFactory: {
    address: process.env.VOTE_FACTORY_ADDRESS || '0x803ac2c25d0ef94289b3efc06dfc87a7903657f0',
  },

  // Arkiv Network
  arkiv: {
    rpcUrl: process.env.ARKIV_RPC_URL || 'https://mendoza.hoodi.arkiv.network/rpc',
    wsUrl: process.env.ARKIV_WS_URL || 'wss://mendoza.hoodi.arkiv.network/rpc/ws',
    privateKey: process.env.ARKIV_PRIVATE_KEY!,
    ttlDays: parseInt(process.env.ARKIV_TTL_DAYS || '7'),
  },

  // Polkassembly
  polkassembly: {
    apiUrl: process.env.POLKASSEMBLY_API_URL || 'https://polkadot.polkassembly.io/api/v1',
    network: process.env.POLKASSEMBLY_NETWORK || 'polkadot',
    filterStartDate: process.env.FILTER_START_DATE || '2025-09-01',
  },

  // Proposal Configuration
  proposal: {
    defaultNumberOfVoters: parseInt(process.env.DEFAULT_NUMBER_OF_VOTERS || '3'),
    expirationOffsetSeconds: parseInt(process.env.EXPIRATION_OFFSET_SECONDS || '31536000'),
  },

  // Server
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '8000'),
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Database
  database: {
    path: process.env.DATABASE_PATH || './proposals.db',
  },

  // Cron
  cron: {
    syncIntervalHours: parseInt(process.env.SYNC_INTERVAL_HOURS || '1'),
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'PASEO_WALLET_ADDRESS',
  'PASEO_PRIVATE_KEY',
  'ARKIV_PRIVATE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
