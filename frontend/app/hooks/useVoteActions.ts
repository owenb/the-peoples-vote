/**
 * React hook for vote contract write operations
 *
 * Handles:
 * - Voter registration (inscription with ZK proof)
 * - Vote submission (yes/no with ZK proof)
 * - Mixnet transaction routing
 * - Loading states
 * - Error handling
 * - Transaction logs
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { Address, Abi } from 'viem';

import { getSignedTransaction } from '../utils/getSignedTransaction';
import type { ChainId } from '../utils/getSignedTransaction';
import { paseoAssetHub } from '../config/wagmi';

import Crypto, {
  getRandomValue,
  modExp,
  bigIntToBytes32,
  generateInscriptionProof,
  generateVotingProof,
  u8ToHex,
} from '../utils/cryptography';

import { sendSignedTransaction } from '../../lib/mixnet/client';
import type { PartSendProgress } from '../../types/mixnet';

export interface VoteActionsResult {
  inscribe: () => Promise<{ success: boolean; txHash?: string; error?: unknown }>;
  vote: (value: boolean) => Promise<{ success: boolean; txHash?: string; error?: unknown }>;
  isBusy: boolean;
  logs: string[];
  clearLogs: () => void;
}

function toChainId(chainId?: number): ChainId {
  return (chainId ?? paseoAssetHub.id) as ChainId;
}

export function useVoteActions(voteAddress: Address, voteAbi: Abi): VoteActionsResult {
  const { address, chainId } = useAccount();
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
    if (!address) {
      appendLog('❌ Please connect your wallet first');
      return { success: false, error: 'No wallet connected' };
    }

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

      // 4. Sign transaction (do NOT send directly)
      appendLog('✍️ Signing transaction...');
      const { signedTx } = await getSignedTransaction({
        address: voteAddress,
        abi: voteAbi,
        functionName: 'enscribeVoter',
        args: [proofHex, encryptedRandomValueHex],
        account: address as Address,
        chainId: toChainId(chainId),
      });

      appendLog(`✅ Transaction signed: ${signedTx.slice(0, 10)}...${signedTx.slice(-8)}`);

      // 5. Send via mixnet
      appendLog('🌐 Routing through mixnet...');
      const onProgress = (progress: PartSendProgress) => {
        if (progress.status === 'sending') {
          appendLog(`📤 Sending part ${progress.partIndex + 1}/${progress.totalParts} via mixnet...`);
        }
      };

      const result = await sendSignedTransaction(signedTx, onProgress);

      if (!result.success) {
        throw new Error(result.error || 'Failed to send via mixnet');
      }

      appendLog(`✅ Transaction sent via mixnet (${result.numParts} parts)`);

      if (result.txHash) {
        appendLog(`✅ Broadcast to blockchain: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`);
        appendLog('🎉 Registration complete!');
        return { success: true, txHash: result.txHash };
      } else {
        appendLog('⏳ Transaction submitted to mixnet, awaiting confirmation...');
        return { success: true };
      }
    } catch (error: any) {
      console.error('Inscription failed:', error);
      appendLog(`❌ Error: ${error.message || String(error)}`);
      return { success: false, error };
    } finally {
      setIsBusy(false);
    }
  }, [voteAddress, voteAbi, address, chainId, appendLog]);

  const vote = useCallback(async (value: boolean) => {
    if (!address) {
      appendLog('❌ Please connect your wallet first');
      return { success: false, error: 'No wallet connected' };
    }

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

      // 5. Sign transaction (do NOT send directly)
      appendLog('✍️ Signing transaction...');
      const { signedTx } = await getSignedTransaction({
        address: voteAddress,
        abi: voteAbi,
        functionName: 'vote',
        args: [proofHex, encHex],
        account: address as Address,
        chainId: toChainId(chainId),
      });

      appendLog(`✅ Transaction signed: ${signedTx.slice(0, 10)}...${signedTx.slice(-8)}`);

      // 6. Send via mixnet
      appendLog('🌐 Routing through mixnet...');
      const onProgress = (progress: PartSendProgress) => {
        if (progress.status === 'sending') {
          appendLog(`📤 Sending part ${progress.partIndex + 1}/${progress.totalParts} via mixnet...`);
        }
      };

      const result = await sendSignedTransaction(signedTx, onProgress);

      if (!result.success) {
        throw new Error(result.error || 'Failed to send via mixnet');
      }

      appendLog(`✅ Transaction sent via mixnet (${result.numParts} parts)`);

      if (result.txHash) {
        appendLog(`✅ Broadcast to blockchain: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`);
        appendLog('🎉 Vote submitted successfully!');
        return { success: true, txHash: result.txHash };
      } else {
        appendLog('⏳ Transaction submitted to mixnet, awaiting confirmation...');
        return { success: true };
      }
    } catch (error: any) {
      console.error('Vote failed:', error);
      appendLog(`❌ Error: ${error.message || String(error)}`);
      return { success: false, error };
    } finally {
      setIsBusy(false);
    }
  }, [voteAddress, voteAbi, address, chainId, appendLog]);

  return { inscribe, vote, isBusy, logs, clearLogs };
}
