import { EventEmitter } from 'events';
import { ImapClient } from './ImapClient';
import { EmailAccount, Email, SyncStatus } from '../../types';
import logger from '../../utils/logger';

export class ImapManager extends EventEmitter {
  private clients: Map<string, ImapClient> = new Map();
  private syncStatuses: Map<string, SyncStatus> = new Map();

  async addAccount(account: EmailAccount): Promise<void> {
    if (this.clients.has(account.id)) {
      logger.warn(`Account ${account.email} already exists`);
      return;
    }

    const client = new ImapClient(account);

    // Forward events
    client.on('email', (email: Email) => {
      this.emit('email', email);
      this.updateSyncStatus(account.id, { emailsSynced: 1 });
    });

    client.on('connected', (accountId: string) => {
      this.updateSyncStatus(accountId, {
        isConnected: true,
        lastSync: new Date(),
        error: undefined,
      });
    });

    client.on('disconnected', (accountId: string) => {
      this.updateSyncStatus(accountId, { isConnected: false });
    });

    client.on('error', (error: Error) => {
      this.updateSyncStatus(account.id, {
        isConnected: false,
        error: error.message,
      });
    });

    this.clients.set(account.id, client);
    this.syncStatuses.set(account.id, {
      accountId: account.id,
      isConnected: false,
      emailsSynced: 0,
    });

    logger.info(`Account added: ${account.email}`);
  }

  async startSync(accountId: string): Promise<void> {
    const client = this.clients.get(accountId);
    if (!client) {
      throw new Error(`Account not found: ${accountId}`);
    }

    try {
      await client.connect();
      
      // Fetch recent emails (last 30 days)
      const emails = await client.fetchRecentEmails(30);
      
      // Emit all fetched emails
      for (const email of emails) {
        this.emit('email', email);
      }

      // Start IDLE mode for real-time updates
      await client.startIdleMode();

      logger.info(`Sync started for account: ${accountId}`);
    } catch (error) {
      logger.error(`Failed to start sync for ${accountId}:`, error);
      throw error;
    }
  }

  async startAllSyncs(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((accountId) =>
      this.startSync(accountId).catch((err) => {
        logger.error(`Failed to start sync for ${accountId}:`, err);
      })
    );

    await Promise.allSettled(promises);
  }

  stopSync(accountId: string): void {
    const client = this.clients.get(accountId);
    if (client) {
      client.disconnect();
      logger.info(`Sync stopped for account: ${accountId}`);
    }
  }

  stopAllSyncs(): void {
    this.clients.forEach((client, accountId) => {
      client.disconnect();
    });
    logger.info('All syncs stopped');
  }

  removeAccount(accountId: string): void {
    const client = this.clients.get(accountId);
    if (client) {
      client.disconnect();
      this.clients.delete(accountId);
      this.syncStatuses.delete(accountId);
      logger.info(`Account removed: ${accountId}`);
    }
  }

  getSyncStatus(accountId?: string): SyncStatus | SyncStatus[] | null {
    if (accountId) {
      return this.syncStatuses.get(accountId) || null;
    }
    return Array.from(this.syncStatuses.values());
  }

  private updateSyncStatus(
    accountId: string,
    updates: Partial<SyncStatus>
  ): void {
    const current = this.syncStatuses.get(accountId);
    if (current) {
      this.syncStatuses.set(accountId, {
        ...current,
        ...updates,
        emailsSynced:
          current.emailsSynced + (updates.emailsSynced || 0),
      });
    }
  }

  getAccountCount(): number {
    return this.clients.size;
  }

  getAllAccounts(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Export singleton instance
export const imapManager = new ImapManager();