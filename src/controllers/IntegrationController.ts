import { Request, Response } from 'express';
import { slackNotifier } from '../services/integrations/SlackNotifier';
import { webhookDispatcher } from '../services/integrations/WebhookDispatcher';
import logger from '../utils/logger';

export class IntegrationController {
  async getSlackStatus(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        enabled: slackNotifier.isEnabled(),
      },
    });
  }

  async testSlackNotification(req: Request, res: Response): Promise<void> {
    try {
      await slackNotifier.sendCustomMessage(
        'Test notification from Email Onebox',
        '🧪 Test Message'
      );

      res.json({
        success: true,
        message: 'Test notification sent',
      });
    } catch (error: any) {
      logger.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getWebhookStatus(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        enabled: webhookDispatcher.isEnabled(),
      },
    });
  }

  async updateWebhookUrl(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          error: 'url is required',
        });
        return;
      }

      webhookDispatcher.setWebhookUrl(url);

      res.json({
        success: true,
        message: 'Webhook URL updated',
      });
    } catch (error: any) {
      logger.error('Error updating webhook URL:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      await webhookDispatcher.dispatchCustomEvent('test', {
        message: 'Test webhook from Email Onebox',
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Test webhook dispatched',
      });
    } catch (error: any) {
      logger.error('Error testing webhook:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}