import Redis from 'ioredis';
import { config } from './env';
import logger from '../utils/logger';

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

export default redisClient;
