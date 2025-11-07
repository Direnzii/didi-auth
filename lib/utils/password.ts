import { PASSWORD_CONFIG } from '../constants/storage';
import { getSecureRandomBytes, getSecureRandomInt } from './encryption';

/**
 * Generates a strong random password using cryptographically secure random
 * @returns A 15-character password with uppercase, lowercase, numbers and special characters
 */
export const generateStrongPassword = async (): Promise<string> => {
  const { UPPERCASE, LOWERCASE, NUMBERS, SPECIAL } = PASSWORD_CONFIG.CHARSET;
  const allChars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;

  let password = '';
  
  password += UPPERCASE[await getSecureRandomInt(0, UPPERCASE.length)];
  password += LOWERCASE[await getSecureRandomInt(0, LOWERCASE.length)];
  password += NUMBERS[await getSecureRandomInt(0, NUMBERS.length)];
  password += SPECIAL[await getSecureRandomInt(0, SPECIAL.length)];

  for (let i = password.length; i < PASSWORD_CONFIG.LENGTH; i++) {
    password += allChars[await getSecureRandomInt(0, allChars.length)];
  }

  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = await getSecureRandomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

/**
 * Generates a cryptographically secure 6-digit random hash for file naming
 */
export const generateHash = async (): Promise<string> => {
  const randomInt = await getSecureRandomInt(100000, 999999);
  return randomInt.toString();
};

/**
 * Generates a cryptographically secure unique ID for password entries
 */
export const generateId = async (): Promise<string> => {
  const randomBytes = await getSecureRandomBytes(6);
  const randomStr = Array.from(randomBytes, (byte) => 
    byte.toString(36)
  ).join('').substring(0, 9);
  return `${Date.now()}-${randomStr}`;
};
