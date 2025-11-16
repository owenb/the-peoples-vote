'use client';

import { useAccountMapping } from '../hooks/useAccountMapping';
import type { PolkadotAccount } from '../hooks/usePolkadotWallet';

interface AccountMappingPromptProps {
  account: PolkadotAccount | null;
  onMappingComplete?: () => void;
}

export function AccountMappingPrompt({ account, onMappingComplete }: AccountMappingPromptProps) {
  const { mappingStatus, isMapping, mappingError, performMapping, getEthAddress } =
    useAccountMapping(account);

  const handleMapAccount = async () => {
    const success = await performMapping();
    if (success && onMappingComplete) {
      onMappingComplete();
    }
  };

  const handleCopyEthAddress = async () => {
    const ethAddress = await getEthAddress();
    if (ethAddress) {
      await navigator.clipboard.writeText(ethAddress);
    }
  };

  if (!account) {
    return null;
  }

  if (mappingStatus.isChecking) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-white" style={{ fontFamily: 'Handjet, monospace' }}>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          <span>Checking account mapping status...</span>
        </div>
      </div>
    );
  }

  if (mappingStatus.error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-xl">
        <div className="text-red-400" style={{ fontFamily: 'Handjet, monospace' }}>
          <div className="mb-2 font-bold">Error Checking Mapping Status</div>
          <div className="text-sm">{mappingStatus.error}</div>
        </div>
      </div>
    );
  }

  if (mappingStatus.isMapped && mappingStatus.ethAddress) {
    return (
      <div className="rounded-2xl border border-[#00FF88]/20 bg-[#00FF88]/10 p-6 backdrop-blur-xl">
        <div className="text-white" style={{ fontFamily: 'Handjet, monospace' }}>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#00FF88]"></div>
            <span className="font-bold">Account Mapped</span>
          </div>
          <div className="mb-2 text-sm text-white/80">
            Your Polkadot account is mapped and ready to interact with smart contracts.
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3">
            <div className="mb-1 text-xs text-white/60">Ethereum Address (H160):</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-hidden text-ellipsis text-sm text-[#00FF88]">
                {mappingStatus.ethAddress}
              </code>
              <button
                onClick={handleCopyEthAddress}
                className="rounded-lg border border-white/20 bg-white/10 p-2 transition hover:bg-white/20"
                title="Copy address"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Account needs to be mapped
  return (
    <div className="rounded-2xl border border-[#FF00FF]/20 bg-[#FF00FF]/10 p-6 backdrop-blur-xl">
      <div className="text-white" style={{ fontFamily: 'Handjet, monospace' }}>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#FF00FF]"></div>
          <span className="font-bold">Account Mapping Required</span>
        </div>
        <div className="mb-4 text-sm text-white/80">
          Before you can vote or interact with smart contracts, you need to map your Polkadot account.
          This is a one-time operation that creates a connection between your Polkadot address and an
          Ethereum-compatible address.
        </div>

        <div className="mb-4 rounded-lg border border-white/20 bg-white/10 p-4">
          <div className="mb-2 text-sm font-bold text-white">What is Account Mapping?</div>
          <ul className="list-inside list-disc space-y-1 text-xs text-white/70">
            <li>Links your Polkadot account to an Ethereum-compatible address</li>
            <li>Required for interacting with Solidity smart contracts on Paseo</li>
            <li>One-time transaction - you only need to do this once</li>
            <li>Small transaction fee required (in PAS tokens)</li>
          </ul>
        </div>

        <button
          onClick={handleMapAccount}
          disabled={isMapping}
          className="w-full rounded-xl border border-[#FF00FF] bg-gradient-to-r from-[#FF00FF] to-[#FF1493] px-6 py-3 font-bold text-white transition hover:from-[#FF1493] hover:to-[#FF00FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMapping ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              Mapping Account...
            </span>
          ) : (
            'Map Account Now'
          )}
        </button>

        {mappingError && (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <div className="mb-1 font-bold">Mapping Failed</div>
            <div>{mappingError}</div>
          </div>
        )}

        <div className="mt-4 text-xs text-white/60">
          Make sure you have enough PAS tokens in your account to pay for the transaction fee.
        </div>
      </div>
    </div>
  );
}
