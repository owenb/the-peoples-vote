'use client';

import { useState, useEffect, useCallback } from 'react';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

export interface PolkadotAccount {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

export function usePolkadotWallet() {
  const [accounts, setAccounts] = useState<PolkadotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PolkadotAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect to Polkadot wallet extension
   */
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Enable the extension
      const extensions = await web3Enable('The Peoples Vote');

      if (extensions.length === 0) {
        throw new Error(
          'No Polkadot wallet extension found. Please install Talisman, SubWallet, or Polkadot.js extension.'
        );
      }

      // Get all accounts
      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your Polkadot wallet.');
      }

      // Transform accounts to our format
      const transformedAccounts = allAccounts.map((account: InjectedAccountWithMeta) => ({
        address: account.address,
        meta: {
          name: account.meta.name,
          source: account.meta.source,
        },
      }));

      setAccounts(transformedAccounts);
      setIsConnected(true);

      // Auto-select first account if none selected
      if (!selectedAccount && transformedAccounts.length > 0) {
        setSelectedAccount(transformedAccounts[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to wallet';
      setError(errorMessage);
      console.error('Error connecting to Polkadot wallet:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  /**
   * Disconnect from wallet
   */
  const disconnect = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(null);
    setIsConnected(false);
    setError(null);
  }, []);

  /**
   * Select a specific account
   */
  const selectAccount = useCallback((account: PolkadotAccount) => {
    setSelectedAccount(account);
  }, []);

  /**
   * Get injector for signing transactions
   */
  const getInjector = useCallback(async (address: string) => {
    try {
      return await web3FromAddress(address);
    } catch (err) {
      console.error('Error getting injector:', err);
      throw err;
    }
  }, []);

  /**
   * Check if extension is available on mount
   */
  useEffect(() => {
    const checkExtension = async () => {
      try {
        // Check if extension is already authorized
        const extensions = await web3Enable('The Peoples Vote');
        if (extensions.length > 0) {
          // Silently get accounts if already authorized
          const allAccounts = await web3Accounts();
          if (allAccounts.length > 0) {
            const transformedAccounts = allAccounts.map((account: InjectedAccountWithMeta) => ({
              address: account.address,
              meta: {
                name: account.meta.name,
                source: account.meta.source,
              },
            }));
            setAccounts(transformedAccounts);
            setIsConnected(true);
            if (transformedAccounts.length > 0) {
              setSelectedAccount(transformedAccounts[0]);
            }
          }
        }
      } catch (err) {
        // Silently fail - user hasn't connected yet
        console.debug('Extension not yet authorized');
      }
    };

    checkExtension();
  }, []);

  return {
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    selectAccount,
    getInjector,
  };
}
