'use client';

import { useAccount } from 'wagmi';
import type { Address, Abi } from 'viem';

import { passetHubTestnet } from '../config/wagmi';
import { getSignedTransaction } from '../utils/getSignedTransaction';
import type { ChainId } from '../utils/getSignedTransaction';

import Crypto, {
  getRandomValue,
  modExp,
  bigIntToBytes32,
  generateInscriptionProof,
  generateVotingProof,
  u8ToHex,
} from '../utils/cryptography';

type BaseProps = {
  voteAddress: Address;
  voteAbi: Abi;
};

function toChainId(chainId?: number): ChainId {
  return (chainId ?? passetHubTestnet.id) as ChainId;
}

/* ───────────────── YES BUTTON – vote(true) with proof ───────────────── */

export function VoteYesButton({ voteAddress, voteAbi }: BaseProps) {
  const { address, chainId } = useAccount();

  async function handleClick() {
    if (!address) {
      console.error('Connect wallet first to vote YES');
      return;
    }

    try {
      // vote = 1 for YES
      const voteDegree = 1n;
      const voteHex = bigIntToBytes32(voteDegree);

      const enc = modExp(Crypto.generator, voteDegree);
      const encHex = bigIntToBytes32(enc);

      const { proof, publicInputs } = await generateVotingProof(
        voteHex,
        encHex,
        (msg) => console.log('[vote YES]', msg),
      );

      console.log('[vote YES] Proof size (bytes):', proof.length);
      console.log('[vote YES] publicInputs:', publicInputs);

      // Same safety check as your reference implementation
      if (
        BigInt(publicInputs[0]) !== BigInt(Crypto.generator) ||
        BigInt(publicInputs[1]) !== BigInt(enc)
      ) {
        console.error('[vote YES] ❌ Prover public inputs mismatch — aborting signing');
        return;
      }
      console.log('[vote YES] ✅ Prover public inputs match!');

      const proofHex = u8ToHex(proof);

      // Sign tx, do not send
      const { request, signedTx } = await getSignedTransaction({
        address: voteAddress,
        abi: voteAbi,
        functionName: 'vote', // vote(bytes proof, bytes32 encrypted_vote)
        args: [proofHex, encHex],
        account: address as Address,
        chainId: toChainId(chainId),
      });

      console.log('[vote YES] tx request:', request);
      console.log('[vote YES] signed raw tx:', signedTx);
    } catch (err) {
      console.error('[vote YES] error:', err);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20"
    >
      <svg
        className="h-6 w-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {/* original first icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
    </button>
  );
}

/* ───────────────── NO BUTTON – vote(false) with proof ───────────────── */

export function VoteNoButton({ voteAddress, voteAbi }: BaseProps) {
  const { address, chainId } = useAccount();

  async function handleClick() {
    if (!address) {
      console.error('Connect wallet first to vote NO');
      return;
    }

    try {
      // vote = 0 for NO
      const voteDegree = 0n;
      const voteHex = bigIntToBytes32(voteDegree);

      const enc = modExp(Crypto.generator, voteDegree);
      const encHex = bigIntToBytes32(enc);

      const { proof, publicInputs } = await generateVotingProof(
        voteHex,
        encHex,
        (msg) => console.log('[vote NO]', msg),
      );

      console.log('[vote NO] Proof size (bytes):', proof.length);
      console.log('[vote NO] publicInputs:', publicInputs);

      if (
        BigInt(publicInputs[0]) !== BigInt(Crypto.generator) ||
        BigInt(publicInputs[1]) !== BigInt(enc)
      ) {
        console.error('[vote NO] ❌ Prover public inputs mismatch — aborting signing');
        return;
      }
      console.log('[vote NO] ✅ Prover public inputs match!');

      const proofHex = u8ToHex(proof);

      const { request, signedTx } = await getSignedTransaction({
        address: voteAddress,
        abi: voteAbi,
        functionName: 'vote', // vote(bytes proof, bytes32 encrypted_vote)
        args: [proofHex, encHex],
        account: address as Address,
        chainId: toChainId(chainId),
      });

      console.log('[vote NO] tx request:', request);
      console.log('[vote NO] signed raw tx:', signedTx);
    } catch (err) {
      console.error('[vote NO] error:', err);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20"
    >
      <svg
        className="h-6 w-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {/* original second icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
        />
      </svg>
    </button>
  );
}

/* ───────────────── REGISTER BUTTON – enscribeVoter with proof ───────────────── */

export function RegisterButton({ voteAddress, voteAbi }: BaseProps) {
  const { address, chainId } = useAccount();

  async function handleClick() {
    if (!address) {
      console.error('Connect wallet first to register');
      return;
    }

    try {
      // Random value for inscription
      const randomValue = getRandomValue();             // bigint
      const randomHex = bigIntToBytes32(randomValue);   // bytes32

      const encryptedRandom = modExp(Crypto.generator, randomValue);
      const encryptedRandomHex = bigIntToBytes32(encryptedRandom); // bytes32

      const { proof, publicInputs } = await generateInscriptionProof(
        randomHex,
        encryptedRandomHex,
        (msg) => console.log('[register]', msg),
      );

      console.log('[register] Proof size (bytes):', proof.length);
      console.log('[register] publicInputs:', publicInputs);

      const proofHex = u8ToHex(proof); // bytes

      // If you want extra consistency checks, you can inspect publicInputs here

      const { request, signedTx } = await getSignedTransaction({
        address: voteAddress,
        abi: voteAbi,
        functionName: 'enscribeVoter', // enscribeVoter(bytes proof, bytes32 encrypted_random_value)
        args: [proofHex, encryptedRandomHex],
        account: address as Address,
        chainId: toChainId(chainId),
      });

      console.log('[register] tx request:', request);
      console.log('[register] signed raw tx:', signedTx);
    } catch (err) {
      console.error('[register] error:', err);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="mt-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white/80 backdrop-blur-xl transition hover:bg-white/20"
      style={{ fontFamily: 'Handjet, monospace' }}
    >
      Register
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}
