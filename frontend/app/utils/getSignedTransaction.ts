// frontend/app/utils/getSignedTransaction.ts
import { getWalletClient } from '@wagmi/core'
import type {
  Abi,
  Address,
  Hex,
  SendTransactionParameters,
} from 'viem'
import { encodeFunctionData } from 'viem'
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

  // Get wallet client only - no RPC client needed
  const walletClient = (await getWalletClient(config, { chainId })) as any

  if (!walletClient) {
    throw new Error('No wallet client available (wallet not connected?)')
  }

  // 1) Encode the contract function call locally (no RPC needed)
  const data = encodeFunctionData({
    abi,
    functionName,
    args,
  })

  // 2) Build minimal transaction request
  //    The wallet will fill in nonce, gas, and fees via its own provider
  const request: SendTransactionParameters = {
    to: address,
    data,
    account,
    chainId,
    value: 0n,
  }

  // 3) Sign the transaction (wallet handles nonce/gas internally)
  const signedTx = await walletClient.signTransaction(request)

  return {
    request,
    signedTx,
  }
}
