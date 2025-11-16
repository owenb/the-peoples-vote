import { startServer } from './api/server.js';
import { scheduler } from './scheduler/cron.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info({ msg: '🚀 Starting OpenGov Mirror Server (TypeScript)' });

    // Start the HTTP server
    startServer();

    // Start the cron scheduler
    scheduler.start();

    // Run initial sync
    logger.info({ msg: 'Running initial sync...' });
    await scheduler.runNow();

    logger.info({ msg: '✓ OpenGov Mirror Server is running' });
  } catch (error) {
    logger.error({
      msg: 'Failed to start server',
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
