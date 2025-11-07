import type { PasswordEntry } from '../types';
import { generateId } from './password';

/**
 * Escapes special characters for CSV format
 */
const escapeCSV = (value: string): string => {
  return `"${value.replace(/"/g, '""')}"`;
};

/**
 * Validates CSV header format
 * @returns Object with validation result and error message
 */
export const validateCSVHeader = (content: string): { valid: boolean; error?: string } => {
  const lines = content.split('\n').filter((line) => line.trim() !== '');
  
  if (lines.length === 0) {
    return { valid: false, error: 'Arquivo CSV vazio.' };
  }

  const header = lines[0].toLowerCase().trim();
  const columns = header.split(',').map((col) => col.trim().replace(/^"|"$/g, ''));

  if (columns.length !== 3) {
    return {
      valid: false,
      error: `O arquivo deve ter exatamente 3 colunas.\n\nEncontrado: ${columns.length} coluna(s)\n\nFormato correto:\nurl,username,password`,
    };
  }

  const expectedColumns = ['url', 'username', 'password'];
  const isValid = columns.every((col, index) => col === expectedColumns[index]);

  if (!isValid) {
    return {
      valid: false,
      error: `Colunas incorretas ou fora de ordem.\n\nEncontrado:\n${columns.join(', ')}\n\nFormato correto:\nurl,username,password\n\n(nessa ordem exata)`,
    };
  }

  return { valid: true };
};

/**
 * Converts password list to CSV format
 */
export const passwordsToCSV = (passwords: PasswordEntry[]): string => {
  let csvContent = 'url,username,password\n';
  
  passwords.forEach((item) => {
    const service = escapeCSV(item.service);
    const username = escapeCSV(item.username);
    const password = escapeCSV(item.password);
    csvContent += `${service},${username},${password}\n`;
  });

  return csvContent;
};

/**
 * Parses CSV content to password entries
 * @returns Object with parsed passwords and error count
 */
export const csvToPasswords = async (
  content: string,
  existingPasswords: PasswordEntry[]
): Promise<{ passwords: PasswordEntry[]; errorCount: number }> => {
  const headerValidation = validateCSVHeader(content);
  if (!headerValidation.valid) {
    throw new Error(headerValidation.error);
  }

  const lines = content.split('\n').filter((line) => line.trim() !== '');
  const dataLines = lines.slice(1);

  const newPasswords: PasswordEntry[] = [];
  let errorCount = 0;

  for (const line of dataLines) {
    try {
      const regex = /("(?:[^"]|"")*"|[^,]*)/g;
      const matches = line.match(regex);
      
      if (!matches || matches.length < 3) {
        errorCount++;
        continue;
      }

      const service = matches[0].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      const username = matches[2].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      const password = matches[4].replace(/^"|"$/g, '').replace(/""/g, '"').trim();

      if (!service || !username || !password) {
        errorCount++;
        continue;
      }

      const exists = existingPasswords.some(
        (item) =>
          item.service === service &&
          item.username === username &&
          item.password === password
      );

      if (!exists) {
        newPasswords.push({
          id: await generateId(),
          service,
          username,
          password,
        });
      }
    } catch {
      errorCount++;
    }
  }

  return { passwords: newPasswords, errorCount };
};
