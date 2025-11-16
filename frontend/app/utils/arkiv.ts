import * as arkiv from "@arkiv-network/sdk";
import type { WalletArkivClient, PublicArkivClient } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "viem/accounts";
import { http } from "viem";
import { eq } from "@arkiv-network/sdk/query";

export type ProposalAttribute = {
  key: string;
  value: string | number;
};

export type ProposalEntity = {
  description: string;
  attributes: ProposalAttribute[];
};

export function getArkivWallet(privateKey: `0x${string}`): WalletArkivClient {
  const walletClient = arkiv.createWalletClient({
    chain: mendoza,
    transport: arkiv.http("https://mendoza.hoodi.arkiv.network/rpc"),
    account: privateKeyToAccount(privateKey) as any,
  });
  return walletClient;
}

export function getArkivRpc(): PublicArkivClient {
  const publicClient = arkiv.createPublicClient({
    chain: mendoza,
    transport: http("https://mendoza.hoodi.arkiv.network/rpc") as any,
  });

  return publicClient;
}

export async function storeProposalDescription(
  arkivWallet: WalletArkivClient,
  proposalDescription: string,
  proposalId: BigInt,
  expirationTimeInSeconds: number,
): Promise<`0x${string}`> {
  const enc = new TextEncoder();
  const timestampUtc = new Date().toISOString();

  const { entityKey: proposalKey } = await arkivWallet.createEntity({
    payload: enc.encode(proposalDescription),
    contentType: "text/plain",
    attributes: [
      { key: "type", value: "proposal" },
      { key: "id", value: proposalId.toString() },
      { key: "status", value: "open" },
      { key: "timestamp", value: timestampUtc },
    ],
    expiresIn: expirationTimeInSeconds,
  });

  console.log("Proposal key:", proposalKey);
  return proposalKey as `0x${string}`;
}

export async function getProposalById(
  arkivRpc: PublicArkivClient,
  proposalId: number,
): Promise<ProposalEntity | null> {
  const idString = proposalId.toString();

  const result = await arkivRpc
    .buildQuery()
    .where([eq("type", "proposal"), eq("id", idString)])
    .fetch();

  if (result.entities.length === 0) {
    return null;
  }

  const latest = result.entities[result.entities.length - 1] as { key: string };
  const key = latest.key as `0x${string}`;
  const fullEntity = await arkivRpc.getEntity(key);
  const decoder = new TextDecoder();
  const description = decoder.decode(fullEntity.payload);

  return {
    description,
    attributes: fullEntity.attributes as ProposalAttribute[],
  };
}
