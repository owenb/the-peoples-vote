import { ethers } from 'ethers';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';
import voteFactoryAbi from '../contracts/VoteFactory.abi.json' assert { type: 'json' };

export interface CreateVoteParams {
  name: string;
  description: string;
  numberOfVoters: number;
}

export interface CreateVoteResult {
  contractAddress: string;
  txHash: string;
  blockNumber: number;
}

export class PaseoService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private voteFactory: ethers.Contract;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(settings.paseo.rpcUrl, {
      name: 'paseo-asset-hub',
      chainId: settings.paseo.chainId,
    });

    // Initialize wallet
    this.wallet = new ethers.Wallet(settings.paseo.privateKey, this.provider);

    // Initialize VoteFactory contract
    this.voteFactory = new ethers.Contract(
      settings.voteFactory.address,
      voteFactoryAbi,
      this.wallet
    );

    logger.info({
      msg: 'Paseo service initialized',
      rpcUrl: settings.paseo.rpcUrl,
      chainId: settings.paseo.chainId,
      walletAddress: this.wallet.address,
      voteFactoryAddress: settings.voteFactory.address,
    });
  }

  /**
   * Create a Vote contract on Paseo Asset Hub
   */
  async createVote(params: CreateVoteParams): Promise<CreateVoteResult> {
    logger.info({
      msg: 'Creating Vote contract on Paseo',
      name: params.name,
      arkivCid: params.description,
      numberOfVoters: params.numberOfVoters,
    });

    try {
      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      logger.info({
        msg: 'Wallet balance',
        address: this.wallet.address,
        balance: ethers.formatEther(balance),
      });

      // Estimate gas
      const gasEstimate = await this.voteFactory.createVote.estimateGas(
        params.name,
        params.description,
        params.numberOfVoters
      );

      logger.info({
        msg: 'Gas estimate',
        gasEstimate: gasEstimate.toString(),
      });

      // Send transaction
      const tx = await this.voteFactory.createVote(
        params.name,
        params.description,
        params.numberOfVoters,
        {
          gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
        }
      );

      logger.info({
        msg: 'Transaction sent',
        txHash: tx.hash,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      // Parse the VoteCreated event to get the contract address
      let contractAddress = '';
      let voteId = '';

      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = this.voteFactory.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });

            // VoteCreated event: (uint256 indexed id, address indexed vote, ...)
            if (parsedLog && parsedLog.name === 'VoteCreated') {
              voteId = parsedLog.args.id.toString();
              contractAddress = parsedLog.args.vote;
              logger.info({
                msg: 'Parsed VoteCreated event',
                voteId,
                contractAddress,
              });
              break;
            }
          } catch (e) {
            // Continue to next log
          }
        }
      }

      // Fallback: if we couldn't parse the event, query the contract
      if (!contractAddress) {
        logger.warn({
          msg: 'Could not parse VoteCreated event, querying contract',
        });

        const totalVotes = await this.voteFactory.totalVotes();
        const lastId = Number(totalVotes) - 1;

        if (lastId >= 0) {
          contractAddress = await this.voteFactory.getById(lastId);
          voteId = lastId.toString();
        }
      }

      logger.info({
        msg: '✓ Vote contract created on Paseo',
        contractAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return {
        contractAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to create Vote contract',
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Vote creation failed: ${error}`);
    }
  }

  /**
   * Get all created Vote contracts
   */
  async getAllVotes(): Promise<string[]> {
    try {
      const votes = await this.voteFactory.getVotes();
      return votes;
    } catch (error) {
      logger.error({
        msg: 'Failed to get votes',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check connection to Paseo RPC
   */
  async checkConnection(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      logger.info({
        msg: 'Paseo RPC connection successful',
        blockNumber,
      });
      return true;
    } catch (error) {
      logger.error({
        msg: 'Paseo RPC connection failed',
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error({
        msg: 'Failed to get balance',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
