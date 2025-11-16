'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAccountMappingInfo,
  mapAccount,
  polkadotToEthAddress,
  disconnectApi,
} from '../utils/polkadot-revive';
import type { PolkadotAccount } from './usePolkadotWallet';

export interface AccountMappingStatus {
  isMapped: boolean;
  ethAddress?: string;
  isChecking: boolean;
  error?: string;
}

export function useAccountMapping(account: PolkadotAccount | null) {
  const [mappingStatus, setMappingStatus] = useState<AccountMappingStatus>({
    isMapped: false,
    isChecking: false,
  });
  const [isMapping, setIsMapping] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);

  /**
   * Check if the current account is mapped
   */
  const checkMapping = useCallback(async () => {
    if (!account) {
      setMappingStatus({ isMapped: false, isChecking: false });
      return;
    }

    setMappingStatus((prev) => ({ ...prev, isChecking: true, error: undefined }));

    try {
      const info = await getAccountMappingInfo(account.address);
      setMappingStatus({
        isMapped: info.isMapped,
        ethAddress: info.ethAddress,
        isChecking: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check mapping status';
      setMappingStatus({
        isMapped: false,
        isChecking: false,
        error: errorMessage,
      });
      console.error('Error checking account mapping:', error);
    }
  }, [account]);

  /**
   * Map the current account
   */
  const performMapping = useCallback(async () => {
    if (!account) {
      setMappingError('No account selected');
      return false;
    }

    setIsMapping(true);
    setMappingError(null);

    try {
      // Perform the mapping transaction
      await mapAccount(account);

      // Wait a bit for the transaction to be processed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Re-check mapping status
      await checkMapping();

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to map account';
      setMappingError(errorMessage);
      console.error('Error mapping account:', error);
      return false;
    } finally {
      setIsMapping(false);
    }
  }, [account, checkMapping]);

  /**
   * Get the Ethereum address for the current account
   */
  const getEthAddress = useCallback(async (): Promise<string | null> => {
    if (!account) return null;

    try {
      // If we already have it cached, return it
      if (mappingStatus.ethAddress) {
        return mappingStatus.ethAddress;
      }

      // Otherwise fetch it
      const ethAddress = await polkadotToEthAddress(account.address);
      setMappingStatus((prev) => ({ ...prev, ethAddress }));
      return ethAddress;
    } catch (error) {
      console.error('Error getting Ethereum address:', error);
      return null;
    }
  }, [account, mappingStatus.ethAddress]);

  /**
   * Check mapping status when account changes
   */
  useEffect(() => {
    checkMapping();
  }, [checkMapping]);

  /**
   * Cleanup API connection on unmount
   */
  useEffect(() => {
    return () => {
      disconnectApi().catch(console.error);
    };
  }, []);

  return {
    mappingStatus,
    isMapping,
    mappingError,
    performMapping,
    checkMapping,
    getEthAddress,
  };
}
