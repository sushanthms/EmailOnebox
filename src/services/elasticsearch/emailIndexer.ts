import { esClient } from '../../config/elasticsearch';
import { config } from '../../config/env';
import { Email } from '../../types';
import logger from '../../utils/logger';

export class EmailIndexer {
  private index: string;

  constructor() {
    this.index = config.elasticsearch.index;
  }

  async indexEmail(email: Email): Promise<string> {
    try {
      const document = {
        ...email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Remove large binary attachments before indexing
      if (document.attachments) {
        document.attachments = document.attachments.map((att) => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          // Don't store content in ES
        }));
      }

      const result = await esClient.index({
        index: this.index,
        id: email.messageId,
        document,
      });

      logger.info(`Email indexed: ${email.messageId}`);
      return result._id;
    } catch (error) {
      logger.error('Error indexing email:', error);
      throw error;
    }
  }

  async bulkIndexEmails(emails: Email[]): Promise<void> {
    try {
      const body = emails.flatMap((email) => {
        const document = {
          ...email,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Remove large binary attachments
        if (document.attachments) {
          document.attachments = document.attachments.map((att) => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
          }));
        }

        return [
          { index: { _index: this.index, _id: email.messageId } },
          document,
        ];
      });

      const result = await esClient.bulk({ body });

      if (result.errors) {
        logger.error('Bulk indexing had errors');
      } else {
        logger.info(`Bulk indexed ${emails.length} emails`);
      }
    } catch (error) {
      logger.error('Error in bulk indexing:', error);
      throw error;
    }
  }

  async updateEmail(
    messageId: string,
    updates: Partial<Email>
  ): Promise<void> {
    try {
      await esClient.update({
        index: this.index,
        id: messageId,
        doc: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      logger.info(`Email updated: ${messageId}`);
    } catch (error) {
      logger.error('Error updating email:', error);
      throw error;
    }
  }

  async deleteEmail(messageId: string): Promise<void> {
    try {
      await esClient.delete({
        index: this.index,
        id: messageId,
      });

      logger.info(`Email deleted: ${messageId}`);
    } catch (error) {
      logger.error('Error deleting email:', error);
      throw error;
    }
  }

  async getEmailById(messageId: string): Promise<Email | null> {
    try {
      const result = await esClient.get({
        index: this.index,
        id: messageId,
      });

      return result._source as Email;
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      logger.error('Error getting email:', error);
      throw error;
    }
  }
}

export const emailIndexer = new EmailIndexer();
