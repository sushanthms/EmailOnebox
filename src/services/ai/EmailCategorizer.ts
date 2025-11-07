import OpenAI from 'openai';
import { config } from '../../config/env';
import { Email, EmailCategory } from '../../types';
import logger from '../../utils/logger';

export class EmailCategorizer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async categorizeEmail(email: Email): Promise<EmailCategory> {
    try {
      const prompt = this.buildPrompt(email);

      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert email categorization assistant. Categorize emails into exactly one of these categories:
- interested: Emails showing genuine interest in products/services, asking questions, or requesting information
- meeting_booked: Emails confirming meetings, appointments, or calendar invites
- not_interested: Clear rejections, unsubscribe requests, or negative responses
- spam: Promotional emails, newsletters, or obvious spam
- out_of_office: Automatic out-of-office or vacation replies

Respond with ONLY the category name in lowercase, nothing else.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const category = completion.choices[0]?.message?.content?.trim().toLowerCase();

      // Validate and return category
      const validCategories = Object.values(EmailCategory);
      if (category && validCategories.includes(category as EmailCategory)) {
        logger.info(`Email categorized as: ${category}`);
        return category as EmailCategory;
      }

      logger.warn(`Invalid category returned: ${category}, defaulting to uncategorized`);
      return EmailCategory.UNCATEGORIZED;
    } catch (error) {
      logger.error('Error categorizing email:', error);
      return EmailCategory.UNCATEGORIZED;
    }
  }

  private buildPrompt(email: Email): string {
    return `
Subject: ${email.subject}
From: ${email.from.name || email.from.email}
Body:
${email.body.substring(0, 1000)}

Categorize this email.`;
  }

  async categorizeBatch(emails: Email[]): Promise<Map<string, EmailCategory>> {
    const results = new Map<string, EmailCategory>();

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const promises = batch.map(async (email) => {
        const category = await this.categorizeEmail(email);
        results.set(email.messageId, category);
      });

      await Promise.all(promises);

      // Small delay to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

export const emailCategorizer = new EmailCategorizer();