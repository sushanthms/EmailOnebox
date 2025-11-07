import { Client } from '@elastic/elasticsearch';
import { config } from './env';
import logger from '../utils/logger';

export const esClient = new Client({
  node: config.elasticsearch.node,
});

export async function initializeElasticsearch() {
  try {
    // Check if index exists
    const indexExists = await esClient.indices.exists({
      index: config.elasticsearch.index,
    });

    if (!indexExists) {
      // Create index with mappings
      await esClient.indices.create({
        index: config.elasticsearch.index,
        body: {
          mappings: {
            properties: {
              messageId: { type: 'keyword' },
              accountId: { type: 'keyword' },
              from: {
                properties: {
                  email: { type: 'keyword' },
                  name: { type: 'text' },
                },
              },
              to: {
                type: 'nested',
                properties: {
                  email: { type: 'keyword' },
                  name: { type: 'text' },
                },
              },
              subject: { type: 'text' },
              body: { type: 'text' },
              htmlBody: { type: 'text' },
              date: { type: 'date' },
              folder: { type: 'keyword' },
              category: { type: 'keyword' },
              isRead: { type: 'boolean' },
              hasAttachments: { type: 'boolean' },
              attachments: {
                type: 'nested',
                properties: {
                  filename: { type: 'text' },
                  contentType: { type: 'keyword' },
                  size: { type: 'integer' },
                },
              },
              headers: { type: 'object', enabled: false },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });

      logger.info(`Elasticsearch index '${config.elasticsearch.index}' created`);
    } else {
      logger.info(`Elasticsearch index '${config.elasticsearch.index}' already exists`);
    }
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch:', error);
    throw error;
  }
}
