import { ProposalDatabase } from '../database/db.js';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

async function main() {
  logger.info({ msg: 'Initializing database...' });

  // Creating a new database instance will automatically initialize tables
  const database = new ProposalDatabase(settings.database.path);

  logger.info({
    msg: '✓ Database initialized successfully',
    path: settings.database.path,
  });

  database.close();
}

main();
