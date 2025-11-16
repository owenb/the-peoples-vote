import { ethers } from 'ethers';
import VoteABI from '../../opengov-mirror-server/src/contracts/Vote.abi.json';

// Contract address on Paseo Asset Hub (update with your deployed contract address)
const VOTE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS || '0x...';

// Paseo Asset Hub RPC endpoint
const PASEO_ASSET_HUB_RPC = 'https://testnet-passet-hub-eth-rpc.polkadot.io';

/**
 * Get a read-only contract instance
 */
export function getVoteContract() {
  const provider = new ethers.JsonRpcProvider(PASEO_ASSET_HUB_RPC);
  return new ethers.Contract(VOTE_CONTRACT_ADDRESS, VoteABI, provider);
}

/**
 * Get a contract instance with signer for write operations
 * This uses the H160 address directly
 *
 * @param ethAddress - The H160 Ethereum address from mapped Polkadot account
 * @param privateKey - Private key for signing (if available) or use browser wallet
 */
export async function getVoteContractWithSigner(ethAddress: string) {
  // For browser-based interactions, we'll use the browser's ethereum provider
  // This works because the mapped H160 address can be used with MetaMask or other wallets
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner(ethAddress);
    return new ethers.Contract(VOTE_CONTRACT_ADDRESS, VoteABI, signer);
  }

  throw new Error('No ethereum provider found');
}

/**
 * Get contract statistics
 */
export async function getContractStats() {
  const contract = getVoteContract();

  const [enscribedVoters, votedVoters, maxVoters, yesVotes, finalVote] = await Promise.all([
    contract.s_enscribedVoters(),
    contract.s_votedVoters(),
    contract.s_maximalNumberOfVoters(),
    contract.s_yesVotes(),
    contract.s_finalVote(),
  ]);

  return {
    enscribedVoters: Number(enscribedVoters),
    votedVoters: Number(votedVoters),
    maxVoters: Number(maxVoters),
    yesVotes: Number(yesVotes),
    noVotes: Number(votedVoters) - Number(yesVotes),
    finalVote,
  };
}

/**
 * Get list of registered voters
 */
export async function getRegisteredVoters() {
  const contract = getVoteContract();
  const [voters, hasVoted] = await contract.getRegisteredVoters();

  return voters.map((address: string, index: number) => ({
    address,
    hasVoted: hasVoted[index],
  }));
}

/**
 * Check if an address is registered
 */
export async function isVoterRegistered(ethAddress: string): Promise<boolean> {
  const voters = await getRegisteredVoters();
  return voters.some((v) => v.address.toLowerCase() === ethAddress.toLowerCase());
}

/**
 * Check if an address has voted
 */
export async function hasVoted(ethAddress: string): Promise<boolean> {
  const voters = await getRegisteredVoters();
  const voter = voters.find((v) => v.address.toLowerCase() === ethAddress.toLowerCase());
  return voter?.hasVoted || false;
}

/**
 * Get the final vote result
 */
export async function getFinalVote(): Promise<boolean> {
  const contract = getVoteContract();
  return await contract.get_finalVote();
}

/**
 * Interface for contract interactions
 * Note: These are placeholder interfaces - you'll need to implement the actual
 * contract methods based on your Vote contract's interface
 */

/**
 * Register as a voter (if contract supports this)
 * Uses the mapped H160 address
 */
export async function registerAsVoter(ethAddress: string): Promise<ethers.ContractTransactionResponse> {
  const contract = await getVoteContractWithSigner(ethAddress);

  // This assumes your contract has a register() or enscribe() function
  // Adjust the function name based on your actual contract
  if (typeof (contract as any).register === 'function') {
    return await (contract as any).register();
  } else if (typeof (contract as any).enscribe === 'function') {
    return await (contract as any).enscribe();
  }

  throw new Error('Register function not found in contract');
}

/**
 * Cast a vote using the mapped H160 address
 *
 * @param ethAddress - The H160 address of the voter (from mapped Polkadot account)
 * @param voteYes - true for yes vote, false for no vote
 * @param proof - Any cryptographic proof required (if applicable)
 */
export async function castVote(
  ethAddress: string,
  voteYes: boolean,
  proof?: any
): Promise<ethers.ContractTransactionResponse> {
  const contract = await getVoteContractWithSigner(ethAddress);

  // This assumes your contract has a vote() function
  // Adjust based on your actual contract interface
  if (typeof (contract as any).vote === 'function') {
    if (proof) {
      return await (contract as any).vote(voteYes, proof);
    } else {
      return await (contract as any).vote(voteYes);
    }
  }

  throw new Error('Vote function not found in contract');
}

/**
 * Wait for a transaction to be mined
 */
export async function waitForTransaction(
  tx: ethers.ContractTransactionResponse
): Promise<ethers.ContractTransactionReceipt | null> {
  return await tx.wait();
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txHash: string): Promise<{
  status: 'pending' | 'success' | 'failed';
  receipt?: ethers.TransactionReceipt;
}> {
  const provider = new ethers.JsonRpcProvider(PASEO_ASSET_HUB_RPC);

  try {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return { status: 'pending' };
    }

    return {
      status: receipt.status === 1 ? 'success' : 'failed',
      receipt,
    };
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw error;
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateVoteGas(ethAddress: string, voteYes: boolean): Promise<bigint> {
  const contract = await getVoteContractWithSigner(ethAddress);

  if (typeof (contract as any).vote === 'function') {
    return await (contract as any).vote.estimateGas(voteYes);
  }

  throw new Error('Vote function not found in contract');
}
