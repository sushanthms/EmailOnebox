import Imap from 'node-imap';
import type { ImapMessage } from 'node-imap';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';
import { EmailAccount, Email, EmailAddress, Attachment } from '../../types';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

export class ImapClient extends EventEmitter {
  private imap: any | null = null; // Changed from Imap to any
  private account: EmailAccount;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;


  constructor(account: EmailAccount) {
    super();
    this.account = account;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.imap && this.imap.state === 'authenticated')) {
      return;
    }

    this.isConnecting = true;

    try {
      const password = decrypt(this.account.imap.password);
      this.imap = new Imap({
        user: this.account.imap.user,
        password: password,
        host: this.account.imap.host,
        port: this.account.imap.port,
        tls: this.account.imap.secure,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: true,
        },
      });

      this.setupEventHandlers();
      await new Promise<void>((resolve, reject) => {
        this.imap!.once('ready', () => resolve());
        this.imap!.once('error', reject);
        this.imap!.connect();
      });

      logger.info(`IMAP connected for account: ${this.account.email}`);
      this.emit('connected', this.account.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0; // ADDED - Reset on successful connection
    } catch (error) {
      this.isConnecting = false;
      logger.error(`IMAP connection failed for ${this.account.email}:`, error);
      this.scheduleReconnect();
      throw error;
    }
  }

 private setupEventHandlers(): void {
    if (!this.imap) return;

    this.imap.on('error', (err: Error) => {
      logger.error(`IMAP error for ${this.account.email}:`, err);
      this.emit('error', err);
      this.scheduleReconnect();
    });

    this.imap.on('end', () => {
      logger.info(`IMAP connection ended for ${this.account.email}`);
      this.emit('disconnected', this.account.id);
      this.scheduleReconnect();
    });

    this.imap.on('mail', (numNew: number) => {
      logger.info(`${numNew} new mail(s) for ${this.account.email}`);
      this.fetchNewEmails();
    });
  }

  async openInbox(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not connected'));
        return;
      }

      this.imap.openBox('INBOX', false, (err: Error, box: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async startIdleMode(): Promise<void> {
    if (!this.imap) throw new Error('IMAP not connected');

    await this.openInbox();

    // Start IDLE mode for real-time updates
    this.imap.on('update', () => {
      logger.info(`Mailbox updated for ${this.account.email}`);
    });

    logger.info(`IDLE mode started for ${this.account.email}`);
  }

  async fetchRecentEmails(days: number = 30): Promise<Email[]> {
    if (!this.imap) throw new Error('IMAP not connected');

    return new Promise((resolve, reject) => {
      const searchDate = new Date();
      searchDate.setDate(searchDate.getDate() - days);

      this.imap!.search(['ALL', ['SINCE', searchDate]], (err: Error, results: number[]) => {
        if (err) {
          reject(err);
          return;
        }

        if (results.length === 0) {
          resolve([]);
          return;
        }

        const emails: Email[] = [];
        const fetch = this.imap!.fetch(results, { bodies: '', markSeen: false });

        fetch.on('message', (msg: any) => {
          let buffer = '';

          msg.on('body', (stream: NodeJS.ReadableStream) => {
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              const email = this.parseEmail(parsed);
              emails.push(email);
              this.emit('email', email);
            } catch (error) {
              logger.error('Error parsing email:', error);
            }
          });
        });

        fetch.once('error', reject);
        fetch.once('end', () => {
          logger.info(`Fetched ${emails.length} emails for ${this.account.email}`);
          resolve(emails);
        });
      });
    });
  }

  private async fetchNewEmails(): Promise<void> {
    if (!this.imap) return;

    try {
      // Fetch unseen emails
      this.imap.search(['UNSEEN'], (err: Error, results: number[]) => {
        if (err) {
          logger.error('Error searching for new emails:', err);
          return;
        }

        if (results.length === 0) return;

        const fetch = this.imap!.fetch(results, { bodies: '', markSeen: false });

        fetch.on('message', (msg: any) => {
          let buffer = '';

          msg.on('body', (stream: NodeJS.ReadableStream) => {
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              const email = this.parseEmail(parsed);
              this.emit('email', email);
              logger.info(`New email received: ${email.subject}`);
            } catch (error) {
              logger.error('Error parsing new email:', error);
            }
          });
        });

        fetch.once('error', (err: Error) => {
          logger.error('Error fetching new emails:', err);
        });
      });
    } catch (error) {
      logger.error('Error in fetchNewEmails:', error);
    }
  }

  private parseEmail(parsed: any): Email {
    const from: EmailAddress = {
      email: parsed.from?.value[0]?.address || '',
      name: parsed.from?.value[0]?.name,
    };

    const to: EmailAddress[] = (parsed.to?.value || []).map((addr: any) => ({
      email: addr.address || '',
      name: addr.name,
    }));

    const attachments: Attachment[] = (parsed.attachments || []).map((att: any) => ({
      filename: att.filename || 'unknown',
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || 0,
      content: att.content,
    }));

    return {
      messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
      accountId: this.account.id,
      from,
      to,
      cc: (parsed.cc?.value || []).map((addr: any) => ({
        email: addr.address || '',
        name: addr.name,
      })),
      subject: parsed.subject || '(No Subject)',
      body: parsed.text || '',
      htmlBody: parsed.html || undefined,
      date: parsed.date || new Date(),
      folder: 'INBOX',
      isRead: false,
      hasAttachments: attachments.length > 0,
      attachments: attachments.length > 0 ? attachments : undefined,
      headers: parsed.headers,
    };
  }

 private scheduleReconnect(): void {
    // ADDED - Check max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(
        `Max reconnection attempts (${this.maxReconnectAttempts}) reached for ${this.account.email}`
      );
      this.emit('max_reconnect_attempts', this.account.id);
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++; // ADDED
    const delay = Math.min(30000 * this.reconnectAttempts, 300000); // ADDED - Exponential backoff

    this.reconnectTimer = setTimeout(() => {
      logger.info(
        `Attempting to reconnect ${this.account.email} (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      this.connect().catch((err) => {
        logger.error(`Reconnection failed for ${this.account.email}:`, err);
      });
    }, delay); // CHANGED - Use exponential backoff
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.imap) {
      this.imap.removeAllListeners(); // ADDED - Prevent memory leaks
      this.imap.end();
      this.imap = null;
    }

    this.removeAllListeners(); // ADDED - Clean up event emitter

    logger.info(`IMAP disconnected for ${this.account.email}`);
  }

  getState(): string {
    return this.imap ? this.imap.state : 'disconnected';
  }
}