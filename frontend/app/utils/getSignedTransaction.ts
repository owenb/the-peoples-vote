// frontend/app/utils/getSignedTransaction.ts
import { getPublicClient, getWalletClient } from '@wagmi/core'
import type {
  Abi,
  Address,
  Hex,
  SendTransactionParameters,
} from 'viem'
import { config } from '../config/wagmi'

export type ChainId = (typeof config)['chains'][number]['id']

export type GetSignedTransactionParams = {
  address: Address
  abi: Abi
  functionName: string
  args: readonly unknown[]
  account: Address
  chainId: ChainId
}

export type GetSignedTransactionResult = {
  request: SendTransactionParameters
  signedTx: Hex
}

export async function getSignedTransaction(
  params: GetSignedTransactionParams,
): Promise<GetSignedTransactionResult> {
  const { address, abi, functionName, args, account, chainId } = params

  // viem clients from wagmi – type-narrowed to avoid insane unions
  const publicClient = getPublicClient(config, { chainId }) as any
  const walletClient = (await getWalletClient(config, { chainId })) as any

  if (!walletClient) {
    throw new Error('No wallet client available (wallet not connected?)')
  }

  // 1) Build the tx request (no signing, no send)
  const { request } = await publicClient.simulateContract({
    address,
    abi,
    functionName,
    args,
    account,
  })

  // 2) Sign the transaction, but DO NOT send it
  const signedTx = await walletClient.signTransaction(
    request as SendTransactionParameters,
  )

  return {
    request: request as SendTransactionParameters,
    signedTx,
  }
}
