import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { EmailAccount } from '../types';
import { imapManager } from '../services/imap/ImapManager';
import { encrypt } from '../utils/encryption';
import { redisClient } from '../config/redis';
import logger from '../utils/logger';

export class AccountController {
  async addAccount(req: Request, res: Response): Promise<void> {
    try {
      const { email, imapHost, imapPort, imapSecure, imapUser, imapPassword } = req.body;

      // Validation
      if (!email || !imapHost || !imapUser || !imapPassword) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const account: EmailAccount = {
        id: uuidv4(),
        email,
        imap: {
          host: imapHost,
          port: imapPort || 993,
          secure: imapSecure !== false,
          user: imapUser,
          password: encrypt(imapPassword),
        },
        isActive: true,
        createdAt: new Date(),
      };

      // Store account in Redis
      await redisClient.set(
        `account:${account.id}`,
        JSON.stringify(account)
      );

      // Add to IMAP manager
      await imapManager.addAccount(account);

      res.status(201).json({
        success: true,
        data: {
          id: account.id,
          email: account.email,
          isActive: account.isActive,
        },
      });
    } catch (error: any) {
      logger.error('Error adding account:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAccounts(req: Request, res: Response): Promise<void> {
    try {
      const keys = await redisClient.keys('account:*');
      const accounts = [];

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const account = JSON.parse(data);
          // Don't send password
          delete account.imap.password;
          accounts.push(account);
        }
      }

      res.json({
        success: true,
        data: accounts,
        count: accounts.length,
      });
    } catch (error: any) {
      logger.error('Error getting accounts:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await redisClient.get(`account:${id}`);

      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Account not found',
        });
        return;
      }

      const account = JSON.parse(data);
      delete account.imap.password;

      res.json({
        success: true,
        data: account,
      });
    } catch (error: any) {
      logger.error('Error getting account:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Stop sync and remove from manager
      imapManager.removeAccount(id);

      // Remove from Redis
      await redisClient.del(`account:${id}`);

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}