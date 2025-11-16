import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { db } from '../database/db.js';
import { SyncService } from '../services/sync.service.js';
import { ArkivService } from '../services/arkiv.service.js';
import { PaseoService } from '../services/paseo.service.js';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';
import {
  validatePagination,
  validateIdParam,
  validatePolkassemblyIdParam,
  validateStatusQuery,
  rateLimit,
} from '../middleware/validation.js';

export function createServer() {
  const app = express();
  const syncService = new SyncService();
  const arkivService = new ArkivService();
  const paseoService = new PaseoService();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(rateLimit(60000, 100)); // 100 requests per minute

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info({
      msg: 'HTTP Request',
      method: req.method,
      path: req.path,
      query: req.query,
    });
    next();
  });

  /**
   * Health check
   */
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Detailed health check with service status
   */
  app.get('/health/detailed', async (_req: Request, res: Response) => {
    try {
      const checks = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: false,
          paseo: false,
          arkiv: false,
        },
        stats: null as any,
        paseoBalance: null as string | null,
        error: null as string | null,
      };

      // Check database
      try {
        checks.stats = db.getStats();
        checks.services.database = true;
      } catch (error) {
        logger.error({
          msg: 'Database health check failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Check Paseo connection
      try {
        const isConnected = await paseoService.checkConnection();
        checks.services.paseo = isConnected;

        if (isConnected) {
          checks.paseoBalance = await paseoService.getBalance();
        }
      } catch (error) {
        logger.error({
          msg: 'Paseo health check failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Check Arkiv (simple check - try to query)
      try {
        // Just check if we can query - don't need results
        await arkivService.queryProposals();
        checks.services.arkiv = true;
      } catch (error) {
        logger.error({
          msg: 'Arkiv health check failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Determine overall status
      const allHealthy = Object.values(checks.services).every((s) => s === true);
      const status = allHealthy ? 'healthy' : 'degraded';

      res.json({
        status,
        ...checks,
      });
    } catch (error) {
      logger.error({
        msg: 'Health check failed',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get all proposals
   */
  app.get('/proposals', validatePagination, validateStatusQuery, (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const proposals = db.getAll({
        status: status as any,
        limit,
        offset,
      });

      res.json(proposals);
    } catch (error) {
      logger.error({
        msg: 'Failed to get proposals',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Failed to fetch proposals',
      });
    }
  });

  /**
   * Get active/deciding proposals (must be before /proposals/:id)
   */
  app.get('/proposals/active', validatePagination, async (_req: Request, res: Response) => {
    try {
      // Get all completed proposals (mirrored to Paseo)
      const proposals = db.getAll({ status: 'completed' });

      // Filter for active votes (inscription or voting still open)
      const activeProposals = [];
      for (const proposal of proposals) {
        if (proposal.paseoVoteContractAddress) {
          try {
            const voteStats = await paseoService.getVoteStats(proposal.paseoVoteContractAddress);

            // Include if inscription or voting is still open
            if (voteStats.isInscriptionOpen || voteStats.isVotingOpen) {
              activeProposals.push({
                ...proposal,
                voteStats,
              });
            }
          } catch (error) {
            logger.warn({
              msg: 'Failed to get vote stats for active check',
              proposalId: proposal.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      res.json(activeProposals);
    } catch (error) {
      logger.error({
        msg: 'Failed to get active proposals',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Failed to fetch active proposals',
      });
    }
  });

  /**
   * Get proposal by ID
   */
  app.get('/proposals/:id', validateIdParam, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const proposal = db.getById(id);

      if (!proposal) {
        return res.status(404).json({
          error: 'Proposal not found',
        });
      }

      res.json(proposal);
    } catch (error) {
      logger.error({
        msg: 'Failed to get proposal',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Failed to fetch proposal',
      });
    }
  });

  /**
   * Get proposal by Polkassembly ID
   */
  app.get('/proposals/polkassembly/:polkassemblyId', validatePolkassemblyIdParam, (req: Request, res: Response) => {
    try {
      const polkassemblyId = parseInt(req.params.polkassemblyId);
      const proposal = db.getByPolkassemblyId(polkassemblyId);

      if (!proposal) {
        return res.status(404).json({
          error: 'Proposal not found',
        });
      }

      res.json(proposal);
    } catch (error) {
      logger.error({
        msg: 'Failed to get proposal',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Failed to fetch proposal',
      });
    }
  });

  /**
   * Get proposal by ID with full hydrated data (Arkiv content + Vote stats)
   */
  app.get('/proposals/:id/full', validateIdParam, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const proposal = db.getById(id);

      if (!proposal) {
        return res.status(404).json({
          error: 'Proposal not found',
        });
      }

      // Hydrate Arkiv content if available
      let arkivContent = null;
      if (proposal.arkivCid) {
        try {
          arkivContent = await arkivService.retrieveDescription(proposal.arkivCid);
        } catch (error) {
          logger.warn({
            msg: 'Failed to retrieve Arkiv content',
            proposalId: id,
            arkivCid: proposal.arkivCid,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Get vote stats if contract exists
      let voteStats = null;
      if (proposal.paseoVoteContractAddress) {
        try {
          voteStats = await paseoService.getVoteStats(proposal.paseoVoteContractAddress);
        } catch (error) {
          logger.warn({
            msg: 'Failed to retrieve vote stats',
            proposalId: id,
            contractAddress: proposal.paseoVoteContractAddress,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      res.json({
        ...proposal,
        arkivContent,
        voteStats,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to get full proposal',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Failed to fetch proposal',
      });
    }
  });

  /**
   * Get statistics
   */
  app.get('/stats', (_req: Request, res: Response) => {
    try {
      const stats = db.getStats();
      res.json(stats);
    } catch (error) {
      logger.error({
        msg: 'Failed to get stats',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Failed to fetch statistics',
      });
    }
  });

  /**
   * Trigger manual sync
   */
  app.post('/sync', async (req: Request, res: Response) => {
    try {
      logger.info({ msg: 'Manual sync triggered' });
      const result = await syncService.syncProposals();
      res.json(result);
    } catch (error) {
      logger.error({
        msg: 'Sync failed',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Sync failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Retry failed proposals
   */
  app.post('/retry-failed', async (req: Request, res: Response) => {
    try {
      logger.info({ msg: 'Retry failed triggered' });
      const result = await syncService.retryFailed();
      res.json(result);
    } catch (error) {
      logger.error({
        msg: 'Retry failed',
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Retry failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Error handling middleware
   */
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({
      msg: 'Unhandled error',
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      error: 'Internal server error',
    });
  });

  return app;
}

export function startServer() {
  const app = createServer();

  const server = app.listen(settings.server.port, settings.server.host, () => {
    logger.info({
      msg: '🚀 Server started',
      host: settings.server.host,
      port: settings.server.port,
      url: `http://${settings.server.host}:${settings.server.port}`,
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info({ msg: 'SIGTERM received, closing server' });
    server.close(() => {
      logger.info({ msg: 'Server closed' });
      db.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info({ msg: 'SIGINT received, closing server' });
    server.close(() => {
      logger.info({ msg: 'Server closed' });
      db.close();
      process.exit(0);
    });
  });

  return server;
}
