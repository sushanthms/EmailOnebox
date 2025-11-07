import { Request, Response } from 'express';
import { searchService } from '../services/elasticsearch/SearchService';
import { emailIndexer } from '../services/elasticsearch/emailIndexer';
import { SearchQuery } from '../types';
import logger from '../utils/logger';

export class EmailController {
  async searchEmails(req: Request, res: Response): Promise<void> {
    try {
      const query: SearchQuery = {
        query: req.query.q as string,
        accountId: req.query.accountId as string,
        folder: req.query.folder as string,
        category: req.query.category as any,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      if (req.query.from) {
        query.from = new Date(req.query.from as string);
      }
      if (req.query.to) {
        query.to = new Date(req.query.to as string);
      }

      const result = await searchService.searchEmails(query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error searching emails:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getEmailById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const email = await emailIndexer.getEmailById(id);

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found',
        });
        return;
      }

      res.json({
        success: true,
        data: email,
      });
    } catch (error: any) {
      logger.error('Error getting email:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getEmailsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const { accountId } = req.query;

      const emails = await searchService.getEmailsByCategory(
        category,
        accountId as string
      );

      res.json({
        success: true,
        data: emails,
        count: emails.length,
      });
    } catch (error: any) {
      logger.error('Error getting emails by category:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getEmailsByFolder(req: Request, res: Response): Promise<void> {
    try {
      const { folder } = req.params;
      const { accountId } = req.query;

      const emails = await searchService.getEmailsByFolder(
        folder,
        accountId as string
      );

      res.json({
        success: true,
        data: emails,
        count: emails.length,
      });
    } catch (error: any) {
      logger.error('Error getting emails by folder:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}