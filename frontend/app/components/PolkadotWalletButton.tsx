'use client';

import { useState } from 'react';
import { usePolkadotWallet } from '../hooks/usePolkadotWallet';

export function PolkadotWalletButton() {
  const {
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    selectAccount,
  } = usePolkadotWallet();

  const [showAccountSelect, setShowAccountSelect] = useState(false);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
    setShowAccountSelect(false);
  };

  const handleAccountSelect = (account: typeof accounts[0]) => {
    selectAccount(account);
    setShowAccountSelect(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white/80 backdrop-blur-xl"
        style={{ fontFamily: 'Handjet, monospace' }}
      >
        Connecting...
      </button>
    );
  }

  if (!isConnected) {
    return (
      <div>
        <button
          onClick={handleConnect}
          className="rounded-full border border-[#00FF88] bg-gradient-to-r from-[#00FF88] to-[#00CCFF] px-6 py-2 text-white transition hover:from-[#00CCFF] hover:to-[#00FF88]"
          style={{ fontFamily: 'Handjet, monospace' }}
        >
          Connect Polkadot Wallet
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-400" style={{ fontFamily: 'Handjet, monospace' }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAccountSelect(!showAccountSelect)}
          className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white backdrop-blur-xl transition hover:bg-white/20"
          style={{ fontFamily: 'Handjet, monospace' }}
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#00FF88]"></div>
            <span>{selectedAccount?.meta.name || truncateAddress(selectedAccount?.address || '')}</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <button
          onClick={handleDisconnect}
          className="rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur-xl transition hover:bg-white/20"
          title="Disconnect"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Account Selection Dropdown */}
      {showAccountSelect && accounts.length > 1 && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-xl">
          <div className="mb-2 px-3 py-2 text-sm text-white/60" style={{ fontFamily: 'Handjet, monospace' }}>
            Select Account
          </div>
          {accounts.map((account) => (
            <button
              key={account.address}
              onClick={() => handleAccountSelect(account)}
              className={`w-full rounded-xl px-3 py-2 text-left text-white transition hover:bg-white/20 ${
                selectedAccount?.address === account.address ? 'bg-white/20' : ''
              }`}
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              <div className="font-medium">{account.meta.name || 'Unnamed Account'}</div>
              <div className="text-sm text-white/60">{truncateAddress(account.address)}</div>
              <div className="text-xs text-white/40">{account.meta.source}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
