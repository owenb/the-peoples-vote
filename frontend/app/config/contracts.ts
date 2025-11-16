// frontend/app/config/contracts.ts
import type { Address } from 'viem';

// Import Foundry broadcast JSON
import deployOVFactory420420422 from '../../open_vote_contracts/broadcast/DeployOVFactory.s.sol/420420422/run-latest.json';

// Minimal type for the broadcast file
type FoundryBroadcast = {
  transactions: {
    contractName?: string;
    contractAddress?: string;
  }[];
};

const deployment = deployOVFactory420420422 as FoundryBroadcast;

// Pick the transaction you care about.
// If you want the VoteFactory address:
const factoryTx = deployment.transactions.find(
  (tx) => tx.contractName === 'VoteFactory',
);

// If you later deploy a Vote with DeployOV.s.sol,
// you’d do the same thing on that JSON and search for `contractName === 'Vote'`.

if (!factoryTx?.contractAddress) {
  throw new Error(
    'VoteFactory contract not found in DeployOVFactory.s.sol broadcast (420420422)',
  );
}

export const VOTE_CONTRACT_ADDRESS = factoryTx.contractAddress as Address;
