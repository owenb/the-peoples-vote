import type { Address } from 'viem';
import { passetHubTestnet } from '../config/wagmi';
import type { Config } from 'wagmi';
import type { WriteContractMutateAsync } from 'wagmi/query';

import PublicClientSingleton from './client';
import VoteFactoryJson from '../../open_vote_contracts/out/VoteFactory.sol/VoteFactory.json';
import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';
import { Proposal } from './/Proposal';
import { getArkivRpc, getProposalById } from './arkiv';
import type { WalletArkivClient, PublicArkivClient } from "@arkiv-network/sdk";
import { Wallet } from 'ethers';


export interface UiVote {
  id: string;
  address: `0x${string}`;
  name: string;
  description: string;
  numberOfVoters: bigint;
  registeredVoters: {
    voters: `0x${string}`[];
    hasVoted: boolean[];
  };
  finalResult?: boolean | null;
}

export type CreateVoteParams = {
  name: string;
  description: string;
  numberOfVoters: number;
};


export type WriteAsync = WriteContractMutateAsync<Config, unknown>;

export async function getTotalVotes(opts: {
  factoryAddress: Address;
}): Promise<bigint> {
  const publicClient = PublicClientSingleton.get();
  const total = await publicClient.readContract({
    address: opts.factoryAddress,
    abi: (VoteFactoryJson as any).abi,
    functionName: 'totalVotes',
    args: [],
  });
  return total as bigint;
}

export async function getVoteAddressById(opts: {
  factoryAddress: Address;
  id: bigint;
}): Promise<Address> {
  const publicClient = PublicClientSingleton.get();
  const addr = await publicClient.readContract({
    address: opts.factoryAddress,
    abi: (VoteFactoryJson as any).abi,
    functionName: 'getById',
    args: [opts.id],
  });
  return addr as Address;
}

export async function getVoteMetadata(opts: {
  factoryAddress: Address;
  id: bigint;
}): Promise<{ name: string; description: string; numberOfVoters: number }> {
  const publicClient = PublicClientSingleton.get();

  // 1) Read on-chain metadata from the factory
  const [name, onchainDescription, numberOfVoters] =
    (await publicClient.readContract({
      address: opts.factoryAddress,
      abi: (VoteFactoryJson as any).abi,
      functionName: 'getMetadata',
      args: [opts.id],
    })) as [string, string, number];

  // 2) Try to fetch richer description from Arkiv (if exists)
  const arkivRpc = getArkivRpc();

  // convert bigint id -> number for Arkiv lookup
  const proposalEntity = await getProposalById(arkivRpc, Number(opts.id));
  console.log(`proposalEntity ${proposalEntity}`);
  // Prefer Arkiv description if found, otherwise fall back to on-chain one
  const description = proposalEntity?.description || "";
  console.log(`description ${description}`);
  // [TODO] Reconstruct ProposalHeader if you later add more fields

  return { name, description, numberOfVoters };
}

