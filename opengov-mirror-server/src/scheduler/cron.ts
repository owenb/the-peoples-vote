import cron from 'node-cron';
import { SyncService } from '../services/sync.service.js';
import { settings } from '../config.js';
import { logger } from '../utils/logger.js';

export class Scheduler {
  private syncService: SyncService;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.syncService = new SyncService();
  }

  /**
   * Start the cron job
   */
  start(): void {
    // Cron expression: Run every N hours
    const hours = settings.cron.syncIntervalHours;
    const cronExpression = `0 */${hours} * * *`; // Every N hours at minute 0

    logger.info({
      msg: 'Starting cron scheduler',
      interval: `${hours} hour(s)`,
      expression: cronExpression,
    });

    this.task = cron.schedule(cronExpression, async () => {
      logger.info({ msg: '⏰ Cron job triggered' });
      try {
        await this.syncService.syncProposals();
      } catch (error) {
        logger.error({
          msg: 'Cron job failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    logger.info({ msg: '✓ Cron scheduler started' });
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info({ msg: 'Cron scheduler stopped' });
    }
  }

  /**
   * Run sync immediately (outside of schedule)
   */
  async runNow(): Promise<void> {
    logger.info({ msg: 'Running sync immediately' });
    await this.syncService.syncProposals();
  }
}

// Singleton instance
export const scheduler = new Scheduler();
