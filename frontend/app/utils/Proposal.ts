import type { WalletArkivClient } from "@arkiv-network/sdk";
import { storeProposalDescription } from "./arkiv";

export type ProposalDescription = {
  description: string;
};

export type ProposalHeader = {
  name: string;
  descriptionKey: string;
  numberOfVoters: number;
};

export type FullProposalData = {
  createData: ProposalHeader;
  description: ProposalDescription;
};

export class Proposal {
  readonly name: string;
  readonly description: string;
  readonly numberOfVoters: number;
  readonly expirationDate: Date;
  private readonly wallet: WalletArkivClient;

  private descriptionKey?: `0x${string}`;
  private header?: ProposalHeader;

  constructor(
    wallet: WalletArkivClient,
    name: string,
    description: string,
    numberOfVoters: number,
    expirationDate: Date,
  ) {
    this.wallet = wallet;
    this.name = name;
    this.description = description;
    this.numberOfVoters = numberOfVoters;
    this.expirationDate = expirationDate;
  }

  private getExpiresInSeconds(): number {
    const now = Date.now();
    const diffMs = this.expirationDate.getTime() - now;
    return Math.max(60, Math.floor(diffMs / 1000));
  }

  async storeDescription(proposalId: BigInt): Promise<`0x${string}`> {
    const expiresIn = this.getExpiresInSeconds();

    const key = await storeProposalDescription(
      this.wallet,
      this.description,
      proposalId,
      expiresIn,
    );

    this.descriptionKey = key;
    this.header = {
      name: this.name,
      descriptionKey: String(proposalId),
      numberOfVoters: this.numberOfVoters,
    } as ProposalHeader;
          
    return key;
  }

  public getHeader(): ProposalHeader {
    if (!this.header) {
        throw new Error("Header has not been stored yet. Call storeHeader() first.");
    }
    return this.header;
  }

  toFullProposalData(): FullProposalData {
    return {
      createData: {
        name: this.name,
        descriptionKey: this.descriptionKey ?? "",
        numberOfVoters: this.numberOfVoters,
      },
      description: {
        description: this.description,
      },
    };
  }
}
