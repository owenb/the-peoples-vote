import { SyncService } from '../services/sync.service.js';
import { logger } from '../utils/logger.js';

async function main() {
  logger.info({ msg: 'Running manual sync...' });

  const syncService = new SyncService();
  const result = await syncService.syncProposals();

  logger.info({
    msg: 'Sync completed',
    result,
  });

  process.exit(0);
}

main();
