import { Request, Response } from 'express';
import { imapManager } from '../services/imap/imapManager';
import logger from '../utils/logger';

export class SyncController {
  async startSync(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.body;

      if (!accountId) {
        res.status(400).json({
          success: false,
          error: 'accountId is required',
        });
        return;
      }

      await imapManager.startSync(accountId);

      res.json({
        success: true,
        message: 'Sync started successfully',
      });
    } catch (error: any) {
      logger.error('Error starting sync:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async startAllSyncs(req: Request, res: Response): Promise<void> {
    try {
      await imapManager.startAllSyncs();

      res.json({
        success: true,
        message: 'All syncs started',
        accountCount: imapManager.getAccountCount(),
      });
    } catch (error: any) {
      logger.error('Error starting all syncs:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async stopSync(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.body;

      if (!accountId) {
        res.status(400).json({
          success: false,
          error: 'accountId is required',
        });
        return;
      }

      imapManager.stopSync(accountId);

      res.json({
        success: true,
        message: 'Sync stopped successfully',
      });
    } catch (error: any) {
      logger.error('Error stopping sync:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.query;

      const status = imapManager.getSyncStatus(accountId as string);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Error getting sync status:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}