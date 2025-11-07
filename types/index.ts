export interface EmailAccount {
  id: string;
  email: string;
  imap: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string; // encrypted
  };
  isActive: boolean;
  lastSyncDate?: Date;
  createdAt: Date;
}

export interface Email {
  id?: string;
  messageId: string;
  accountId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  htmlBody?: string;
  date: Date;
  folder: string;
  category?: EmailCategory;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  headers?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
}

export enum EmailCategory {
  INTERESTED = 'interested',
  MEETING_BOOKED = 'meeting_booked',
  NOT_INTERESTED = 'not_interested',
  SPAM = 'spam',
  OUT_OF_OFFICE = 'out_of_office',
  UNCATEGORIZED = 'uncategorized',
}

export interface SearchQuery {
  query?: string;
  accountId?: string;
  folder?: string;
  category?: EmailCategory;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface SyncStatus {
  accountId: string;
  isConnected: boolean;
  lastSync?: Date;
  emailsSynced: number;
  error?: string;
}