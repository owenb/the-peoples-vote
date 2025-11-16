import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import { SyncService } from '../services/sync.service.js';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

export function createServer() {
  const app = express();
  const syncService = new SyncService();

  // Middleware
  app.use(express.json());

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
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
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Get all proposals
   */
  app.get('/proposals', (req: Request, res: Response) => {
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
   * Get proposal by ID
   */
  app.get('/proposals/:id', (req: Request, res: Response) => {
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
  app.get('/proposals/polkassembly/:polkassemblyId', (req: Request, res: Response) => {
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
   * Get statistics
   */
  app.get('/stats', (req: Request, res: Response) => {
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
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
