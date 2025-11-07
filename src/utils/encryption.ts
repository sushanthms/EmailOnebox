import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY = Buffer.from(config.security.encryptionKey);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return iv.toString('hex') + encrypted + tag.toString('hex');
}

export function decrypt(encryptedData: string): string {
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
  const tag = Buffer.from(encryptedData.slice(-TAG_LENGTH * 2), 'hex');
  const encrypted = encryptedData.slice(IV_LENGTH * 2, -TAG_LENGTH * 2);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
