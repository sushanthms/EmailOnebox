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
  subject: string;
  body: string;
  htmlBody?: string;
  date: Date;
  folder: string;
  category?: EmailCategory;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
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
  page?: number;
  limit?: number;
}
