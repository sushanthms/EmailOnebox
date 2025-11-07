import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

export const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_NODE,
});

export const checkElasticConnection = async () => {
  try {
    const health = await elasticClient.cluster.health();
    console.log('✅ Elasticsearch connected:', health.status);
  } catch (err) {
    console.error('❌ Elasticsearch connection failed:', err);
  }
};
