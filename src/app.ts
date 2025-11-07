import express, { Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { initializeElasticsearch } from './config/elasticsearch';
import { imapManager } from './services/imap/imapManager';
import { emailProcessor } from './services/EmailProcessor';
import { redisClient } from './config/redis';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import accountsRoutes from './routes/accounts.routes';
import syncRoutes from './routes/sync.routes';
import emailsRoutes from './routes/emails.routes';
import integrationsRoutes from './routes/integrations.routes';

const app: Application = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    accounts: imapManager.getAccountCount(),
  });
});

// API Routes
app.use('/api/accounts', accountsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/integrations', integrationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Restore accounts from Redis
async function restoreAccounts() {
  try {
    const keys = await redisClient.keys('account:*');
    logger.info(`Found ${keys.length} stored accounts`);

    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        const account = JSON.parse(data);
        await imapManager.addAccount(account);
        logger.info(`Restored account: ${account.email}`);
      }
    }

    logger.info(`Restored ${keys.length} accounts successfully`);
  } catch (error) {
    logger.error('Failed to restore accounts:', error);
  }
}

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Elasticsearch
    await initializeElasticsearch();
    logger.info('Elasticsearch initialized');

    // Restore accounts from Redis
    await restoreAccounts();

    // Set up IMAP manager event listeners
    imapManager.on('email', async (email) => {
      logger.info(`New email received: ${email.subject}`);
      await emailProcessor.processEmail(email);
    });

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  imapManager.stopAllSyncs();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  imapManager.stopAllSyncs();
  process.exit(0);
});

// Start the server
startServer();

export default app;
