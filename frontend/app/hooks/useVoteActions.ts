/**
 * React hook for vote contract write operations
 *
 * Handles:
 * - Voter registration (inscription with ZK proof)
 * - Vote submission (yes/no with ZK proof)
 * - Loading states
 * - Error handling
 * - Transaction logs
 */

'use client';

import { useState, useCallback } from 'react';
import { useWriteContract } from 'wagmi';
import type { Address } from 'viem';

import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';
import {
  waitForReceipt,
  castVoteOnVote,
} from '../utils/vote';

import Crypto, {
  getRandomValue,
  modExp,
  bigIntToBytes32,
  generateInscriptionProof,
  generateVotingProof,
  u8ToHex,
} from '../utils/cryptography';

export interface VoteActionsResult {
  inscribe: () => Promise<{ success: boolean; txHash?: string; error?: unknown }>;
  vote: (value: boolean) => Promise<{ success: boolean; txHash?: string; error?: unknown }>;
  isBusy: boolean;
  logs: string[];
  clearLogs: () => void;
}

export function useVoteActions(voteAddress: Address): VoteActionsResult {
  const { writeContractAsync } = useWriteContract();
  const [isBusy, setIsBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = useCallback((msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const inscribe = useCallback(async () => {
    try {
      setIsBusy(true);
      appendLog('🔐 Starting voter registration...');

      // 1. Generate random value for inscription
      appendLog('🎲 Generating random value...');
      const randomValue = getRandomValue();
      const randomHex = bigIntToBytes32(randomValue);

      // 2. Encrypt the random value
      appendLog('🔒 Encrypting random value...');
      const encryptedRandomValue = modExp(Crypto.generator, randomValue);
      const encryptedRandomValueHex = bigIntToBytes32(encryptedRandomValue);

      // 3. Generate ZK proof
      appendLog('⚙️ Generating zero-knowledge proof...');
      const { proof, publicInputs } = await generateInscriptionProof(
        randomHex,
        encryptedRandomValueHex,
        (msg) => appendLog(`  ${msg}`)
      );

      appendLog(`✅ Proof generated (${proof.length} bytes)`);
      const proofHex = u8ToHex(proof);

      // 4. Submit to contract
      appendLog('📤 Submitting registration to blockchain...');
      const txHash = await writeContractAsync({
        address: voteAddress,
        abi: VoteJson.abi as any,
        functionName: 'enscribeVoter',
        args: [proofHex, encryptedRandomValueHex],
      });

      appendLog(`✅ Transaction sent: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);

      // 5. Wait for confirmation
      appendLog('⏳ Waiting for confirmation...');
      const receipt = await waitForReceipt(txHash);
      appendLog(`✅ Confirmed in block ${receipt.blockNumber?.toString() ?? 'unknown'}`);
      appendLog('🎉 Registration complete!');

      return { success: true, txHash };
    } catch (error: any) {
      console.error('Inscription failed:', error);
      appendLog(`❌ Error: ${error.message || String(error)}`);
      return { success: false, error };
    } finally {
      setIsBusy(false);
    }
  }, [voteAddress, writeContractAsync, appendLog]);

  const vote = useCallback(async (value: boolean) => {
    try {
      setIsBusy(true);
      appendLog(`🗳️ Starting vote submission (${value ? 'YES' : 'NO'})...`);

      // 1. Prepare vote value
      const voteDegree = value ? 1n : 0n;
      const voteHex = bigIntToBytes32(voteDegree);

      // 2. Encrypt the vote
      appendLog('🔒 Encrypting vote...');
      const enc = modExp(Crypto.generator, voteDegree);
      const encHex = bigIntToBytes32(enc);

      // 3. Generate ZK proof
      appendLog('⚙️ Generating zero-knowledge proof...');
      const { proof, publicInputs } = await generateVotingProof(
        voteHex,
        encHex,
        (msg) => appendLog(`  ${msg}`)
      );

      // 4. Verify public inputs
      appendLog('🔍 Verifying proof inputs...');
      if (
        BigInt(publicInputs[0]) !== BigInt(Crypto.generator) ||
        BigInt(publicInputs[1]) !== BigInt(enc)
      ) {
        const errorMsg = '❌ Public inputs mismatch - aborting';
        appendLog(errorMsg);
        throw new Error(errorMsg);
      }
      appendLog('✅ Proof inputs verified');

      const proofHex = u8ToHex(proof);

      // 5. Submit vote to contract
      appendLog('📤 Submitting vote to blockchain...');
      const txHash = await castVoteOnVote({
        writeContractAsync,
        voteAddress,
        voteAbi: VoteJson.abi as any,
        functionName: 'vote',
        args: [proofHex, encHex],
      });

      appendLog(`✅ Transaction sent: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);

      // 6. Wait for confirmation
      appendLog('⏳ Waiting for confirmation...');
      const receipt = await waitForReceipt(txHash);
      appendLog(`✅ Confirmed in block ${receipt.blockNumber?.toString() ?? 'unknown'}`);
      appendLog('🎉 Vote submitted successfully!');

      return { success: true, txHash };
    } catch (error: any) {
      console.error('Vote failed:', error);
      appendLog(`❌ Error: ${error.message || String(error)}`);
      return { success: false, error };
    } finally {
      setIsBusy(false);
    }
  }, [voteAddress, writeContractAsync, appendLog]);

  return { inscribe, vote, isBusy, logs, clearLogs };
}
