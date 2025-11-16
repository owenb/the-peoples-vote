'use client';

/**
 * Example component showing how to integrate Polkadot wallet connection,
 * account mapping, and contract interaction in a single voting interface.
 *
 * This component demonstrates the complete user flow:
 * 1. Connect Polkadot wallet
 * 2. Check and perform account mapping
 * 3. Cast votes on the smart contract
 */

import { PolkadotVoting } from './PolkadotVoting';

export default function PolkadotVotingExample() {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="mb-4 text-4xl font-bold text-white md:text-5xl"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            Polkadot Governance Voting
          </h1>
          <p
            className="text-lg text-white/80"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            Connect your Polkadot wallet and participate in on-chain governance
          </p>
        </div>

        {/* Main Voting Component */}
        <PolkadotVoting
          proposalId="1768"
          proposalTitle="Ratify Approved Referendum #1768 - execution error due to AH migration"
        />

        {/* Information Section */}
        <div className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
          <h2
            className="mb-4 text-2xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            How It Works
          </h2>

          <div className="space-y-4 text-white/80" style={{ fontFamily: 'Handjet, monospace' }}>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF88] text-sm font-bold text-black">
                1
              </div>
              <div>
                <h3 className="mb-1 font-bold text-white">Connect Your Wallet</h3>
                <p className="text-sm">
                  Click "Connect Polkadot Wallet" and approve the connection in your wallet extension
                  (Talisman, SubWallet, or Polkadot.js).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00CCFF] text-sm font-bold text-black">
                2
              </div>
              <div>
                <h3 className="mb-1 font-bold text-white">Map Your Account</h3>
                <p className="text-sm">
                  If this is your first time, you'll need to map your Polkadot account. This is a
                  one-time operation that links your Polkadot address to an Ethereum-compatible
                  address for smart contract interactions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF00FF] text-sm font-bold text-black">
                3
              </div>
              <div>
                <h3 className="mb-1 font-bold text-white">Cast Your Vote</h3>
                <p className="text-sm">
                  Once mapped, you can vote on proposals. Your vote is recorded on-chain using your
                  mapped Ethereum address.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#FF00FF]/20 bg-[#FF00FF]/10 p-4">
            <h4 className="mb-2 font-bold text-white" style={{ fontFamily: 'Handjet, monospace' }}>
              💡 Need Test Tokens?
            </h4>
            <p className="text-sm text-white/80" style={{ fontFamily: 'Handjet, monospace' }}>
              Get PAS test tokens from the{' '}
              <a
                href="https://faucet.polkadot.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF00FF] hover:text-[#FF1493]"
              >
                Paseo Faucet
              </a>
              . You'll need a small amount for transaction fees.
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <details className="mt-6 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl">
          <summary
            className="cursor-pointer p-6 text-xl font-bold text-white hover:bg-white/5"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            🔧 Technical Details
          </summary>

          <div className="border-t border-white/20 p-6">
            <div
              className="space-y-4 text-sm text-white/80"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              <div>
                <h4 className="mb-2 font-bold text-white">Network</h4>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Chain: Paseo Asset Hub Testnet</li>
                  <li>RPC: testnet-passet-hub-eth-rpc.polkadot.io</li>
                  <li>WebSocket: paseo-asset-hub-rpc.polkadot.io</li>
                  <li>Chain ID: 420420422</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-bold text-white">Address Mapping</h4>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Converts Polkadot (32-byte) addresses to Ethereum (20-byte) H160 format</li>
                  <li>Uses pallet-revive runtime API for conversion</li>
                  <li>One-time mapping required per account</li>
                  <li>Mapping stored on-chain permanently</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-bold text-white">Smart Contract</h4>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Written in Solidity</li>
                  <li>Deployed on Paseo Asset Hub using pallet-revive</li>
                  <li>Interacts with H160 addresses</li>
                  <li>Handles on-chain voting and vote counting</li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
