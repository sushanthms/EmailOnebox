import { Email, EmailCategory } from '../types';
import { emailIndexer } from './elasticsearch/emailIndexer';
import { emailCategorizer } from './ai/EmailCategorizer';
import { slackNotifier } from './integrations/SlackNotifier';
import { webhookDispatcher } from './integrations/WebhookDispatcher';
import logger from '../utils/logger';

export class EmailProcessor {
  async processEmail(email: Email): Promise<void> {
    try {
      logger.info(`Processing email: ${email.subject}`);

      // Step 1: Categorize with AI
      const category = await emailCategorizer.categorizeEmail(email);
      email.category = category;

      // Step 2: Index in Elasticsearch
      await emailIndexer.indexEmail(email);

      // Step 3: Handle "Interested" category
      if (category === EmailCategory.INTERESTED) {
        await this.handleInterestedEmail(email);
      }

      logger.info(`Email processed successfully: ${email.messageId}`);
    } catch (error) {
      logger.error('Error processing email:', error);
      // Still try to index without category
      try {
        email.category = EmailCategory.UNCATEGORIZED;
        await emailIndexer.indexEmail(email);
      } catch (indexError) {
        logger.error('Failed to index email:', indexError);
      }
    }
  }

  private async handleInterestedEmail(email: Email): Promise<void> {
    try {
      // Send Slack notification
      await slackNotifier.sendInterestedNotification(email);

      // Dispatch webhook
      await webhookDispatcher.dispatchInterestedEmail(email);

      logger.info(`Interested email handlers completed for: ${email.messageId}`);
    } catch (error) {
      logger.error('Error in interested email handlers:', error);
      // Don't throw - these are non-critical operations
    }
  }

  async processBatch(emails: Email[]): Promise<void> {
    logger.info(`Processing batch of ${emails.length} emails`);

    for (const email of emails) {
      await this.processEmail(email);
    }

    logger.info('Batch processing completed');
  }
}

export const emailProcessor = new EmailProcessor();