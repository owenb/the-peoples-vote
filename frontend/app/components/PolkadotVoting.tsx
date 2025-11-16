'use client';

import { useState } from 'react';
import { usePolkadotWallet } from '../hooks/usePolkadotWallet';
import { useAccountMapping } from '../hooks/useAccountMapping';
import { PolkadotWalletButton } from './PolkadotWalletButton';
import { AccountMappingPrompt } from './AccountMappingPrompt';

interface PolkadotVotingProps {
  proposalId: string;
  proposalTitle: string;
}

export function PolkadotVoting({ proposalId, proposalTitle }: PolkadotVotingProps) {
  const { selectedAccount, isConnected } = usePolkadotWallet();
  const { mappingStatus, getEthAddress } = useAccountMapping(selectedAccount);
  const [voteType, setVoteType] = useState<'aye' | 'nay' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (vote: 'aye' | 'nay') => {
    if (!selectedAccount || !mappingStatus.isMapped) {
      return;
    }

    setVoteType(vote);
    setIsVoting(true);

    try {
      // Get the H160 address for contract interaction
      const ethAddress = await getEthAddress();

      if (!ethAddress) {
        throw new Error('Failed to get Ethereum address');
      }

      // TODO: Implement contract interaction using ethAddress
      // This would use ethers.js or viem to interact with the Solidity contract
      console.log('Voting with Ethereum address:', ethAddress);
      console.log('Vote:', vote);
      console.log('Proposal ID:', proposalId);

      // Placeholder for contract call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(`Vote ${vote} submitted successfully!`);
    } catch (error) {
      console.error('Error voting:', error);
      alert(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsVoting(false);
      setVoteType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="flex items-center justify-end">
        <PolkadotWalletButton />
      </div>

      {/* Account Mapping Status */}
      {isConnected && selectedAccount && (
        <AccountMappingPrompt account={selectedAccount} />
      )}

      {/* Voting Section */}
      {isConnected && mappingStatus.isMapped && (
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
          <h3
            className="mb-4 text-xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            Cast Your Vote
          </h3>

          <div className="mb-4 text-sm text-white/80" style={{ fontFamily: 'Handjet, monospace' }}>
            {proposalTitle}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleVote('aye')}
              disabled={isVoting}
              className="rounded-xl border border-[#00FF88] bg-gradient-to-r from-[#00FF88]/20 to-[#00CCFF]/20 px-6 py-4 font-bold text-white transition hover:from-[#00FF88]/30 hover:to-[#00CCFF]/30 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              {isVoting && voteType === 'aye' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Voting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  Vote Aye
                </span>
              )}
            </button>

            <button
              onClick={() => handleVote('nay')}
              disabled={isVoting}
              className="rounded-xl border border-[#FF1493] bg-gradient-to-r from-[#FF00FF]/20 to-[#FF1493]/20 px-6 py-4 font-bold text-white transition hover:from-[#FF00FF]/30 hover:to-[#FF1493]/30 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              {isVoting && voteType === 'nay' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Voting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                    />
                  </svg>
                  Vote Nay
                </span>
              )}
            </button>
          </div>

          <div className="mt-4 text-xs text-white/60" style={{ fontFamily: 'Handjet, monospace' }}>
            Your vote will be recorded on-chain using your mapped Ethereum address.
          </div>
        </div>
      )}

      {/* Call to Action for Non-Connected Users */}
      {!isConnected && (
        <div className="rounded-3xl border border-white/20 bg-white/20 p-6 text-center backdrop-blur-xl">
          <div className="mb-4 text-white" style={{ fontFamily: 'Handjet, monospace' }}>
            Connect your Polkadot wallet to participate in voting
          </div>
          <div className="flex justify-center">
            <PolkadotWalletButton />
          </div>
        </div>
      )}
    </div>
  );
}
