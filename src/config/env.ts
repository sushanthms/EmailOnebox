import dotenv from 'dotenv';
import { validateEnv } from './validation';

dotenv.config();
validateEnv(); // ADDED - Validate on load

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'emails',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },
  
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
  },
  
  webhook: {
    url: process.env.WEBHOOK_URL || '',
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-me-32-characters-long!!',
  },
};