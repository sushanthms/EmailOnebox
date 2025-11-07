import { WebClient } from '@slack/web-api';
import { config } from '../../config/env';
import { Email } from '../../types';
import logger from '../../utils/logger';

export class SlackNotifier {
  private client: WebClient | null = null;
  private channelId: string | null = null;
  private enabled: boolean = false;

  constructor() {
    this.enabled = !!(config.slack.botToken && config.slack.channelId);
    
    if (this.enabled) {
      this.client = new WebClient(config.slack.botToken);
      this.channelId = config.slack.channelId;
      logger.info('Slack notifier initialized');
    } else {
      logger.warn('Slack notifier disabled - missing configuration');
    }
  }

  async sendInterestedNotification(email: Email): Promise<void> {
    if (!this.enabled || !this.client || !this.channelId) {
      logger.warn('Slack notifications disabled');
      return;
    }

    try {
      const message = this.formatEmailMessage(email);

      await this.client.chat.postMessage({
        channel: this.channelId,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Interested Email',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${email.from.name || email.from.email}`,
              },
              {
                type: 'mrkdwn',
                text: `*Date:*\n${new Date(email.date).toLocaleString()}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Subject:*\n${email.subject}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${email.body.substring(0, 200)}${email.body.length > 200 ? '...' : ''}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Account: ${email.accountId} | Folder: ${email.folder}`,
              },
            ],
          },
          {
            type: 'divider',
          },
        ],
      });

      logger.info(`Slack notification sent for email: ${email.messageId}`);
    } catch (error) {
      logger.error('Error sending Slack notification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  async sendCustomMessage(text: string, title?: string): Promise<void> {
    if (!this.enabled || !this.client || !this.channelId) {
      logger.warn('Slack notifications disabled');
      return;
    }

    try {
      const blocks: any[] = [];

      if (title) {
        blocks.push({
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
            emoji: true,
          },
        });
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      });

      await this.client.chat.postMessage({
        channel: this.channelId,
        blocks,
      });

      logger.info('Custom Slack message sent');
    } catch (error) {
      logger.error('Error sending custom Slack message:', error);
    }
  }

  private formatEmailMessage(email: Email): string {
    return `
*New Interested Email*
From: ${email.from.name || email.from.email}
Subject: ${email.subject}
Date: ${new Date(email.date).toLocaleString()}

${email.body.substring(0, 300)}${email.body.length > 300 ? '...' : ''}
    `.trim();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const slackNotifier = new SlackNotifier();
