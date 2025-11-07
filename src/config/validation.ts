import Joi from 'joi';

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  ELASTICSEARCH_NODE: Joi.string().uri().required(),
  ELASTICSEARCH_INDEX: Joi.string().default('emails'),
  
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  
  OPENAI_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  OPENAI_MODEL: Joi.string().default('gpt-4-turbo-preview'),
  
  SLACK_BOT_TOKEN: Joi.string().optional(),
  SLACK_CHANNEL_ID: Joi.string().optional(),
  
  WEBHOOK_URL: Joi.string().uri().optional(),
  
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('change-me-in-production'),
  }),
  ENCRYPTION_KEY: Joi.string().length(32).when('NODE_ENV', {
    is: 'production',
    then: Joi.string().length(32).required(),
    otherwise: Joi.string().length(32).default('change-me-32-characters-long!!'),
  }),
}).unknown();

export function validateEnv() {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
  
  return value;
}