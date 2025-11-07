export interface EmailAccount {
  id: string;
  email: string;
  imap: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface Email {
  messageId: string;
  accountId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[]; // ADDED
  subject: string;
  body: string;
  htmlBody?: string;
  date: Date;
  folder: string;
  category?: EmailCategory;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  headers?: any; // ADDED
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer; // ADDED
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
  from?: Date; // ADDED
  to?: Date; // ADDED
  page?: number;
  limit?: number;
}

// ADDED - Missing interface
export interface SyncStatus {
  accountId: string;
  isConnected: boolean;
  emailsSynced: number;
  lastSync?: Date;
  error?: string;
}
