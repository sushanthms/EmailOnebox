import { esClient } from '../../config/elasticsearch';
import { config } from '../../config/env';
import { Email, SearchQuery } from '../../types';
import logger from '../../utils/logger';

export class SearchService {
  private index: string;

  constructor() {
    this.index = config.elasticsearch.index;
  }

  async searchEmails(query: SearchQuery): Promise<{
    emails: Email[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;

    try {
      const must: any[] = [];

      // Text search
      if (query.query) {
        must.push({
          multi_match: {
            query: query.query,
            fields: ['subject^3', 'body^2', 'from.name', 'from.email'],
            fuzziness: 'AUTO',
          },
        });
      }

      // Filter by account
      if (query.accountId) {
        must.push({ term: { accountId: query.accountId } });
      }

      // Filter by folder
      if (query.folder) {
        must.push({ term: { folder: query.folder } });
      }

      // Filter by category
      if (query.category) {
        must.push({ term: { category: query.category } });
      }

      // Date range
      if (query.from || query.to) {
        const range: any = {};
        if (query.from) range.gte = query.from;
        if (query.to) range.lte = query.to;
        must.push({ range: { date: range } });
      }

      const searchQuery: any = {
        bool: {},
      };

      if (must.length > 0) {
        searchQuery.bool.must = must;
      } else {
        searchQuery.bool.must = { match_all: {} };
      }

      const result = await esClient.search({
        index: this.index,
        body: {
          query: searchQuery,
          sort: [{ date: { order: 'desc' } }],
          from,
          size: limit,
        },
      });

      const emails = result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      })) as Email[];

      const total = typeof result.hits.total === 'number' 
        ? result.hits.total 
        : result.hits.total?.value || 0;

      return {
        emails,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error searching emails:', error);
      throw error;
    }
  }

  async getEmailsByCategory(
    category: string,
    accountId?: string
  ): Promise<Email[]> {
    try {
      const must: any[] = [{ term: { category } }];

      if (accountId) {
        must.push({ term: { accountId } });
      }

      const result = await esClient.search({
        index: this.index,
        body: {
          query: {
            bool: { must },
          },
          sort: [{ date: { order: 'desc' } }],
          size: 100,
        },
      });

      return result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      })) as Email[];
    } catch (error) {
      logger.error('Error getting emails by category:', error);
      throw error;
    }
  }

  async getEmailsByFolder(
    folder: string,
    accountId?: string
  ): Promise<Email[]> {
    try {
      const must: any[] = [{ term: { folder } }];

      if (accountId) {
        must.push({ term: { accountId } });
      }

      const result = await esClient.search({
        index: this.index,
        body: {
          query: {
            bool: { must },
          },
          sort: [{ date: { order: 'desc' } }],
          size: 100,
        },
      });

      return result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      })) as Email[];
    } catch (error) {
      logger.error('Error getting emails by folder:', error);
      throw error;
    }
  }
}

export const searchService = new SearchService();
