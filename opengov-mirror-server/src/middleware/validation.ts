import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Validate pagination parameters
 */
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

  if (limit !== undefined) {
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return res.status(400).json({
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
      });
    }
  }

  if (offset !== undefined) {
    if (isNaN(offset) || offset < 0) {
      return res.status(400).json({
        error: 'Invalid offset parameter. Must be non-negative.',
      });
    }
  }

  next();
}

/**
 * Validate ID parameter
 */
export function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id < 1) {
    return res.status(400).json({
      error: 'Invalid ID parameter. Must be a positive integer.',
    });
  }

  next();
}

/**
 * Validate Polkassembly ID parameter
 */
export function validatePolkassemblyIdParam(req: Request, res: Response, next: NextFunction) {
  const polkassemblyId = parseInt(req.params.polkassemblyId);

  if (isNaN(polkassemblyId) || polkassemblyId < 1) {
    return res.status(400).json({
      error: 'Invalid Polkassembly ID parameter. Must be a positive integer.',
    });
  }

  next();
}

/**
 * Validate processing status query parameter
 */
export function validateStatusQuery(req: Request, res: Response, next: NextFunction) {
  const status = req.query.status as string | undefined;

  if (status) {
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status parameter. Must be one of: ${validStatuses.join(', ')}.`,
      });
    }
  }

  next();
}

/**
 * Rate limiting - simple in-memory implementation
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(windowMs: number = 60000, maxRequests: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      // New window
      requestCounts.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (clientData.count >= maxRequests) {
      logger.warn({
        msg: 'Rate limit exceeded',
        ip: clientIp,
        path: req.path,
      });
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    clientData.count++;
    next();
  };
}