/** Fetch the N most recent votes (newest -> oldest). */
export async function getRecentVotes(opts: {
  factoryAddress: `0x${string}`;
  limit?: number;
}): Promise<UiVote[]> {
  const { factoryAddress, limit = 10 } = opts; // Now this works correctly
  const publicClient = PublicClientSingleton.get();

  try {
    const total = await getTotalVotes({ factoryAddress });
    console.log(`Total votes from contract: ${total}`);

    const totalNum = Number(total);
    const count = Math.min(limit, Math.max(totalNum, 0));
    console.log(`Will fetch ${count} votes (total: ${totalNum})`);

    if (count <= 0) {
      console.log('No votes to fetch, returning empty array');
      return [];
    }

    const startId = totalNum - 1;
    const endId = Math.max(totalNum - count, 0);
    console.log(`Fetching votes from ID ${startId} to ${endId}`);

    // Fetch data using individual calls (no multicall support on Passet Hub)
    const results: any[] = [];
    for (let i = startId; i >= endId; i--) {
      try {
        const voteAddress = await publicClient.readContract({
          address: factoryAddress,
          abi: (VoteFactoryJson as any).abi,
          functionName: 'getById',
          args: [BigInt(i)],
        });
        results.push({ result: voteAddress, status: 'success' });

        const metadata = await publicClient.readContract({
          address: factoryAddress,
          abi: (VoteFactoryJson as any).abi,
          functionName: 'getMetadata',
          args: [BigInt(i)],
        });
        results.push({ result: metadata, status: 'success' });
      } catch (error) {
        console.error(`Failed to fetch vote ${i}:`, error);
        results.push({ status: 'failure', error });
        results.push({ status: 'failure', error });
      }
    }
    console.log('Vote results:', results);

    const stitched: UiVote[] = [];
    let idx = 0;

    const votePromises: Promise<UiVote>[] = [];

    for (let id = startId; id >= endId; id--) {
      const byId = results[idx++] as any;
      const metadata = results[idx++] as any;

      if (!byId?.result) {
        console.warn(`Failed to get vote address for ID ${id}`);
        continue;
      }

      const voteAddress = byId.result as Address;

      let name = 'Unknown Vote';
      let description = 'No description available';
      let numberOfVoters = 0;

      // if (metadata?.result && Array.isArray(metadata.result)) {
      //   [name, description, numberOfVoters] = metadata.result as [string, string, number];
      // } else {
      //   console.warn(`Failed to get metadata for vote ID ${id}, using fallback values`);
      //   // Optionally, try to fetch metadata individually as fallback
      // }

      try {
        const fallbackMetadata = await getVoteMetadata({ factoryAddress, id: BigInt(id) });
        name = fallbackMetadata.name;
        description = fallbackMetadata.description;
        numberOfVoters = Number(fallbackMetadata.numberOfVoters);
      } catch (error) {
        console.error(`Fallback metadata fetch failed for ID ${id}:`, error);
      }

      // Create promise to fetch registered voters for each vote
      const votePromise = getRegisteredVoters({
        voteAddress,
      }).then((registeredVoters) => ({
        id: id.toString(), // Convert BigInt to string
        address: voteAddress, // Use 'address' instead of 'voteAddress'
        name,
        description,
        numberOfVoters: BigInt(numberOfVoters), // Convert number to bigint
        registeredVoters,
      }));

      votePromises.push(votePromise);
    }

    // Wait for all registered voter data to be fetched
    const votesWithRegisteredVoters = await Promise.all(votePromises);

    const votesWithResults = await Promise.all(
      votesWithRegisteredVoters.map(async (vote) => {
        const votesCount = vote.registeredVoters.hasVoted.filter(voted => voted).length;
        const maxVoters = Number(vote.numberOfVoters);

        // Check if voting is complete
        if (votesCount === maxVoters) {
          try {
            const finalResult = await getFinalVoteResult(vote.address);
            return { ...vote, finalResult };
          } catch (error) {
            return { ...vote, finalResult: null };
          }
        }

        return { ...vote, finalResult: null };
      })
    );

    return votesWithResults;
  } catch (error) {
    console.error('Error in getRecentVotes:', error);
    throw error;
  }
}

/** Create a vote via VoteFactory.createVote(name, description, numberOfVoters). */
// export async function createVote(opts: {
//   writeContractAsync: WriteAsync;
//   factoryAddress: Address;
//   data: CreateVoteParams;
//   chainId?: number;
// }): Promise<`0x${string}`> {
//   const { writeContractAsync, factoryAddress, data, chainId = sepolia.id } = opts;
//   const { name, description, numberOfVoters } = data;

//   const hash = await writeContractAsync({
//     address: factoryAddress,
//     abi: (VoteFactoryJson as any).abi,
//     functionName: 'createVote',
//     args: [name, description, BigInt(numberOfVoters)],
//     chainId,
//   });
//   return hash as `0x${string}`;
// }

export async function createVote(opts: {
  writeContractAsync: WriteAsync;
  arkivWallet: WalletArkivClient;
  factoryAddress: Address;
  data: CreateVoteParams;
  chainId?: number;
}): Promise<`0x${string}`> {
  const { writeContractAsync, arkivWallet, factoryAddress, data, chainId = passetHubTestnet.id } = opts;
  // [TODO] Store description on arkiv. 
  // Instead of storing the description on the blockchain, store only the key
  const { name, description, numberOfVoters } = data;
  let timestamp = new Date();
  let proposal = new Proposal(arkivWallet, name, description, numberOfVoters, timestamp);
  let id = await getTotalVotes({factoryAddress});
  await proposal.storeDescription(id);
  let header = proposal.getHeader();

  const hash = await writeContractAsync({
    address: factoryAddress,
    abi: (VoteFactoryJson as any).abi,
    functionName: 'createVote',
    args: [header.name, header.descriptionKey, BigInt(header.numberOfVoters)],
    chainId,
  });
  return hash as `0x${string}`;
}


/** Wait for tx receipt using the singleton public client. */
export async function waitForReceipt(hash: `0x${string}`) {
  const publicClient = PublicClientSingleton.get();
  return publicClient.waitForTransactionReceipt({ hash });
}

