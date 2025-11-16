import pino from 'pino';
import { settings } from '../config.js';

export const logger = pino({
  level: settings.server.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});
