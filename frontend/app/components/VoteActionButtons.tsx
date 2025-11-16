/**
 * Vote Action Buttons - FULLY FUNCTIONAL VERSION
 *
 * This component provides the UI for:
 * - Voter registration (with ZK proof generation)
 * - Yes/No voting (with ZK proof generation)
 * - Real transaction submission to blockchain
 * - Loading states and transaction logs
 */

'use client';

import { useVoteActions } from '../hooks/useVoteActions';
import type { Address, Abi } from 'viem';

interface VoteActionButtonsProps {
  voteAddress: Address;
  voteAbi: Abi;
  canRegister: boolean;
  canVote: boolean;
  hasVoted: boolean;
  isComplete: boolean;
  onSuccess?: () => void; // Callback to refresh data after successful action
}

export function VoteActionButtons({
  voteAddress,
  voteAbi,
  canRegister,
  canVote,
  hasVoted,
  isComplete,
  onSuccess,
}: VoteActionButtonsProps) {
  const { inscribe, vote, isBusy, logs, clearLogs } = useVoteActions(voteAddress, voteAbi);

  const handleRegister = async () => {
    const result = await inscribe();
    if (result.success) {
      onSuccess?.(); // Trigger parent to refetch data
    }
  };

  const handleVoteYes = async () => {
    const result = await vote(true);
    if (result.success) {
      onSuccess?.();
    }
  };

  const handleVoteNo = async () => {
    const result = await vote(false);
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {canRegister && (
          <button
            onClick={handleRegister}
            disabled={isBusy}
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white/80 backdrop-blur-xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {isBusy ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Registering...
              </>
            ) : (
              <>
                Register to Vote
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        )}

        {canVote && !hasVoted && (
          <div className="flex gap-3">
            <button
              onClick={handleVoteYes}
              disabled={isBusy}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-3 text-white backdrop-blur-xl transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              {isBusy ? (
                'Processing...'
              ) : (
                <>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  Vote Yes
                </>
              )}
            </button>

            <button
              onClick={handleVoteNo}
              disabled={isBusy}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-3 text-white backdrop-blur-xl transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              {isBusy ? (
                'Processing...'
              ) : (
                <>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                    />
                  </svg>
                  Vote No
                </>
              )}
            </button>
          </div>
        )}

        {hasVoted && !isComplete && (
          <div
            className="rounded-2xl border border-white/20 bg-white/5 p-4 text-center text-white/70"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            ✅ You have already voted. Waiting for others to complete voting...
          </div>
        )}

        {isComplete && (
          <div
            className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-center text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            🎉 Voting is complete!
          </div>
        )}
      </div>

      {/* Transaction Logs */}
      {logs.length > 0 && (
        <div className="rounded-2xl border border-white/20 bg-black/30 p-4 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <h4
              className="text-sm font-bold text-white/90"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Transaction Log
            </h4>
            <button
              onClick={clearLogs}
              className="text-xs text-white/50 hover:text-white/80"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className="font-mono text-xs text-white/70"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Also export individual button components for flexibility

export function RegisterButton({ voteAddress, voteAbi, onSuccess }: {
  voteAddress: Address;
  voteAbi: Abi;
  onSuccess?: () => void;
}) {
  const { inscribe, isBusy } = useVoteActions(voteAddress, voteAbi);

  const handleClick = async () => {
    const result = await inscribe();
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isBusy}
      className="mt-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white/80 backdrop-blur-xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ fontFamily: 'Handjet, monospace' }}
    >
      {isBusy ? 'Registering...' : 'Register'}
      {!isBusy && (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
    </button>
  );
}

export function VoteYesButton({ voteAddress, voteAbi, onSuccess }: {
  voteAddress: Address;
  voteAbi: Abi;
  onSuccess?: () => void;
}) {
  const { vote, isBusy } = useVoteActions(voteAddress, voteAbi);

  const handleClick = async () => {
    const result = await vote(true);
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isBusy}
      className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export function VoteNoButton({ voteAddress, voteAbi, onSuccess }: {
  voteAddress: Address;
  voteAbi: Abi;
  onSuccess?: () => void;
}) {
  const { vote, isBusy } = useVoteActions(voteAddress, voteAbi);

  const handleClick = async () => {
    const result = await vote(false);
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isBusy}
      className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