/* ========== Optional helpers for Vote contract (inscription & vote) ========== */

export async function inscribeOnVote(opts: {
  writeContractAsync: WriteAsync;
  voteAddress: Address;
  voteAbi: any;
  functionName?: string; // default 'inscribe'
  args?: readonly unknown[];
  chainId?: number;
}): Promise<`0x${string}`> {
  const {
    writeContractAsync,
    voteAddress,
    voteAbi,
    functionName = 'inscribe',
    args = [],
    chainId = passetHubTestnet.id,
  } = opts;

  const hash = await writeContractAsync({
    address: voteAddress,
    abi: voteAbi,
    functionName,
    args,
    chainId,
  });
  return hash as `0x${string}`;
}

export async function getDecryptionShareByIndex(opts: {
  voteAddress: Address;
  index: bigint;
}): Promise<bigint> {
  const publicClient = PublicClientSingleton.get();
  const share = await publicClient.readContract({
    address: opts.voteAddress,
    abi: (VoteJson as any).abi,
    functionName: 's_decryption_shares', // or 'decryptionShares'
    args: [opts.index],
  });
  return share as bigint;
}

export async function castVoteOnVote(opts: {
  writeContractAsync: WriteAsync;
  voteAddress: Address;
  voteAbi: any;
  functionName?: string; // default 'vote'
  args?: readonly unknown[];
  chainId?: number;
}): Promise<`0x${string}`> {
  const {
    writeContractAsync,
    voteAddress,
    voteAbi,
    functionName = 'vote',
    args = [],
    chainId = passetHubTestnet.id,
  } = opts;

  const hash = await writeContractAsync({
    address: voteAddress,
    abi: voteAbi,
    functionName,
    args,
    chainId,
  });
  return hash as `0x${string}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// NEW: Types for stats
export type VoteStats = {
  maxVoters: bigint;
  inscribedCount: bigint;
  voters: Address[];
};

// Optional: override function names if your Vote.sol uses different ones
export type VoteFnNames = {
  maxVotersFn?: string;       // default: 'maxVoters' | 'numberOfVoters'
  inscribedCountFn?: string;  // default: 'inscribedCount' | 'enrolledCount'
  votersFn?: string;          // default: 'getVoters' | 'voters'
};

// ───────────────────────────────────────────────────────────────────────────────
// NEW: Read helpers (single read, trying multiple fn names)
async function readWithFallback<T = unknown>(opts: {
  address: Address;
  abi: any;
  candidates: { functionName: string; args?: readonly unknown[] }[];
}): Promise<T> {
  const publicClient = PublicClientSingleton.get();
  let lastErr: unknown;
  for (const c of opts.candidates) {
    try {
      const res = await publicClient.readContract({
        address: opts.address,
        abi: opts.abi,
        functionName: c.functionName as any,
        args: (c.args ?? []) as any,
      });
      return res as T;
    } catch (e) {
      lastErr = e;
      // try next candidate
    }
  }
  throw lastErr ?? new Error('No matching function found on contract');
}

// ───────────────────────────────────────────────────────────────────────────────
// NEW: Individual getters
export async function getVoteMaxVoters(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<bigint> {
  const { voteAddress, voteAbi, fnNames } = opts;
  const name = fnNames?.maxVotersFn;
  return readWithFallback<bigint>({
    address: voteAddress,
    abi: voteAbi,
    candidates: [
      { functionName: name ?? 's_maximalNumberOfVoters' },
      { functionName: name ?? 'maxVoters' },
      { functionName: name ?? 'numberOfVoters' },
    ],
  });
}

export async function getVoteInscribedCount(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<bigint> {
  const { voteAddress, voteAbi, fnNames } = opts;
  const name = fnNames?.inscribedCountFn;
  return readWithFallback<bigint>({
    address: voteAddress,
    abi: voteAbi,
    candidates: [
      { functionName: name ?? 's_enscribedVoters' },
      { functionName: name ?? 'inscribedCount' },
      { functionName: name ?? 'enrolledCount' },
    ],
  });
}

export async function getVoteVoters(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<Address[]> {
  const { voteAddress, voteAbi, fnNames } = opts;
  const name = fnNames?.votersFn;

  // The Vote contract uses s_voters array which returns individual Voter structs
  // We need to get the voter addresses from the Voter structs
  const publicClient = PublicClientSingleton.get();

  try {
    // First try to get the count of voters
    const voterCount = await readWithFallback<bigint>({
      address: opts.voteAddress,
      abi: opts.voteAbi,
      candidates: [
        { functionName: 's_enscribedVoters' },
        { functionName: 'getVotersCount' },
      ],
    });

    // Then fetch each voter from the s_voters array
    const voters: Address[] = [];
    for (let i = 0; i < Number(voterCount); i++) {
      const voter = await publicClient.readContract({
        address: opts.voteAddress,
        abi: opts.voteAbi,
        functionName: 's_voters',
        args: [BigInt(i)],
      }) as any;
      // voter is a struct [voterAddress, hasVoted]
      voters.push(voter[0] as Address);
    }

    return voters;
  } catch (error) {
    console.error('Failed to get voters:', error);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// NEW: One-shot stats (multicall)
export async function getVoteStats(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<VoteStats> {
  const publicClient = PublicClientSingleton.get();
  const { voteAddress, voteAbi, fnNames } = opts;

  // Plan A: try a fast multicall using the default names
  const defaultCalls = [
    { functionName: fnNames?.maxVotersFn ?? 'maxVoters' },
    { functionName: fnNames?.inscribedCountFn ?? 'inscribedCount' },
    { functionName: fnNames?.votersFn ?? 'getVoters' },
  ] as const;

  // Use individual calls instead of multicall (Passet Hub doesn't support multicall3)
  try {
    const [maxVoters, inscribedCount, voters] = await Promise.all([
      getVoteMaxVoters({ voteAddress, voteAbi, fnNames }),
      getVoteInscribedCount({ voteAddress, voteAbi, fnNames }),
      getVoteVoters({ voteAddress, voteAbi, fnNames }),
    ]);
    return { maxVoters, inscribedCount, voters };
  } catch (error) {
    console.error('Failed to get vote stats:', error);
    throw error;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// OPTIONAL: Batch stats for many Vote contracts (efficient UI hydration)
export async function getManyVoteStats(opts: {
  votes: { voteAddress: Address; voteAbi: any; fnNames?: VoteFnNames }[];
}): Promise<Record<string, VoteStats>> {
  const results: Record<string, VoteStats> = {};
  await Promise.all(
    opts.votes.map(async (v) => {
      results[v.voteAddress] = await getVoteStats(v);
    })
  );
  return results;
}

export async function enscribeVoterTx(opts: {
  writeContractAsync: WriteContractMutateAsync<any, unknown>;
  voteAddress: Address;
  voteAbi: any;
  proof: `0x${string}`;                  // bytes
  encryptedRandomValue: `0x${string}`;   // 32-byte hex
  chainId?: number;
}): Promise<`0x${string}`> {
  const {
    writeContractAsync,
    voteAddress,
    voteAbi,
    proof,
    encryptedRandomValue,
    chainId = passetHubTestnet.id,
  } = opts;

  // NOTE: Vote.sol method is enscribeVoter(bytes, bytes32)
  return inscribeOnVote({
    writeContractAsync,
    voteAddress,
    voteAbi,
    functionName: 'enscribeVoter',
    args: [proof, encryptedRandomValue],
    chainId,
  });
}

export async function getRegisteredVoters(opts: {
  voteAddress: Address;
}): Promise<{ voters: Address[]; hasVoted: boolean[] }> {
  const publicClient = PublicClientSingleton.get();
  const { voteAddress } = opts;

  try {
    // Get the count of enscribed voters
    const voterCount = await publicClient.readContract({
      address: voteAddress,
      abi: (VoteJson as any).abi,
      functionName: 's_enscribedVoters',
      args: [],
    }) as bigint;

    const voters: Address[] = [];
    const hasVoted: boolean[] = [];

    // Fetch each voter from the s_voters array
    for (let i = 0; i < Number(voterCount); i++) {
      const voter = await publicClient.readContract({
        address: voteAddress,
        abi: (VoteJson as any).abi,
        functionName: 's_voters',
        args: [BigInt(i)],
      }) as any;

      // voter is a struct [voterAddress, hasVoted]
      voters.push(voter[0] as Address);
      hasVoted.push(voter[1] as boolean);
    }

    return { voters, hasVoted };
  } catch (error) {
    console.error(`Failed to get registered voters for ${voteAddress}:`, error);
    return { voters: [], hasVoted: [] };
  }
}

export async function getFinalVoteResult(voteAddress: `0x${string}`) {
    const publicClient = PublicClientSingleton.get();

  try {
    const result = await publicClient.readContract({
      address: voteAddress,
      abi: VoteJson.abi,
      functionName: 'get_finalVote',
    });
    return result as boolean;
  } catch (error) {
    // If the vote is not finalized yet, this will throw an error
    console.log('Vote not finalized yet:', error);
    return null;
  }
}