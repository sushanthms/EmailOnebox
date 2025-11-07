import axios from 'axios';
import { config } from '../../config/env';
import { Email, EmailCategory } from '../../types';
import logger from '../../utils/logger';

export class WebhookDispatcher {
  private webhookUrl: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = config.webhook.url;
    this.enabled = !!this.webhookUrl;

    if (this.enabled) {
      logger.info(`Webhook dispatcher initialized: ${this.webhookUrl}`);
    } else {
      logger.warn('Webhook dispatcher disabled - no URL configured');
    }
  }

  async dispatchInterestedEmail(email: Email): Promise<void> {
    if (!this.enabled) {
      logger.warn('Webhook dispatching disabled');
      return;
    }

    try {
      const payload = this.buildPayload(email);

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EmailOnebox/1.0',
        },
        timeout: 10000,
      });

      logger.info(`Webhook dispatched successfully for email: ${email.messageId}`);
      logger.debug(`Webhook response status: ${response.status}`);
    } catch (error: any) {
      logger.error('Error dispatching webhook:', {
        message: error.message,
        email: email.messageId,
      });
      // Don't throw - webhooks are non-critical
    }
  }

  async dispatchCustomEvent(
    event: string,
    data: any
  ): Promise<void> {
    if (!this.enabled) {
      logger.warn('Webhook dispatching disabled');
      return;
    }

    try {
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        source: 'email-onebox',
      };

      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EmailOnebox/1.0',
        },
        timeout: 10000,
      });

      logger.info(`Custom webhook dispatched: ${event}`);
    } catch (error: any) {
      logger.error('Error dispatching custom webhook:', error.message);
    }
  }

  private buildPayload(email: Email): any {
    return {
      event: 'email.interested',
      timestamp: new Date().toISOString(),
      data: {
        messageId: email.messageId,
        accountId: email.accountId,
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.date,
        folder: email.folder,
        category: email.category,
        hasAttachments: email.hasAttachments,
        attachmentCount: email.attachments?.length || 0,
      },
    };
  }

  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
    this.enabled = !!url;
    logger.info(`Webhook URL updated: ${url}`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const webhookDispatcher = new WebhookDispatcher();
